const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Acceso denegado. No se proporcionó token." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "miprofesional-api",
      audience: "miprofesional-app"
    });
    req.user = decoded;
    req.userId = decoded.userId || decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token inválido o expirado." });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: "miprofesional-api",
        audience: "miprofesional-app"
      });
      req.user = decoded;
      req.userId = decoded.userId || decoded.id;
    } catch {
      // Token invalid, continue without auth
    }
  }
  next();
}

async function requireAdmin(req, res, next) {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId).select('role');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol admin.' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error verificando permisos de administrador.' });
  }
}

async function requireEmployer(req, res, next) {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId).select('role isActive');
    if (!user || !user.isActive || !['employer', 'admin'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere cuenta de empresa.' });
    }
    req.authUser = user;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error verificando permisos de empresa.' });
  }
}

module.exports = { authenticate, optionalAuth, requireAdmin, requireEmployer };
