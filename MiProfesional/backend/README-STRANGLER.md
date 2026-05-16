# 🚪 Strangler Pattern Migration Guide

## 📋 Overview
This guide explains how to progressively migrate MiProfesional from a monolith to microservices using the Strangler Pattern without downtime.

## 🏗️ Architecture

### Current State (Monolith)
```
┌─────────────────┐
│   Client Apps    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   Monolith      │ ← Current backend (10000)
│   (src/server.js)│
└─────────────────┘
```

### Migration State (Strangler Pattern)
```
┌─────────────────┐
│   Client Apps    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   API Gateway   │ ← New entry point (8080)
│   (gateway/)    │
└─────────┬───────┘
          │
    ┌─────┴─────┐
    ▼           ▼
┌─────────┐ ┌─────────────┐
│Monolith │ │Microservice │
│(10000)   │ │(3001-3005) │
└─────────┘ └─────────────┘
```

## 🚀 Quick Start

### 1. Start Current Backend (Monolith)
```bash
cd backend
npm start  # Port 10000
```

### 2. Start API Gateway
```bash
cd backend/gateway
npm install
npm start  # Port 8080
```

### 3. Test Gateway
```bash
curl http://localhost:8080/health
curl http://localhost:8080/admin/flags
```

## 🎛️ Feature Flags Control

### View Current Status
```bash
node scripts/feature-flags.js status
```

### Enable a Microservice
```bash
node scripts/feature-flags.js enable auth
```

### Disable a Microservice
```bash
node scripts/feature-flags.js disable auth
```

### Enable All Services
```bash
node scripts/feature-flags.js enable-all
```

### Disable All Services (Fallback)
```bash
node scripts/feature-flags.js disable-all
```

## 🔄 Dual Run Testing

### Run Comparison Tests
```bash
node scripts/start-migration.js
```

This script:
- Sends identical requests to monolith and microservice
- Compares responses (status, body, performance)
- Generates migration readiness report
- Saves detailed logs to `logs/`

### Migration Readiness Criteria
- ✅ **95%+ identical responses** - Ready for migration
- ⚠️ **80-95% identical** - Fix differences first
- ❌ **<80% identical** - Not ready, investigate issues

## 📊 Services Configuration

### Feature Flags (.env.gateway)
```bash
# Disable all (fallback to monolith)
USE_AUTH_SERVICE=false
USE_BOOKING_SERVICE=false
USE_PROFESSIONAL_SERVICE=false
USE_GEOLOCATION_SERVICE=false
USE_REALTIME_SERVICE=false

# Enable specific service
USE_AUTH_SERVICE=true
```

### Service URLs
```bash
MONOLITH_URL=http://localhost:10000
AUTH_SERVICE_URL=http://localhost:3001
BOOKING_SERVICE_URL=http://localhost:3002
PROFESSIONAL_SERVICE_URL=http://localhost:3003
GEOLOCATION_SERVICE_URL=http://localhost:3004
REALTIME_SERVICE_URL=http://localhost:3005
```

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── server.js              # Original monolith (KEEP RUNNING)
│   └── server-modular.js      # Modular version (NOT USED YET)
├── gateway/
│   ├── index.js               # API Gateway (NEW)
│   └── package.json
├── services/
│   ├── auth-service/          # Auth microservice (PREPARED)
│   ├── booking-service/       # Booking microservice (PREPARED)
│   ├── professional-service/  # Professional microservice (PREPARED)
│   ├── geolocation-service/   # Geo microservice (PREPARED)
│   └── realtime-service/      # Real-time microservice (PREPARED)
├── scripts/
│   ├── start-migration.js      # Dual run testing
│   └── feature-flags.js       # Feature flags management
└── .env.gateway               # Gateway configuration
```

## 🎯 Migration Strategy

### Phase 1: Preparation ✅
- [x] API Gateway implemented
- [x] Microservices structure created
- [x] Feature flags system ready
- [x] Dual run testing available

### Phase 2: Auth Service Migration
```bash
# 1. Start auth service
cd services/auth-service
npm install
npm start  # Port 3001

# 2. Test dual run
node scripts/start-migration.js

# 3. If ready, enable in gateway
node scripts/feature-flags.js enable auth

# 4. Restart gateway
# Traffic to /api/auth now goes to microservice
```

### Phase 3: Gradual Migration
```bash
# Repeat for each service in order:
# 1. Geolocation (independent)
# 2. Professional (medium risk)
# 3. Booking (higher risk)
# 4. Real-time (highest complexity)

node scripts/feature-flags.js enable <service>
```

### Phase 4: Full Migration
```bash
# When all services are enabled
node scripts/feature-flags.js enable-all

# Update DNS to point to gateway port
# Decommission monolith gradually
```

## 📊 Monitoring & Observability

### Gateway Health Check
```bash
curl http://localhost:8080/health
```

### Service Health Check
```bash
curl http://localhost:8080/health/services
```

### Feature Flags Status
```bash
curl http://localhost:8080/admin/flags
```

### Request Routing Logs
Gateway logs show routing decisions:
```
🛣️ [req_123] Routing: /api/auth → MONOLITH (fallback)
🛣️ [req_124] Routing: /api/auth → AUTH_SERVICE (microservice)
```

## 🚨 Safety Features

### Automatic Fallback
- If microservice is unhealthy → route to monolith
- Circuit breaker pattern implemented
- Health checks every 30 seconds

### Rollback Capability
```bash
# Instant rollback to previous configuration
node scripts/feature-flags.js rollback
```

### Backup System
- Automatic backup before changes
- Manual rollback available
- Configuration validation

## 🎛️ Production Deployment

### Render Configuration
```bash
# Environment Variables
PORT=8080
NODE_ENV=production
USE_AUTH_SERVICE=false
USE_BOOKING_SERVICE=false
MONOLITH_URL=https://miprofesional-backend.onrender.com
AUTH_SERVICE_URL=https://miprofesional-auth.onrender.com
```

### Migration Steps in Production
1. Deploy gateway to Render
2. Update DNS to point to gateway
3. Test with feature flags disabled
4. Enable services one by one
5. Monitor performance and errors
6. Gradual traffic increase

## 🔧 Troubleshooting

### Gateway Not Starting
```bash
# Check ports
netstat -an | grep 8080
netstat -an | grep 10000

# Check logs
cd gateway
npm start
```

### Microservice Not Responding
```bash
# Check service health
curl http://localhost:3001/health

# Check feature flags
node scripts/feature-flags.js status
```

### Response Mismatches
```bash
# Run dual run testing
node scripts/start-migration.js

# Check logs in logs/ directory
ls logs/
cat logs/dual-run-report-*.json
```

## 📈 Performance Metrics

### Gateway Overhead
- **Latency**: ~5-10ms additional
- **Memory**: ~50MB additional
- **CPU**: Minimal impact

### Microservice Benefits
- **Scalability**: Independent scaling
- **Deployment**: Zero-downtime updates
- **Isolation**: Fault containment

## 🎯 Success Criteria

### Technical Success
- ✅ Zero downtime during migration
- ✅ Response parity >95%
- ✅ Performance maintained
- ✅ Error rates <1%

### Business Success
- ✅ User experience unchanged
- ✅ No data loss
- ✅ Feature parity maintained
- ✅ Monitoring improved

## 📚 Additional Resources

### Strangler Pattern
- [Martin Fowler's Guide](https://martinfowler.com/bliki/StranglerFigApplication.html)
- [Microservices Patterns](https://microservices.io/patterns/strangler-application.html)

### API Gateway
- [NGINX vs API Gateway](https://nginx.org/blog/nginx-vs-api-gateway/)
- [Express Gateway Patterns](https://expressjs.com/en/guide/advanced.html)

### Feature Flags
- [LaunchDarkly Best Practices](https://docs.launchdarkly.com/guides/feature-flags)
- [Feature Flag Toggles](https://martinfowler.com/articles/feature-toggles.html)

---

## 🎉 Next Steps

1. **Start Gateway**: `cd gateway && npm start`
2. **Run Tests**: `node scripts/start-migration.js`
3. **Enable Auth**: `node scripts/feature-flags.js enable auth`
4. **Monitor**: Check logs and metrics
5. **Gradual Migration**: Enable services one by one

**Status**: ✅ **STRANGLER PATTERN IMPLEMENTATION COMPLETE - READY FOR MIGRATION**
