// Authentication Routes for MiProfesional Backend

const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Professional = require('../models/Professional');
const logger = require('../utils/logger');
const { generarToken, verificarToken } = require('../config/jwt');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { authenticate } = require('../middleware/auth');
const eventBus = require('../services/eventBus');

const router = express.Router();

// Security: Blocked disposable/test email domains
const BLOCKED_DOMAINS = [
  'test.com', 'example.com', 'example.org', 'example.net',
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.com',
  'yopmail.com', 'sharklasers.com', 'trashmail.com', '10minutemail.com',
  'mailnator.com'
];

// Security: Patterns that suggest test/debug accounts
const TEST_PATTERNS = [
  /^test/i, /^debug/i, /^prueba/i, /^electest/i, /^proftest/i,
  /^testprof/i, /^testclient/i, /^testuser/i, /^debuguser/i,
  /^asdf/i, /^qwerty/i, /^aaa/i, /^xxx/i
];

const HONEYPOT_FIELD = 'website';

// Security middleware for registration
const validateRegistrationSecurity = (req, res, next) => {
  if (req.body[HONEYPOT_FIELD]) {
    logger.logSecurityRequest('honeypot_triggered', req, { field: HONEYPOT_FIELD });
    return res.status(201).json({
      success: true,
      message: 'Registro exitoso. Revise su correo para verificar la cuenta.'
    });
  }

  const { email, name } = req.body;

  if (email) {
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && BLOCKED_DOMAINS.includes(domain)) {
      logger.logSecurityRequest('blocked_domain', req, { email, domain });
      return res.status(400).json({
        success: false,
        error: 'Dominio de email no permitido',
        message: 'Por favor use un correo electronico valido'
      });
    }
  }

  if (name) {
    for (const pattern of TEST_PATTERNS) {
      if (pattern.test(name)) {
        logger.logSecurityRequest('blocked_name_pattern', req, { name });
        return res.status(400).json({
          success: false,
          error: 'Nombre no permitido',
          message: 'Por favor use un nombre valido'
        });
      }
    }
  }

  if (email) {
    const emailPrefix = email.split('@')[0];
    if (emailPrefix && emailPrefix.length < 3) {
      logger.logSecurityRequest('blocked_short_email', req, { email });
      return res.status(400).json({
        success: false,
        error: 'Email no permitido',
        message: 'Por favor use un correo electronico valido'
      });
    }
    if (/^\d+$/.test(emailPrefix)) {
      logger.logSecurityRequest('blocked_numeric_email', req, { email });
      return res.status(400).json({
        success: false,
        error: 'Email no permitido',
        message: 'Por favor use un correo electronico valido'
      });
    }
  }

  next();
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Demasiados intentos. Intente nuevamente en 15 minutos.' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Demasiados registros desde esta IP. Intente mas tarde.' }
});

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Demasiados intentos. Intente nuevamente en 15 minutos.' }
});

// === PASSPORT GOOGLE OAUTH STRATEGY ===
const GoogleStrategy = require('passport-google-oauth20').Strategy;

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findByAuthProvider('google', profile.id);
      if (!user) {
        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await User.findOne({ email });
          if (user) {
            user.authProvider = 'google';
            user.authProviderId = profile.id;
            user.authProviderData = { googleId: profile.id, displayName: profile.displayName };
            user.isVerified = true;
            await user.save();
            return done(null, user);
          }
        }
        user = new User({
          authProvider: 'google',
          authProviderId: profile.id,
          authProviderData: { googleId: profile.id, displayName: profile.displayName },
          name: profile.displayName || profile.name?.givenName || 'Usuario',
          email: email || `${profile.id}@google-oauth.miprofesional.online`,
          password: crypto.randomBytes(32).toString('hex'),
          isVerified: true,
          avatar: profile.photos?.[0]?.value || null,
          role: 'client',
          termsAccepted: true,
          termsAcceptedAt: new Date()
        });
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
}

// Serialization for session (if using sessions)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// JWT token generation
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h', issuer: 'miprofesional-api', audience: 'miprofesional-app' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', issuer: 'miprofesional-api', audience: 'miprofesional-app' }
  );

  return { accessToken, refreshToken };
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
      message: 'Please provide a valid access token'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'Please login again'
      });
    }

    req.userId = decoded.userId;
    next();
  });
};

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Please check your input',
      errors: errors.array()
    });
  }
  next();
};

// POST /api/v1/auth/register
router.post('/register', registerLimiter, validateRegistrationSecurity, [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long').matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter').matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('role').optional().isIn(['client', 'professional', 'employer', 'company']).withMessage('Role must be client, professional, employer or company'),
  body('address').optional().isObject(),
  body('address.street').optional().trim(),
  body('address.number').optional().trim(),
  body('address.city').optional().trim(),
  body('address.state').optional().trim(),
  body('categoryId').optional().isMongoId().withMessage('Invalid category ID'),
  body('subcategoryId').optional().isMongoId().withMessage('Invalid subcategory ID'),
  body('available24h').optional().isBoolean().withMessage('available24h must be a boolean'),
  body('disponible24hs').optional().isBoolean().withMessage('disponible24hs must be a boolean'),
  body('disponibleFinesDeSemana').optional().isBoolean().withMessage('disponibleFinesDeSemana must be a boolean'),
  body('disponibleFeriados').optional().isBoolean().withMessage('disponibleFeriados must be a boolean'),
  body('atencionInmediata').optional().isBoolean().withMessage('atencionInmediata must be a boolean'),
  body('servicioADomicilio').optional().isBoolean().withMessage('servicioADomicilio must be a boolean'),
  body('termsAccepted').isBoolean().withMessage('Debe aceptar los Términos y Condiciones').custom(value => {
    if (value !== true) throw new Error('Debe aceptar los Términos y Condiciones para registrarse');
    return true;
  })
], handleValidationErrors, async (req, res) => {
  try {
    const { name, email, password, phone, location, address, role = 'client', profession, categoryId, subcategoryId, available24h, disponible24hs, disponibleFinesDeSemana, disponibleFeriados, atencionInmediata, servicioADomicilio, acceptMarketing, termsAccepted } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.isActive) {
        return res.status(409).json({
          success: false,
          error: 'User already exists',
          message: 'A user with this email already exists'
        });
      }

      // Reactivate deactivated account
      existingUser.name = name;
      existingUser.password = password;
      existingUser.role = role;
      if (phone) existingUser.phone = phone;
      if (location) existingUser.location = location;
      if (address) existingUser.address = { ...existingUser.address?.toObject?.() || existingUser.address || {}, ...address };
      existingUser.isActive = true;
      existingUser.deactivatedAt = undefined;
      existingUser.termsAccepted = true;
      existingUser.termsAcceptedAt = new Date();
      existingUser.preferences = {
        emailAlerts: acceptMarketing || false,
        notifications: true,
        language: 'es',
        currency: 'ARS'
      };
      existingUser.generateVerificationToken();
      await existingUser.save();

      // Deactivate any existing professional profile
      await Professional.updateMany(
        { userId: existingUser._id },
        { isActive: false, 'subscription.status': 'inactive' }
      );

      // If re-registering as professional, set up trial
      if (role === 'professional') {
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const existingPro = await Professional.findOne({ userId: existingUser._id });
        if (existingPro) {
          existingPro.isActive = true;
          existingPro.profileStatus = 'ACTIVE';
          if (categoryId) existingPro.categoryId = categoryId;
          if (subcategoryId) existingPro.subcategoryId = subcategoryId;
          if (available24h !== undefined) existingPro.available24h = available24h;
          if (disponible24hs !== undefined) existingPro.disponible24hs = disponible24hs;
          if (disponibleFinesDeSemana !== undefined) existingPro.disponibleFinesDeSemana = disponibleFinesDeSemana;
          if (disponibleFeriados !== undefined) existingPro.disponibleFeriados = disponibleFeriados;
          if (atencionInmediata !== undefined) existingPro.atencionInmediata = atencionInmediata;
          if (servicioADomicilio !== undefined) existingPro.servicioADomicilio = servicioADomicilio;
          existingPro.subscription = {
            status: 'trial',
            trialStart: now,
            trialEnd: trialEnd,
          };
          await existingPro.save();
        } else {
          await new Professional({
            userId: existingUser._id,
            businessName: name,
            profession: profession || 'pendiente',
            categoryId: categoryId || undefined,
            subcategoryId: subcategoryId || undefined,
            available24h: available24h === true,
            disponible24hs: disponible24hs === true,
            disponibleFinesDeSemana: disponibleFinesDeSemana === true,
            disponibleFeriados: disponibleFeriados === true,
            atencionInmediata: atencionInmediata === true,
            servicioADomicilio: servicioADomicilio === true,
            description: 'Completa tu perfil profesional',
            contact: { phone: phone || '+000000000000', email: existingUser.email },
            location: { address: 'pendiente', city: 'pendiente', state: 'pendiente', country: 'Argentina', coordinates: { type: 'Point', coordinates: [0, 0] } },
            pricing: { hourlyRate: 0, currency: 'ARS' },
            isActive: true,
            profileStatus: 'ACTIVE',
            subscription: {
              status: 'trial',
              trialStart: now,
              trialEnd: trialEnd,
            },
          }).save();
        }
      }

      eventBus.emit('user:registered', { email: existingUser.email, name: existingUser.name, token: existingUser.verificationToken });

      logger.logRegistration('register_reactivated', existingUser._id, existingUser.email, req, true);
      const publicUser = existingUser.toJSON();

      const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';

      if (requireEmailVerification) {
        return res.status(200).json({
          success: true,
          message: 'Cuenta reactivada. Revise su correo para verificar la cuenta antes de iniciar sesion.',
          user: publicUser,
          data: {
            user: publicUser,
            emailVerified: existingUser.emailVerified || false,
            requiresEmailVerification: true
          }
        });
      }

      const { accessToken, refreshToken } = generateTokens(existingUser._id);

      return res.status(200).json({
        success: true,
        message: 'Cuenta reactivada. Revise su correo para verificar la cuenta.',
        user: publicUser,
        accessToken,
        refreshToken,
        data: {
          user: publicUser,
          token: accessToken,
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '24h',
          emailVerified: existingUser.emailVerified || false
        }
      });
    }

    // Create new user
    const userData = {
      name,
      email,
      password,
      role,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      preferences: {
        emailAlerts: acceptMarketing || false,
        notifications: true,
        language: 'es',
        currency: 'ARS'
      }
    };
    if (phone) userData.phone = phone;
    if (location) userData.location = location;
    if (address) userData.address = { ...{ street: '', number: '', neighborhood: '', city: '', state: '', country: 'Argentina' }, ...address };
    const user = new User(userData);

    user.generateVerificationToken();
    await user.save();

    // Create professional record if role is professional
    if (role === 'professional') {
      try {
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const professional = new Professional({
          userId: user._id,
          businessName: name,
          profession: profession || 'pendiente',
          categoryId: categoryId || undefined,
          subcategoryId: subcategoryId || undefined,
          description: 'Completa tu perfil profesional',
          contact: { phone: phone || '+000000000000', email: user.email },
          location: {
            address: 'pendiente',
            city: 'pendiente',
            state: 'pendiente',
            country: 'Argentina',
            coordinates: { type: 'Point', coordinates: [0, 0] }
          },
          pricing: { hourlyRate: 0, currency: 'ARS' },
          isActive: true,
          profileStatus: 'ACTIVE',
          available24h: available24h === true,
          disponible24hs: disponible24hs === true,
          disponibleFinesDeSemana: disponibleFinesDeSemana === true,
          disponibleFeriados: disponibleFeriados === true,
          atencionInmediata: atencionInmediata === true,
          servicioADomicilio: servicioADomicilio === true,
          subscription: {
            status: 'trial',
            trialStart: now,
            trialEnd: trialEnd,
          },
        });
        await professional.save();
      } catch (proErr) {
        logger.error('Failed to create professional record on register', { error: proErr.message, userId: user._id });
      }
    }

    eventBus.emit('user:registered', { email: user.email, name: user.name, token: user.verificationToken });

    logger.logRegistration('register', user._id, user.email, req, true);

    const publicUser = user.toJSON();

    const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';

    if (requireEmailVerification) {
      res.status(201).json({
        success: true,
        message: 'Registro exitoso. Revise su correo para verificar la cuenta antes de iniciar sesion.',
        user: publicUser,
        data: {
          user: publicUser,
          emailVerified: false,
          requiresEmailVerification: true
        }
      });
    } else {
      const { accessToken, refreshToken } = generateTokens(user._id);

      res.status(201).json({
        success: true,
        message: 'Registro exitoso. Revise su correo para verificar la cuenta.',
        user: publicUser,
        accessToken,
        refreshToken,
        data: {
          user: publicUser,
          token: accessToken,
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '24h',
          emailVerified: user.emailVerified || false
        }
      });
    }

  } catch (error) {
    logger.logRegistration('register_error', null, req.body.email, req, false, error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
});

// POST /api/v1/auth/login
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  body('rememberMe').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  let timer;
  try {
    const start = Date.now();
    timer = setTimeout(() => {
      if (!res.headersSent) {
        logger.error('Login timeout after 20s', { email: req.body.email });
        return res.status(504).json({
          success: false,
          error: 'Timeout',
          message: 'El servidor tardo demasiado en responder. Intenta nuevamente.'
        });
      }
    }, 20000);

    const { email, password } = req.body;

    const user = await User.findByEmail(email);

    if (!user) {
      clearTimeout(timer);
      logger.logAuth('login', null, req.ip, false, { email, reason: 'user_not_found' });
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    if (!user.isActive) {
      clearTimeout(timer);
      logger.logAuth('login', user._id, req.ip, false, { reason: 'account_inactive' });
      return res.status(401).json({
        success: false,
        error: 'Account inactive',
        message: 'Your account has been deactivated'
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      clearTimeout(timer);
      logger.logAuth('login', user._id, req.ip, false, { reason: 'invalid_password' });
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    user.lastLogin = new Date();

    // Auto-promote to admin only if no admin exists in the system
    if (user.role !== 'admin') {
      const adminExists = await User.findOne({ role: 'admin', isActive: true }).maxTimeMS(5000);
      if (!adminExists) {
        user.role = 'admin';
      }
    }

    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);

    clearTimeout(timer);
    logger.logAuth('login', user._id, req.ip, true);
    logger.info('Login completed', { email, timeMs: Date.now() - start });

    const publicUser = user.toJSON();

    res.json({
      success: true,
      message: 'Login successful',
      user: publicUser,
      accessToken,
      refreshToken,
      data: {
        user: publicUser,
        token: accessToken,
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    });

  } catch (error) {
    clearTimeout(timer);
    logger.error('Login error', { error: error.message, email: req.body.email });
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: 'Error interno. Intenta nuevamente.'
    });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a real implementation, you would invalidate the token in a blacklist
    // For now, we'll just log the logout
    logger.logAuth('logout', req.userId, req.ip, true);

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error', { error: error.message, userId: req.userId });
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: 'An error occurred during logout'
    });
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', sensitiveLimiter, [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required',
        message: 'Please provide a valid refresh token'
      });
    }

    // Verify refresh token
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: 'Invalid or expired refresh token',
          message: 'Please login again'
        });
      }

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'User not found or inactive',
          message: 'Please login again'
        });
      }

      // Generate new tokens
      const tokens = generateTokens(user._id);

      logger.logAuth('refresh', user._id, req.ip, true);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        }
      });
    });

  } catch (error) {
    logger.error('Token refresh error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      message: 'An error occurred while refreshing token'
    });
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User account not found'
      });
    }

    const publicUser = user.toJSON();

    res.json({
      success: true,
      message: 'User profile retrieved successfully',
      user: publicUser,
      data: publicUser
    });

  } catch (error) {
    logger.error('Get profile error', { error: error.message, userId: req.userId });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile',
      message: 'An error occurred while retrieving your profile'
    });
  }
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', sensitiveLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], handleValidationErrors, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      logger.logAuth('forgot_password', null, req.ip, false, { email, reason: 'user_not_found' });
      return res.json({
        success: true,
        message: 'Si el email existe, recibiras un enlace de recuperacion'
      });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    eventBus.emit('user:password-reset-requested', { email, name: user.name, token: resetToken });

    logger.logAuth('forgot_password', user._id, req.ip, true);

    res.json({
      success: true,
      message: 'Si el email existe, recibiras un enlace de recuperacion'
    });

  } catch (error) {
    logger.error('Forgot password error', { error: error.message, email: req.body.email });
    res.status(500).json({
      success: false,
      error: 'Failed to process password reset',
      message: 'An error occurred while processing your request'
    });
  }
});

// POST /api/v1/auth/reset-password
router.post('/reset-password', sensitiveLimiter, [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match');
    }
    return true;
  })
], handleValidationErrors, async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    // Find user by reset token
    const user = await User.findByResetToken(token);

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'The password reset link is invalid or has expired'
      });
    }

    // Update password
    user.password = newPassword;
    user.clearPasswordResetFields();
    await user.save();

    eventBus.emit('user:password-changed', { email: user.email, name: user.name });

    logger.logAuth('reset_password', user._id, req.ip, true);

    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    logger.error('Reset password error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to reset password',
      message: 'An error occurred while resetting your password'
    });
  }
});

// PUT /api/v1/auth/change-password
router.put('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match');
    }
    return true;
  })
], handleValidationErrors, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User account not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid current password',
        message: 'Your current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    eventBus.emit('user:password-changed', { email: user.email, name: user.name });

    logger.logAuth('change_password', user._id, req.ip, true);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('Change password error', { error: error.message, userId: req.userId });
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      message: 'An error occurred while changing your password'
    });
  }
});

// === GOOGLE OAUTH ROUTES ===

// GET /auth/google — Initiate Google OAuth
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
  }
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    prompt: 'select_account'
  })(req, res, next);
});

// GET /auth/google/callback — Google OAuth callback
router.get('/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
  }
  passport.authenticate('google', { session: false, failWithError: true }, (err, user, info) => {
    if (err || !user) {
      const errorMsg = err ? err.message : 'Autenticacion con Google fallo';
      logger.error('Google auth error', { error: errorMsg });
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`);
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    logger.logAuth('google_login', user._id, req.ip, true);

    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?token=${accessToken}&refreshToken=${refreshToken}&provider=google`;
    res.redirect(redirectUrl);
  })(req, res, next);
});

// === SMS / PHONE VERIFICATION ROUTES ===

// POST /auth/send-verification — Send SMS code
router.post('/send-verification', sensitiveLimiter, [
  body('phone').matches(/^\+?[\d\s-()]+$/).withMessage('Telefono invalido')
], handleValidationErrors, async (req, res) => {
  try {
    const { phone } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000;

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      existingUser.phoneVerificationCode = code;
      existingUser.phoneVerificationExpires = expires;
      await existingUser.save();
    } else {
      const tempUser = req.userId ? await User.findById(req.userId) : null;
      if (tempUser) {
        tempUser.phone = phone;
        tempUser.phoneVerificationCode = code;
        tempUser.phoneVerificationExpires = expires;
        await tempUser.save();
      }
    }

    logger.info('SMS verification code sent', { phone, code });

    // In production: send via Twilio/SMS provider
    // For dev: return code directly for testing
    res.json({
      success: true,
      message: 'Codigo de verificacion enviado',
      data: process.env.NODE_ENV === 'development' ? { code } : {}
    });
  } catch (error) {
    logger.error('Send verification error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error al enviar codigo',
      message: 'No se pudo enviar el codigo de verificacion'
    });
  }
});

// POST /auth/verify-phone — Verify SMS code
router.post('/verify-phone', sensitiveLimiter, [
  body('code').isLength({ min: 6, max: 6 }).withMessage('Codigo de 6 digitos requerido'),
  body('phone').optional().matches(/^\+?[\d\s-()]+$/)
], handleValidationErrors, async (req, res) => {
  try {
    const { code, phone } = req.body;
    const userId = req.userId;
    let user;

    if (userId) {
      user = await User.findById(userId);
    } else if (phone) {
      user = await User.findOne({ phone });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
        message: 'No se encontro el usuario para verificar'
      });
    }

    if (user.phoneVerificationCode !== code) {
      return res.status(400).json({
        success: false,
        error: 'Codigo invalido',
        message: 'El codigo ingresado es incorrecto'
      });
    }

    if (user.phoneVerificationExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        error: 'Codigo expirado',
        message: 'El codigo ha expirado. Solicite uno nuevo.'
      });
    }

    user.phoneVerified = true;
    user.phoneVerificationCode = null;
    user.phoneVerificationExpires = null;
    await user.save();

    logger.logAuth('phone_verified', user._id, req.ip, true);

    res.json({
      success: true,
      message: 'Telefono verificado exitosamente'
    });
  } catch (error) {
    logger.error('Verify phone error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error al verificar',
      message: 'No se pudo verificar el telefono'
    });
  }
});

// === EMAIL VERIFICATION ===

// GET /auth/verify-email/:token — Verify email address
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findByVerificationToken(token);

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Token invalido',
        message: 'El enlace de verificacion es invalido o ha expirado'
      });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    eventBus.emit('user:verified', { email: user.email, name: user.name });

    logger.logAuth('email_verified', user._id, req.ip, true);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?verified=true`);
  } catch (error) {
    logger.error('Email verification error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error de verificacion',
      message: 'No se pudo verificar el correo electronico'
    });
  }
});

// DELETE /auth/account — Deactivate own account
router.delete('/account', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    user.isActive = false;
    user.deactivatedAt = new Date();
    await user.save();

    await Professional.updateMany({ userId: req.userId }, { isActive: false });

    logger.logAuth('account_deactivated', req.userId, req.ip, true);
    res.json({ success: true, message: 'Cuenta desactivada exitosamente' });
  } catch (error) {
    logger.error('Delete account error', { error: error.message });
    res.status(500).json({ success: false, message: 'Error al desactivar la cuenta' });
  }
});

// POST /auth/setup-admin — Promote own user to admin (one-time, no existing admin)
router.post('/setup-admin', authenticate, async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin', isActive: true });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Ya existe un administrador' });
    }
    const user = await User.findByIdAndUpdate(req.userId, { role: 'admin' }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    logger.logAuth('admin_setup', req.userId, req.ip, true);
    res.json({ success: true, message: 'Administrador configurado exitosamente', data: user });
  } catch (error) {
    logger.error('Setup admin error', { error: error.message });
    res.status(500).json({ success: false, message: 'Error al configurar administrador' });
  }
});

module.exports = router;
