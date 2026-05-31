# 🚀 BACKEND DEPLOYMENT GUIDE - MI PROFESIONAL

## 📋 DEPLOYMENT STATUS: READY FOR CLOUD

### ✅ **COMPLETED PREPARATIONS**
- ✅ Git repository initialized and committed
- ✅ render.yaml configuration created
- ✅ Environment variables documented
- ✅ Cloud-ready server (server-production.js)
- ✅ MongoDB Atlas integration ready
- ✅ Security and rate limiting configured

---

## 🌐 **DEPLOYMENT OPTIONS**

### **OPTION 1: RENDER (RECOMMENDED)**
**Fastest deployment with automatic HTTPS**

#### **Step 1: Create GitHub Repository**
```bash
# Already done:
# - Git initialized
# - Files committed
# - Ready to push

# Next: Push to GitHub
git remote add origin https://github.com/yourusername/miprofesional-backend.git
git push -u origin master
```

#### **Step 2: Deploy on Render**
1. Go to [render.com](https://render.com)
2. Sign up/login with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Render will auto-detect `render.yaml`
6. Set environment variables:
   - `MONGODB_URI`: `mongodb+srv://miprofesional_luis:Luisaguerre1966@miprofesional-cluster.zhkc2iq.mongodb.net/miprofesional?retryWrites=true&w=majority`
   - `JWT_SECRET`: `MI_PROFESIONAL_JWT_SECRET_KEY_2024_SUPER_SEGURA_PRODUCTION_CHANGE_ME`
7. Click "Deploy"

#### **Step 3: Verify Deployment**
```bash
# Test your deployed API
curl https://your-service-name.onrender.com/health

# Expected response:
# {"success":true,"message":"Health check - OK","timestamp":"..."}
```

---

### **OPTION 2: RAILWAY**
**Alternative cloud platform**

#### **Step 1: Install Railway CLI**
```bash
npm install -g @railway/cli
```

#### **Step 2: Deploy**
```bash
# Login to Railway
railway login

# Initialize project
cd d:\proyecto_verdent\MiProfesional\backend
railway init

# Set environment variables
railway variables set NODE_ENV=production
railway variables set MONGODB_URI="mongodb+srv://miprofesional_luis:Luisaguerre1966@miprofesional-cluster.zhkc2iq.mongodb.net/miprofesional?retryWrites=true&w=majority"
railway variables set JWT_SECRET="MI_PROFESIONAL_JWT_SECRET_KEY_2024_SUPER_SEGURA_PRODUCTION_CHANGE_ME"
railway variables set CORS_ORIGIN="https://miprofesional.com,https://www.miprofesional.com,https://app.miprofesional.com,capacitor://localhost,ionic://localhost"

# Deploy
railway up
```

---

### **OPTION 3: FREE CLOUD PLATFORMS**

#### **Replit (Free Tier)**
1. Go to [replit.com](https://replit.com)
2. Create "Node.js" Repl
3. Import from GitHub
4. Set environment variables in Secrets tab
5. Run `npm install && node src/server-production.js`

#### **Glitch (Free Tier)**
1. Go to [glitch.com](https://glitch.com)
2. "Import from GitHub"
3. Set environment variables in `.env`
4. Automatic deployment

---

## 🔧 **ENVIRONMENT VARIABLES REQUIRED**

Copy these to your cloud platform:

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://miprofesional_luis:Luisaguerre1966@miprofesional-cluster.zhkc2iq.mongodb.net/miprofesional?retryWrites=true&w=majority
JWT_SECRET=MI_PROFESIONAL_JWT_SECRET_KEY_2024_SUPER_SEGURA_PRODUCTION_CHANGE_ME
CORS_ORIGIN=https://miprofesional.com,https://www.miprofesional.com,https://app.miprofesional.com,capacitor://localhost,ionic://localhost
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=5
```

---

## 🧪 **POST-DEPLOYMENT VALIDATION**

### **Test Your Deployed API**
```bash
# Replace with your actual URL
API_URL="https://your-service-name.onrender.com"

# Health check
curl $API_URL/health

# Test login
curl -X POST $API_URL/api/v1/auth-simple/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@demo.com","password":"123456"}'

# Test rate limiting
for i in {1..6}; do
  curl -X POST $API_URL/api/v1/auth-simple/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@demo.com","password":"wrong"}'
done
```

### **Expected Results**
- ✅ Health check: 200 OK
- ✅ Login: 200 + JWT token
- ✅ Rate limiting: 429 after 5 attempts

---

## 📱 **UPDATE MOBILE APP**

After deployment, update mobile app API URL:

```typescript
// mobile/src/services/api.ts
const API_CONFIG = {
  baseURL: 'https://your-deployed-url.com/api/v1', // Update this
  timeout: 10000,
  retryAttempts: 3,
};
```

---

## 🚨 **IMPORTANT NOTES**

1. **Change JWT_SECRET**: Use a unique, secure secret
2. **MongoDB Security**: Your Atlas cluster is already configured
3. **HTTPS**: All cloud platforms provide automatic HTTPS
4. **CORS**: Already configured for your domains
5. **Rate Limiting**: Active and production-ready

---

## 🎯 **SUCCESS CRITERIA**

Your deployment is successful when:
- ✅ API responds to health checks
- ✅ Login works with real MongoDB
- ✅ Rate limiting is active
- ✅ Mobile app can connect
- ✅ HTTPS is working
- ✅ No localhost dependencies

---

## 🆘 **TROUBLESHOOTING**

### **Common Issues:**

1. **MongoDB Connection Failed**
   - Check MONGODB_URI format
   - Verify Atlas IP whitelist (add 0.0.0.0/0 for cloud)

2. **JWT_SECRET Missing**
   - Add environment variable in cloud platform dashboard

3. **CORS Errors**
   - Update CORS_ORIGIN with your deployed URL

4. **Port Issues**
   - Use process.env.PORT (already configured)

---

## 📞 **NEXT STEPS**

1. **Choose Platform**: Render (recommended) or Railway
2. **Deploy**: Follow the steps above
3. **Test**: Run validation commands
4. **Update Mobile**: Change API URL in mobile app
5. **Test End-to-End**: Verify complete user flow

**🚀 READY TO DEPLOY TO PRODUCTION!**
