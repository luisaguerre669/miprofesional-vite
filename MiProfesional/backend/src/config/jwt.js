const jwt = require("jsonwebtoken");

// JWT_SECRET is mandatory for production - no fallback
const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error('JWT_SECRET environment variable is required for production');
}

function generarToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      iat: Math.floor(Date.now() / 1000) // Issued at
    },
    SECRET,
    { 
      expiresIn: "7d",
      issuer: 'miprofesional-api',
      audience: 'miprofesional-app'
    }
  );
}

function verificarToken(token) {
  return jwt.verify(token, SECRET, {
    issuer: 'miprofesional-api',
    audience: 'miprofesional-app'
  });
}

module.exports = { generarToken, verificarToken };
