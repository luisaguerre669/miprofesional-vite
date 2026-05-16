// Minimal server for testing auth endpoints
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { generarToken, verificarToken } = require('./src/config/jwt');
const { login } = require('./src/controllers/authController');
const authMiddleware = require('./src/middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post('/api/v1/auth-simple/login', login);
app.get('/api/v1/auth-simple/profile', authMiddleware, (req, res) => {
  res.json({ 
    user: req.user,
    message: 'Perfil obtenido exitosamente'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 JWT_SECRET: ${process.env.JWT_SECRET ? 'Configured' : 'Not configured'}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api/v1/auth-simple`);
});
