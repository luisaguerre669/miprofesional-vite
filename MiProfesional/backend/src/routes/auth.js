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
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const router = express.Router();

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
          role: 'client'
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
router.post('/register', registerLimiter, [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn(['client', 'professional']).withMessage('Role must be client or professional')
], handleValidationErrors, async (req, res) => {
  try {
    const { name, email, password, phone, location, role = 'client', profession, acceptMarketing } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
    }

    // Create new user
    const userData = {
      name,
      email,
      password,
      role,
      preferences: {
        emailAlerts: acceptMarketing || false,
        notifications: true,
        language: 'es',
        currency: 'ARS'
      }
    };
    if (phone) userData.phone = phone;
    if (location) userData.location = location;
    const user = new User(userData);

    user.generateVerificationToken();
    await user.save();

    // Create professional record if role is professional
    if (role === 'professional') {
      try {
        const professional = new Professional({
          userId: user._id,
          profession: profession || '',
          isActive: false,
          subscription: {
            status: 'pending_payment',
          },
          contact: { email: user.email },
          location: { country: 'Argentina', coordinates: { type: 'Point', coordinates: [0, 0] } },
        });
        await professional.save();
      } catch (proErr) {
        logger.error('Failed to create professional record on register', { error: proErr.message, userId: user._id });
      }
    }

    sendVerificationEmail(user.email, user.name, user.verificationToken).catch(() => {});

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Log registration
    logger.logAuth('register', user._id, req.ip, true);

    const publicUser = user.toJSON();

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

  } catch (error) {
    logger.error('Registration error', { error: error.message, email: req.body.email });
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
  try {
    const { email, password, rememberMe } = req.body;

    // Find user by email with password
    const user = await User.findByEmail(email);

    if (!user) {
      logger.logAuth('login', null, req.ip, false, { email, reason: 'user_not_found' });
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      logger.logAuth('login', user._id, req.ip, false, { reason: 'account_inactive' });
      return res.status(401).json({
        success: false,
        error: 'Account inactive',
        message: 'Your account has been deactivated'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      logger.logAuth('login', user._id, req.ip, false, { reason: 'invalid_password' });
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Update last login
    user.lastLogin = new Date();

    // Auto-promote to admin if no admin exists (initial setup)
    if (user.role !== 'admin') {
      const adminExists = await User.findOne({ role: 'admin', isActive: true });
      if (!adminExists) {
        user.role = 'admin';
      }
    }

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Log successful login
    logger.logAuth('login', user._id, req.ip, true);

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
    logger.error('Login error', { error: error.message, email: req.body.email });
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: 'An error occurred during login'
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
router.post('/refresh', [
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
router.post('/forgot-password', [
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

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    await sendPasswordResetEmail(email, user.name, resetToken).catch(() => {});

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
router.post('/reset-password', [
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
router.post('/send-verification', [
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
router.post('/verify-phone', [
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

// Forgot Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, error: 'Token y contrasena requeridos' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'La contrasena debe tener al menos 6 caracteres' });
    }

    const users = await User.find({
      resetPasswordExpires: { $gt: Date.now() }
    });

    let user = null;
    for (const u of users) {
      if (u.resetPasswordToken) {
        const valid = await bcrypt.compare(token, u.resetPasswordToken);
        if (valid) { user = u; break; }
      }
    }

    if (!user) {
      return res.status(400).json({ success: false, error: 'Token invalido o expirado' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logger.logAuth('password_reset_completed', user._id, req.ip, true);
    res.json({ success: true, message: 'Contrasena restablecida exitosamente' });
  } catch (error) {
    logger.error('Reset password error', { error: error.message });
    res.status(500).json({ success: false, error: 'Error al restablecer la contrasena' });
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
