# PRODUCTION SUMMARY - MiProfesional

## Status: DEPLOYED

### Frontend
- URL: https://www.miprofesional.online
- Platform: Vercel (project: miprofesional-vite)
- Build: 0 errors, 2221 modules
- Last deploy: OK

### Backend
- URL: https://miprofesional-backend.onrender.com
- Platform: Render (service: miprofesional-backend)
- Health: OK
- GitHub: https://github.com/luisaguerre669/miprofesional-backend

## Fixed Issues

### CRITICAL (resolved by code changes)
- POST JSON requests: sanitizer simplified (removed isomorphic-dompurify)
- Register 500: phone/location empty string duplicate key error fixed
- Forgot-password: combined duplicate routes, now sends email
- Login: working (returns proper auth errors)
- Double `/api` paths: fixed in ForgotPassword, ResetPassword, NearbyProfessionals, AdminPayments, AdminGeo
- Missing `useNavigate` import: fixed in Home.jsx
- Shadcn/ui missing components: created Card, Button, Badge, Input, Slider
- `Verified` icon: replaced with `BadgeCheck` (valid lucide-react icon)
- Professional redirect: `/dashboard` -> `/dashboard/professional`
- Login raw fetch: replaced with axios instance
- Canonical URLs: `miprofesional.com` -> `www.miprofesional.online`
- Contact email: `hola@miprofesional.com` -> `hola@miprofesional.online`
- Google OAuth fallback email: `@google-oauth.miprofesional.com` -> `.online`
- Webhook URL: now uses `BACKEND_URL` env var

## PENDING - Must manually configure

### 1. Render Environment Variables
Go to https://dashboard.render.com -> miprofesional-backend -> Environment -> Add these:

| Variable | Value | Purpose |
|----------|-------|---------|
| `CORS_ORIGIN` | `https://www.miprofesional.online,https://miprofesional.online` | Allow frontend domain |
| `FRONTEND_URL` | `https://www.miprofesional.online` | Redirect/email links |
| `BACKEND_URL` | `https://miprofesional-backend.onrender.com` | Webhook URLs |
| `GOOGLE_CLIENT_ID` | (from Google Cloud Console) | Google OAuth login |
| `GOOGLE_CLIENT_SECRET` | (from Google Cloud Console) | Google OAuth login |
| `GOOGLE_CALLBACK_URL` | `https://miprofesional-backend.onrender.com/auth/google/callback` | OAuth redirect |
| `SMTP_HOST` | `smtp.gmail.com` | Email service |
| `SMTP_PORT` | `587` | Email service |
| `SMTP_USER` | `miprofesionalapp@gmail.com` | Email account |
| `SMTP_PASS` | (Gmail App Password - 16 chars) | Email password |
| `MERCADOPAGO_ACCESS_TOKEN` | (your production token) | Payment processing |
| `NODE_ENV` | `production` | Environment mode |

### 2. Google OAuth Setup
1. Go to https://console.cloud.google.com
2. Select project or create new
3. Go to APIs & Services -> Credentials
4. Create OAuth 2.0 Client ID (Web application)
5. Authorized redirect URIs: `https://miprofesional-backend.onrender.com/auth/google/callback`
6. Copy Client ID and Client Secret
7. Add them in Render env vars

### 3. Gmail App Password (SMTP)
1. Go to https://myaccount.google.com/apppasswords
2. Select app: Mail, device: Other
3. Generate 16-char password
4. Add as `SMTP_PASS` in Render env vars

### 4. Dynadot DNS Update
1. Log in to https://www.dynadot.com
2. Go to Domain -> miprofesional.online -> DNS Settings
3. Update A record from `76.76.21.21` to `216.198.79.1` (Vercel recommendation)
4. Keep CNAME `www` -> `cname.vercel-dns.com`

### 5. Manual Deploy on Render (after env vars)
If auto-deploy doesn't pick up:
1. Go to https://dashboard.render.com
2. Select miprofesional-backend
3. Click "Manual Deploy" -> "Clear build cache and deploy"

### 6. Verify Production
After all configured, test:
- [ ] Register a professional account
- [ ] Login/logout
- [ ] Forgot password / reset
- [ ] Google OAuth login
- [ ] Email verification flow
- [ ] Mercado Pago subscription
- [ ] Admin panel at /admin
- [ ] Search professionals
- [ ] GPS location detection
