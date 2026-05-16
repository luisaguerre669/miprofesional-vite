# 🚀 Render Deployment Guide - MiProfesional Enterprise Architecture

## 📋 Overview
Complete deployment guide for MiProfesional on Render with enterprise-grade architecture:
- **API Gateway** - Single entry point with intelligent routing
- **Auth Service** - Independent microservice
- **Monolith Backend** - Fallback service
- **Zero Downtime** - Progressive deployment strategy

## 🏗️ Architecture Overview

```
┌─────────────────┐
│   Frontend      │
│   (Client)      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   API Gateway   │ ← Main Entry Point
│   (Port 8080)   │
└─────────┬───────┘
          │
    ┌─────┴─────┐
    ▼           ▼
┌─────────┐ ┌─────────────┐
│Auth     │ │  Monolith   │
│Service  │ │  Backend    │
│(3001)   │ │ (10000)     │
└─────────┘ └─────────────┘
    │           │
    └─────┬─────┘
          ▼
┌─────────────────┐
│  MongoDB Atlas  │
│   (Shared DB)   │
└─────────────────┘
```

## 🚀 Services Configuration

### 1. Monolith Backend (Fallback Service)

**Service Name**: `miprofesional-backend`

**Render Configuration**:
```yaml
Type: Web Service
Environment: Node
Region: Oregon
Plan: Free (or Starter)
```

**Build Command**:
```bash
npm install
```

**Start Command**:
```bash
node src/render-deploy.js
```

**Environment Variables**:
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/miprofesional
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
```

**Health Check**:
- Path: `/health`
- Interval: 30 seconds
- Timeout: 10 seconds

---

### 2. API Gateway (Main Entry Point)

**Service Name**: `miprofesional-gateway`

**Render Configuration**:
```yaml
Type: Web Service
Environment: Node
Region: Oregon
Plan: Free (or Starter)
```

**Build Command**:
```bash
npm install
```

**Start Command**:
```bash
node gateway/render-deploy.js
```

**Environment Variables**:
```bash
NODE_ENV=production
USE_AUTH_SERVICE=true
AUTH_SERVICE_URL=https://miprofesional-auth.onrender.com
MONOLITH_URL=https://miprofesional-backend.onrender.com
ENABLE_DUAL_RUN=false
LOG_ROUTING_DECISIONS=true
```

**Health Check**:
- Path: `/health`
- Interval: 30 seconds
- Timeout: 10 seconds

---

### 3. Auth Service (Microservice)

**Service Name**: `miprofesional-auth`

**Render Configuration**:
```yaml
Type: Web Service
Environment: Node
Region: Oregon
Plan: Free (or Starter)
```

**Build Command**:
```bash
npm install
```

**Start Command**:
```bash
node services/auth-service/render-deploy.js
```

**Environment Variables**:
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/miprofesional
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
PORT=3001
```

**Health Check**:
- Path: `/health`
- Interval: 30 seconds
- Timeout: 10 seconds

## 📋 Step-by-Step Deployment

### Phase 1: Prepare Environment Variables

Create these environment variables in your Render dashboard:

```bash
# Shared Variables (add to all services)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/miprofesional
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_secure
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_make_it_different
NODE_ENV=production
```

### Phase 2: Deploy Monolith Backend (Fallback)

1. **Create Service**: 
   - Go to Render Dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select root directory

2. **Configure**:
   - Name: `miprofesional-backend`
   - Build: `npm install`
   - Start: `node src/render-deploy.js`
   - Add environment variables

3. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Verify health: `https://miprofesional-backend.onrender.com/health`

### Phase 3: Deploy Auth Service

1. **Create Service**:
   - Name: `miprofesional-auth`
   - Build: `npm install`
   - Start: `node services/auth-service/render-deploy.js`
   - Add environment variables

2. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment
   - Verify health: `https://miprofesional-auth.onrender.com/health`

### Phase 4: Deploy API Gateway

1. **Create Service**:
   - Name: `miprofesional-gateway`
   - Build: `npm install`
   - Start: `node gateway/render-deploy.js`
   - Add environment variables

2. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment
   - Verify health: `https://miprofesional-gateway.onrender.com/health`

## 🛡️ Fallback and Health Check Configuration

### Automatic Fallback Logic

The API Gateway implements automatic fallback:

```javascript
// Gateway routing logic
if (USE_AUTH_SERVICE && authServiceHealthy) {
  route → auth-service
} else {
  route → monolith (fallback)
}
```

### Health Check Endpoints

All services expose health endpoints:

**Monolith**: `GET /health`
```json
{
  "status": "ok",
  "service": "MiProfesional Backend",
  "type": "monolith",
  "database": {
    "status": "connected",
    "stats": {
      "users": 150,
      "professionals": 45,
      "bookings": 200
    }
  }
}
```

**Auth Service**: `GET /health`
```json
{
  "status": "ok",
  "service": "Auth Service",
  "type": "microservice",
  "database": {
    "status": "connected",
    "userCount": 150
  }
}
```

**Gateway**: `GET /health`
```json
{
  "status": "ok",
  "service": "gateway",
  "services": {
    "monolith": { "healthy": true },
    "auth": { "healthy": true }
  },
  "routing": {
    "useAuthService": true,
    "fallback": "monolith"
  }
}
```

## 🔄 Zero Downtime Deployment Strategy

### Deployment Order

1. **Monolith First** (Always deployed first)
   - Provides fallback safety net
   - Ensures database connectivity

2. **Auth Service Second**
   - Independent microservice
   - Can be deployed without affecting users

3. **Gateway Last** (Always deployed last)
   - Controls traffic routing
   - Updates routing logic

### Rollback Strategy

If any service fails:

```bash
# Disable auth service (fallback to monolith)
# In Gateway environment variables:
USE_AUTH_SERVICE=false

# Redeploy gateway only
# No need to redeploy other services
```

## 🔧 Configuration Details

### CORS Configuration

All services are configured with these CORS origins:

```javascript
origins: [
  "https://miprofesional.onrender.com",
  "https://miprofesional-backend.onrender.com", 
  "https://miprofesional-gateway.onrender.com",
  "https://miprofesional-auth.onrender.com"
]
```

### JWT Configuration

All services share the same JWT configuration:

```bash
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

### Database Configuration

All services connect to the same MongoDB Atlas database:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/miprofesional
```

## 📊 Monitoring and Observability

### Health Monitoring

Monitor these endpoints:

- **Gateway**: `https://miprofesional-gateway.onrender.com/health`
- **Monolith**: `https://miprofesional-backend.onrender.com/health`
- **Auth Service**: `https://miprofesional-auth.onrender.com/health`

### Detailed Status

- **Gateway**: `/health/detailed` - Shows all service health
- **Gateway**: `/status` - Shows routing status

### Logging

Each service logs:

```
🚀 [req_123] POST /api/auth/login - Monolith received
🚀 [req_123] POST /api/auth/login - 200 (45ms)
🔐 [auth_456] POST /login - Auth Service received
🔐 [auth_456] POST /login - 201 (42ms)
🚪 [gw_789] POST /api/auth/login - Gateway received
🛣️ [gw_789] Routing to AUTH SERVICE: /api/auth/login
🔀 [gw_789] Proxying to auth service: POST /api/auth/login
🔀 [gw_789] Auth service response: 201 (47ms)
```

## 🚨 Troubleshooting

### Common Issues

1. **Service Not Starting**
   - Check environment variables
   - Verify MongoDB URI is correct
   - Check build logs

2. **Health Check Failing**
   - Check database connectivity
   - Verify service is running
   - Check port conflicts

3. **Gateway Routing Issues**
   - Verify service URLs are correct
   - Check health of downstream services
   - Review feature flags

### Debugging Commands

```bash
# Check service health
curl https://miprofesional-gateway.onrender.com/health
curl https://miprofesional-backend.onrender.com/health
curl https://miprofesional-auth.onrender.com/health

# Check detailed status
curl https://miprofesional-gateway.onrender.com/health/detailed

# Test auth endpoints
curl -X POST https://miprofesional-gateway.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 🎯 Production Best Practices

### Security

1. **Environment Variables**: Never commit secrets to git
2. **JWT Secrets**: Use long, random strings
3. **Database**: Use MongoDB Atlas with IP whitelisting
4. **HTTPS**: All services use HTTPS automatically

### Performance

1. **Compression**: Enabled on all services
2. **CORS**: Properly configured origins
3. **Health Checks**: Lightweight and fast
4. **Logging**: Structured and minimal

### Reliability

1. **Fallback**: Gateway always falls back to monolith
2. **Health Checks**: Continuous monitoring
3. **Graceful Shutdown**: Proper SIGTERM handling
4. **Error Handling**: Comprehensive error responses

## 📈 Scaling Considerations

### Current Architecture

- **Monolith**: Handles all requests (fallback)
- **Auth Service**: Handles authentication only
- **Gateway**: Routes and monitors

### Future Scaling

1. **Add More Microservices**: Follow same pattern
2. **Load Balancing**: Render handles automatically
3. **Database Scaling**: MongoDB Atlas scaling
4. **Caching**: Add Redis if needed

## 🎉 Deployment Verification

### Post-Deployment Checklist

- [ ] All services are running
- [ ] Health checks are passing
- [ ] Gateway is routing correctly
- [ ] Auth service is accessible
- [ ] Monolith fallback works
- [ ] Frontend can connect
- [ ] JWT tokens work across services
- [ ] Real-time features work
- [ ] Error handling is working
- [ ] Logging is functional

### Verification Commands

```bash
# Test complete flow
curl https://miprofesional-gateway.onrender.com/health

# Test auth flow
curl -X POST https://miprofesional-gateway.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","location":"Test","acceptTerms":true}'

# Test fallback (disable auth service temporarily)
# Set USE_AUTH_SERVICE=false in gateway
# Redeploy gateway
# Test that requests go to monolith
```

---

## 🎯 Success Criteria

✅ **Gateway**: Single entry point with intelligent routing
✅ **Auth Service**: Independent microservice deployed
✅ **Monolith**: Fallback service always available
✅ **Zero Downtime**: Progressive deployment strategy
✅ **Health Checks**: All services monitored
✅ **Fallback**: Automatic fallback on service failure
✅ **JWT Compatibility**: Shared authentication across services
✅ **Database**: Shared MongoDB Atlas connection
✅ **Security**: Proper CORS and environment variables
✅ **Monitoring**: Comprehensive logging and health checks

**Status**: ✅ **RENDER DEPLOYMENT CONFIGURATION COMPLETE - ENTERPRISE ARCHITECTURE READY**
