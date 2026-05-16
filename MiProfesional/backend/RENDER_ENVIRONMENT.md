# Variables de Entorno para Render

## Variables OBLIGATORIAS (sin estas el servidor no iniciará)

### MONGODB_URI
- **Valor**: `mongodb+srv://miprofesional_luis:Luisaguerre1966@miprofesional-cluster.zhkc2iq.mongodb.net/miprofesional?retryWrites=true&w=majority`
- **Descripción**: URL de conexión a MongoDB Atlas
- **Estado**: CRÍTICO - El servidor se detiene si no está configurada

### JWT_SECRET
- **Valor**: `MI_PROFESIONAL_JWT_SECRET_KEY_2024_SUPER_SEGURA_PRODUCTION_CHANGE_ME`
- **Descripción**: Clave secreta para tokens JWT
- **Estado**: CRÍTICO - El servidor se detiene si no está configurada

### NODE_ENV
- **Valor**: `production`
- **Descripción**: Entorno de ejecución
- **Estado**: Recomendado para producción

### PORT
- **Valor**: `10000`
- **Descripción**: Puerto para Render
- **Estado**: Configurado automáticamente por Render

## Variables OPCIONALES

### CORS_ORIGIN
- **Valor**: `https://miprofesional-backend.onrender.com`
- **Descripción**: Orígenes permitidos para CORS
- **Estado**: Opcional - se usa configuración por defecto

## Configuración en Render

1. Ir al dashboard de Render
2. Seleccionar el servicio "miprofesional-backend"
3. Ir a "Environment"
4. Agregar las variables obligatorias:
   ```
   MONGODB_URI=mongodb+srv://miprofesional_luis:Luisaguerre1966@miprofesional-cluster.zhkc2iq.mongodb.net/miprofesional?retryWrites=true&w=majority
   JWT_SECRET=MI_PROFESIONAL_JWT_SECRET_KEY_2024_SUPER_SEGURA_PRODUCTION_CHANGE_ME
   NODE_ENV=production
   ```

## Verificación

El servidor mostrará estos logs al iniciar correctamente:
```
🚀 Iniciando servidor MiProfesional...
📦 Variables de entorno cargadas
🔧 NODE_ENV: production
🔌 PORT: 10000
🗄️ MONGODB_URI: ✅ Configurada
🔐 JWT_SECRET: ✅ Configurada
✅ Rutas de auth cargadas
✅ Rutas de bookings cargadas
✅ Configuración de DB cargada
✅ Rutas configuradas
🔄 Iniciando servidor...
🗄️ Conectando a MongoDB...
✅ MongoDB conectado exitosamente
🌐 Iniciando servidor en puerto 10000...
🎉 SERVIDOR INICIADO EXITOSAMENTE
📍 URL: http://localhost:10000
🌍 Entorno: production
🔗 Health Check: http://localhost:10000/health
📚 API Base: http://localhost:10000/api
```

## Errores Comunes

Si ves estos errores, configura las variables faltantes:

```
❌ ERROR CRÍTICO: MONGODB_URI no está configurada
❌ ERROR CRÍTICO: JWT_SECRET no está configurada
```

## Endpoints Disponibles

- `GET /` - Información de la API
- `GET /health` - Health check
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/bookings` - Bookings (placeholder)
