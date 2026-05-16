# 🚀 Cloud Deployment Instructions - MiProfesional Backend

## 📋 Prerequisites

### Required Environment Variables
All these must be set in your cloud platform's environment variables:

```bash
# Database (Required)
MONGODB_URI=mongodb+srv://miprofesional_luis:Luisaguerre1966@miprofesional-cluster.zhkc2iq.mongodb.net/miprofesional?retryWrites=true&w=majority

# Server (Required)
NODE_ENV=production
PORT=3001

# JWT (Required - Change This!)
JWT_SECRET=MI_PROFESIONAL_JWT_SECRET_KEY_2024_SUPER_SEGURA_PRODUCTION_CHANGE_ME

# CORS (Required)
CORS_ORIGIN=https://miprofesional.com,https://www.miprofesional.com,https://app.miprofesional.com,capacitor://localhost,ionic://localhost

# Security (Required)
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=5
```

## ☁️ Platform-Specific Deployment

### 1. Render Deployment

```bash
# 1. Create render.yaml
cat > render.yaml << EOF
services:
  - type: web
    name: miprofesional-api
    env: node
    plan: starter
    buildCommand: npm install
    startCommand: node src/server-production.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: CORS_ORIGIN
        value: https://miprofesional.com,https://app.miprofesional.com,capacitor://localhost
EOF

# 2. Push to GitHub
git add .
git commit -m "Cloud deployment ready"
git push origin main

# 3. Connect to Render
# - Go to render.com
# - Connect your GitHub repository
# - Set environment variables in Render dashboard
# - Deploy!
```

### 2. Railway Deployment

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Create project
railway init

# 4. Set environment variables
railway variables set NODE_ENV=production
railway variables set MONGODB_URI="your_mongodb_uri"
railway variables set JWT_SECRET="your_jwt_secret"
railway variables set CORS_ORIGIN="https://miprofesional.com,https://app.miprofesional.com,capacitor://localhost"

# 5. Deploy
railway up
```

### 3. AWS/VPS Deployment

```bash
# 1. Create deploy script
cat > deploy.sh << EOF
#!/bin/bash

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone https://github.com/yourusername/miprofesional.git
cd miprofesional/backend

# Install dependencies
npm install --production

# Set environment variables
export NODE_ENV=production
export PORT=3001
export MONGODB_URI="your_mongodb_uri"
export JWT_SECRET="your_jwt_secret"
export CORS_ORIGIN="https://miprofesional.com,https://app.miprofesional.com,capacitor://localhost"

# Start with PM2
pm2 start src/server-production.js --name "miprofesional-api"
pm2 save
pm2 startup

# Setup Nginx (optional)
sudo apt install nginx -y
sudo cat > /etc/nginx/sites-available/miprofesional << 'NGINX_EOF'
server {
    listen 80;
    server_name api.miprofesional.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_EOF

sudo ln -s /etc/nginx/sites-available/miprofesional /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
EOF

chmod +x deploy.sh
./deploy.sh
```

## 🔧 Post-Deployment Setup

### 1. Database Setup

```bash
# Run seed script to create test user
node seed-user.js

# Verify user creation
node -e "
const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const user = await User.findOne({ email: 'test@demo.com' });
    console.log('Test user:', user ? 'Found' : 'Not found');
    process.exit(0);
  })
  .catch(console.error);
"
```

### 2. Health Check

```bash
# Test the deployed API
curl https://your-domain.com/health

# Expected response:
# {
#   "success": true,
#   "message": "Health check - OK",
#   "timestamp": "2026-04-24T...",
#   "uptime": 123.456
# }
```

### 3. SSL Certificate (Required for Production)

```bash
# For nginx on Ubuntu/VPS
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.miprofesional.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📱 Mobile App Configuration Update

After deployment, update the mobile app:

```typescript
// mobile/src/services/api.ts
const API_CONFIG = {
  baseURL: 'https://your-deployed-domain.com/v1', // Update this
  timeout: 10000,
  retryAttempts: 3,
};
```

## 🔍 Testing Production

```bash
# Run production tests
node test-cloud-production.js

# Expected: All checks should pass
# ☁️ Cloud Production Validation
# ✅ Cloud Health Check
# ✅ MongoDB Dependency
# ✅ Authentication Flow
# ✅ Token Validation
# ✅ Security Headers
# ✅ Rate Limiting
# ✅ Input Sanitization
# ✅ Error Handling
```

## 🚨 Critical Security Notes

1. **Change JWT_SECRET**: Must be unique and secure
2. **MongoDB Security**: Use Atlas with IP whitelisting
3. **HTTPS Required**: All production requests must use HTTPS
4. **CORS**: Only allow your production domains
5. **Rate Limiting**: Keep limits conservative
6. **Monitoring**: Set up error monitoring (Sentry)

## 📊 Monitoring Setup

```bash
# Install monitoring packages
npm install @sentry/node

# Add to server-production.js
const Sentry = require('@sentry/node');

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
}
```

## 🎯 Success Criteria

- [ ] API responds to health checks
- [ ] Login works with real MongoDB
- [ ] Rate limiting is active
- [ ] JWT tokens are generated and validated
- [ ] CORS allows production domains only
- [ ] No localhost references in code
- [ ] Environment variables are properly set
- [ ] SSL certificate is installed
- [ ] Mobile app can connect to production API

## 🆘 Troubleshooting

### Common Issues:

1. **MongoDB Connection Failed**
   - Check MONGODB_URI format
   - Verify Atlas IP whitelist
   - Check network connectivity

2. **JWT_SECRET Missing**
   - Set environment variable in cloud platform
   - Restart the application

3. **CORS Errors**
   - Update CORS_ORIGIN with correct domains
   - Check mobile app is using HTTPS

4. **Rate Limiting Too Strict**
   - Adjust RATE_LIMIT_MAX_REQUESTS
   - Monitor for abuse

5. **Memory Issues**
   - Monitor with PM2 logs
   - Consider upgrading server resources

## 📞 Support

For deployment issues:
1. Check cloud platform logs
2. Verify environment variables
3. Test with curl commands
4. Review this documentation
