# 🚀 PRODUCTION CHECKLIST — MiProfesional SAAS

## Proyecto: `D:\proyecto_verdent\MiProfesional`

---

## 1. ESTRUCTURA FINAL

```
MiProfesional/
├── backend/
│   ├── src/
│   │   ├── config/       (db.js, jwt.js, logger.js)
│   │   ├── middleware/    (auth.js, inputSanitizer.js)
│   │   ├── models/       (10 modelos: User, Professional, Booking, etc.)
│   │   ├── routes/       (16 rutas: auth, professionals, chat, etc.)
│   │   ├── services/     (chatService.js, paymentService.js)
│   │   ├── utils/        (logger.js)
│   │   └── server.js     (entry point)
│   ├── uploads/          (avatars/, documents/, gallery/)
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/        (14 páginas funcionales)
│   │   ├── context/      (AuthContext, SocketContext)
│   │   ├── components/   (Layout, etc.)
│   │   └── lib/          (axios)
│   └── dist/             (build output)
└── docs/
    └── PRODUCTION_CHECKLIST.md
```

## 2. QA — VERIFICADO

| Componente | Estado |
|-----------|--------|
| Backend syntax check (34 archivos) | ✅ 34/34 OK |
| Frontend build (14 páginas) | ✅ 348 KB, 0 errores |
| Backend routes registradas | ✅ 16 de 16 en server.js |
| Auth login/register/refresh/me | ✅ Real con JWT + MongoDB |
| Socket.io chat | ✅ persistente con MongoDB |
| MercadoPago webhook | ✅ Firma HMAC + Payment model |
| Uploads (avatar, gallery) | ✅ Multer + diskStorage |
| CORS producción | ✅ whitelist dinámica |
| Helmet + rate-limit | ✅ configurado |
| Graceful shutdown | ✅ SIGTERM/SIGINT |

## 3. MOCKS/SIMULACIONES ELIMINADAS

| Archivo | Problema | Solución |
|---------|----------|----------|
| `professionals.js` | `Math.random()` en favorites | Persistencia real con userId |
| `professionals.js` | Contact route sin persistencia | Eliminada (se usa chat) |
| `User.js` | phone/location required | Optional con sparse index |
| `Professional.js` | categoryId required | Optional con default null |
| `Reviews.js` | Field name mismatch `professional` vs `professionalId` | Corregido |
| `Reviews.js` | `req.user._id` en vez de `req.userId` | Corregido |
| `Notifications.jsx` | localStorage con sample data | API real + Notification model |
| `Settings.jsx` | localStorage + `/api/settings` inexistente | API `/users/profile` |
| `SubscriptionPage.jsx` | `/api/api/subscription/...` doble prefijo | Corregido a `/subscription/...` |
| `AdminPanel.jsx` | `data.totalUsers` vs `data.stats.totalUsers` | Corregido ambos casos |
| `upload.js` | Path `../../uploads` incorrecto | `path.resolve(UPLOAD_DIR)` |
| `server.js` | Missing `path` import for static | Añadido |
| `server.js` | Missing `/uploads` static serve | Añadido |

## 4. DUPLICADOS / CÓDIGO MUERTO — RESPALDADO

| Origen | Backup |
|--------|--------|
| `frontend-v2/` | `backup_consolidation/root/frontend-v2/` |
| `mobile/` | `backup_consolidation/root/mobile/` |
| `src/` (root) | `backup_consolidation/root/src/` |
| `frontend/` (root) | `backup_consolidation/root/frontend/` |
| `node_modules/` (root) | `backup_consolidation/root/node_modules/` |
| `package.json` (root) | `backup_consolidation/root/package.json` |
| 11 archivos .md legacy | `backup_consolidation/root/` |
| 17 rutas duplicadas (.ts, -simple, Routes) | `backup_consolidation/backend/routes/` |
| 6 modelos .ts | `backup_consolidation/backend/models/` |
| 8 middleware no usados | `backup_consolidation/backend/middleware/` |
| 9 services .ts/.js | `backup_consolidation/backend/services/` |
| 4 config duplicados | `backup_consolidation/backend/config/` |
| controllers/ + jobs/ | `backup_consolidation/backend/dirs/` |
| core/, deployment/, events/, etc. | `backup_consolidation/backend/dirs/` |

## 5. ENDPOINTS ACTIVOS (16)

```
GET    /health
GET    /api/health
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
PUT    /api/auth/change-password
GET    /api/professionals
GET    /api/professionals/search
GET    /api/professionals/featured
GET    /api/professionals/verified
GET    /api/professionals/top-rated
GET    /api/professionals/nearby
GET    /api/professionals/stats
GET    /api/professionals/:id
GET    /api/professionals/:id/stats
POST   /api/professionals/:id/favorite
POST   /api/professionals
PUT    /api/professionals/:id
GET    /api/categories
GET    /api/categories/featured
GET    /api/categories/popular
GET    /api/categories/search
GET    /api/categories/stats
GET    /api/categories/:id
GET    /api/bookings
POST   /api/bookings
GET    /api/bookings/professional
PATCH  /api/bookings/:id/status
GET    /api/users/me
PUT    /api/users/profile
GET    /api/users/stats
POST   /api/upload/avatar
POST   /api/upload/gallery
GET    /api/admin/dashboard
GET    /api/admin/users
PATCH  /api/admin/users/:id/status
PATCH  /api/admin/professionals/:id/verification
GET    /api/analytics/dashboard
GET    /api/analytics/professionals
POST   /api/identity/apply
GET    /api/identity/status
GET    /api/subscription/plans
GET    /api/subscription/current
POST   /api/subscription/upgrade
POST   /api/subscription/cancel
GET    /api/chat/conversations
GET    /api/chat/conversations/:userId
GET    /api/chat/:conversationId/messages
POST   /api/chat/:conversationId/messages
GET    /api/reviews
POST   /api/reviews
DELETE /api/reviews/:id
GET    /api/notifications
PATCH  /api/notifications/:id/read
POST   /api/notifications/read-all
POST   /api/v1/mercadopago/webhook
GET    /api/v1/mercadopago/payment/:mpPaymentId
GET    /api/v1/mercadopago/payments/user/:userId
GET    /api/v1/mercadopago/payments/stats
GET    /api/v1/mercadopago/payments/metrics
GET    /api/v1/mercadopago/payments/audit
```

## 6. FRONTEND — 14 PÁGINAS

| Página | Ruta | API real | Estado |
|--------|------|----------|--------|
| Home | `/` | `/professionals/featured` | ✅ |
| Login | `/login` | `/auth/login` | ✅ |
| Register | `/register` | `/auth/register` | ✅ |
| Search | `/search` | `/professionals/search` | ✅ |
| ServiceDetail | `/service/:id` | `/professionals/:id` | ✅ |
| ClientDashboard | `/dashboard/client` | `/bookings` + `/analytics/dashboard` | ✅ |
| ProfessionalDashboard | `/dashboard/professional` | `/professionals` + `/bookings/professional` | ✅ |
| Messages | `/messages` | `/chat/conversations` | ✅ |
| Chat | `/chat/:userId` | `/chat/conversations/:userId` + Socket.io | ✅ |
| Profile | `/profile` | `/users/profile` + `/professionals` | ✅ |
| AdminPanel | `/admin` | `/admin/dashboard` + `/admin/users` | ✅ |
| SubscriptionPage | `/subscriptions` | `/subscription/*` | ✅ |
| Settings | `/settings` | `/users/profile` | ✅ |
| Notifications | `/notifications` | `/notifications` API | ✅ |

## 7. MODELOS MONGODB (10)

- User (role, auth, preferences, membership, stats)
- Professional (profile, services, availability, pricing, verification)
- Category (title, description, icon, metadata)
- Booking (serviceName, date, time, status, price)
- Conversation (participants, lastMessage, isActive)
- Message (conversationId, senderId, text, read, readAt)
- Review (professionalId, userId, rating, comment)
- Payment (mpPaymentId, status, amount, type, userId)
- PaymentAudit (event, paymentId, userId, status, amount)
- Notification (user, title, message, type, status)

## 8. DEPLOY PRODUCCIÓN

```bash
# Backend (Render)
cd MiProfesional/backend
npm install
node src/server.js   # → puerto 10000

# Frontend (Vercel)
cd MiProfesional/frontend
npm install
npm run build         # → dist/
npx serve dist        # para preview

# Variables .env requeridas:
# MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET,
# MERCADOPAGO_ACCESS_TOKEN, CORS_ORIGIN
```

## 9. PENDIENTES POST-LANZAMIENTO

- [ ] Agregar `"type": "module"` a `frontend/package.json` (elimina warning Vite CJS)
- [ ] Configurar deploy automático (Render + Vercel desde GitHub)
- [ ] Agregar tests automatizados (Jest configurado en backend)
- [ ] Configurar webhook MP → apuntar a producción
- [ ] Migración Capacitor para APK Android
- [ ] Monitoreo con logs centralizados
- [ ] Backup automático MongoDB Atlas
