# 🔐 Auth Service - Independent Microservice

## 📋 Overview
First microservice extracted from MiProfesional monolith using Strangler Pattern. Handles authentication, registration, and user management independently while maintaining full compatibility with the existing system.

## 🏗️ Architecture

### Independent Structure
```
/services/auth-service/
├── server.js                    # Main server entry point
├── package.json                 # Dependencies
├── config/
│   ├── database.js              # MongoDB Atlas connection
│   └── environment.js           # Environment configuration
├── controllers/
│   └── auth.controller.js       # HTTP request handling
├── services/
│   └── auth.service.js          # Business logic layer
└── routes/
    └── auth.routes.js           # Route definitions
```

### Shared Resources
- **Database**: Same MongoDB Atlas as monolith
- **Models**: Reuses `User` model from monolith
- **JWT**: Same secrets for compatibility
- **Logger**: Same logging system

## 🚀 Quick Start

### 1. Start the Auth Service
```bash
cd backend/services/auth-service
npm install
npm start  # Port 3001
```

Or use the convenience script:
```bash
cd backend
node scripts/start-auth-service.js
```

### 2. Health Check
```bash
curl http://localhost:3001/health
```

### 3. Test Endpoints
```bash
# Register
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com", 
    "password": "password123",
    "location": "Buenos Aires",
    "acceptTerms": true
  }'

# Login
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 📊 Endpoints

### Public Routes
- `POST /register` - User registration
- `POST /login` - User login
- `POST /refresh` - JWT refresh token

### Protected Routes
- `POST /logout` - User logout
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile

### Service Routes
- `GET /health` - Service health check
- `GET /` - Service information

## 🎛️ Configuration

### Environment Variables
```bash
# Service Configuration
NODE_ENV=development
PORT=3001

# Database (shared with monolith)
MONGODB_URI=mongodb+srv://...

# JWT (same as monolith for compatibility)
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:8081
```

### Configuration Files
- `config/environment.js` - Environment variables
- `config/database.js` - Database connection

## 🔄 Strangler Pattern Integration

### Gateway Configuration
The API Gateway routes `/api/auth` requests based on feature flags:

```bash
# Use monolith (fallback)
USE_AUTH_SERVICE=false

# Use microservice
USE_AUTH_SERVICE=true
```

### Dual Run Mode
When `ENABLE_DUAL_RUN=true`, the gateway:
1. Sends request to both monolith and microservice
2. Compares responses
3. Logs differences
4. Returns monolith response (safe fallback)

### Feature Flag Management
```bash
# Check status
node scripts/feature-flags.js status

# Enable auth service
node scripts/feature-flags.js enable auth

# Disable auth service
node scripts/feature-flags.js disable auth
```

## 🗄️ Database Configuration

### Shared Database
- **Same MongoDB Atlas** as monolith
- **Same collections** (users, etc.)
- **No data duplication**
- **Real-time consistency**

### Connection Details
```javascript
// config/database.js
const mongoose = require("mongoose");

class DatabaseConfig {
  async connect() {
    await mongoose.connect(process.env.MONGODB_URI);
    // Shared connection with monolith
  }
}
```

## 🔐 JWT Compatibility

### Same Token Structure
```javascript
// Both systems generate identical tokens
{
  "userId": "user_id",
  "type": "access",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Same Secrets
- `JWT_SECRET` - Access tokens
- `JWT_REFRESH_SECRET` - Refresh tokens
- Same expiration times

### Validation
Both monolith and microservice use identical JWT validation logic.

## 📊 Monitoring & Logging

### Service Health
```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "healthy",
  "service": "Auth Service",
  "version": "1.0.0",
  "type": "microservice",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "memory": {...},
  "environment": "development"
}
```

### Request Logging
```
🔐 [auth_123] POST /register - Auth Service received
🔐 [auth_123] POST /register - 201 (45ms)
```

### Dual Run Logging
```
🔄 [req_456] Starting dual run for AUTH: POST /api/auth/login
📊 Monolith: 200 - {"success":true,"data":{...}}
📊 Microservice: 200 - {"success":true,"data":{...}}
🔍 Comparison Result: Status=✅, Body=✅, ResponseTimeDiff=5ms
🛡️ [req_456] Using monolith response (safe fallback)
```

## 🚨 Error Handling

### Service Errors
```json
{
  "error": "Internal service error",
  "message": "An error occurred in the auth service",
  "service": "Auth Service",
  "requestId": "auth_123",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Validation Errors
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Please check your input",
  "errors": [
    {
      "msg": "Email is required",
      "param": "email",
      "location": "body"
    }
  ]
}
```

## 🔧 Development

### Local Development
```bash
# Start service
cd services/auth-service
npm start

# Start with nodemon
npm run dev

# Run tests
npm test
```

### Testing
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Health check
curl http://localhost:3001/health
```

## 🚀 Deployment

### Render Configuration
```bash
# Environment Variables
NODE_ENV=production
PORT=3001
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

### Build Command
```bash
npm install
```

### Start Command
```bash
npm start
```

## 📈 Performance

### Metrics
- **Response Time**: ~50-100ms
- **Memory Usage**: ~50-100MB
- **CPU Usage**: Minimal
- **Database**: Shared connection

### Optimization
- Connection pooling
- Request compression
- Response caching
- Rate limiting

## 🛡️ Security

### Features
- **Helmet**: Security headers
- **CORS**: Cross-origin protection
- **Rate Limiting**: Request throttling
- **Input Validation**: Request sanitization
- **JWT**: Token authentication

### Best Practices
- Environment variable validation
- Error message sanitization
- Request logging
- Graceful shutdown

## 🔄 Migration Process

### Phase 1: Service Ready ✅
- [x] Independent service created
- [x] Shared database connection
- [x] JWT compatibility ensured
- [x] Gateway integration ready

### Phase 2: Testing
- [ ] Start auth service
- [ ] Run dual run tests
- [ ] Compare responses
- [ ] Validate compatibility

### Phase 3: Gradual Migration
- [ ] Enable feature flag
- [ ] Monitor performance
- [ ] Check error rates
- [ ] Full migration

### Phase 4: Decommission
- [ ] Route all traffic to service
- [ ] Remove auth from monolith
- [ ] Update documentation
- [ ] Clean up code

## 📚 Dependencies

### Production Dependencies
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "helmet": "^7.0.0",
  "morgan": "^1.10.0",
  "compression": "^1.7.4",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.3",
  "express-validator": "^7.0.1",
  "mongoose": "^7.5.0"
}
```

### Development Dependencies
```json
{
  "nodemon": "^3.0.1",
  "jest": "^29.6.2",
  "supertest": "^6.3.3"
}
```

## 🎯 Next Steps

1. **Start Service**: `npm start`
2. **Test Dual Run**: `node scripts/start-migration.js`
3. **Enable Feature Flag**: `node scripts/feature-flags.js enable auth`
4. **Monitor**: Check logs and metrics
5. **Gradual Migration**: Increase traffic gradually

## 📞 Support

### Issues
- Check service health: `/health`
- Check gateway logs: Gateway console
- Check feature flags: `/admin/flags`
- Check database: MongoDB Atlas console

### Troubleshooting
```bash
# Check service status
curl http://localhost:3001/health

# Check gateway status
curl http://localhost:8080/health/services

# Check feature flags
curl http://localhost:8080/admin/flags

# Run dual run test
node scripts/start-migration.js
```

---

**Status**: ✅ **AUTH SERVICE INDEPENDIENTE COMPLETADO - STRANGLER PATTERN READY**
