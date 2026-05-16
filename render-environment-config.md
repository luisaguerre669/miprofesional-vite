# CONFIGURACIÓN DE VARIABLES DE ENTORNO EN RENDER

## Pasos para Configurar MONGODB_URI en Render

### 1. Acceder al Dashboard de Render
- Ir a: https://render.com
- Iniciar sesión con tu cuenta
- Seleccionar el servicio: `miprofesional-backend`

### 2. Configurar Variables de Entorno
1. En el servicio, hacer clic en **"Environment"**
2. Hacer clic en **"Add Environment Variable"**
3. Agregar las siguientes variables:

### Variables OBLIGATORIAS

#### MONGODB_URI
```
MONGODB_URI=mongodb+srv://miprofesional_luis:Luisaguerre1966@miprofesional-cluster.zhkc2iq.mongodb.net/miprofesional?retryWrites=true&w=majority
```

#### JWT_SECRET
```
JWT_SECRET=MI_PROFESIONAL_JWT_SECRET_KEY_2024_SUPER_SEGURA_PRODUCTION_CHANGE_ME
```

#### NODE_ENV
```
NODE_ENV=production
```

### Variables Opcionales (Recomendadas)

#### PORT
```
PORT=10000
```

#### CORS_ORIGIN
```
CORS_ORIGIN=https://miprofesional-backend.onrender.com
```

### 3. Guardar y Deploy
1. Hacer clic en **"Save Changes"**
2. Esperar el auto-deploy
3. Verificar los logs en tiempo real

## Verificación de Configuración

Después de configurar, el servidor debería mostrar estos logs:

```
🚀 Iniciando servidor MiProfesional...
📦 Variables de entorno cargadas
🔧 NODE_ENV: production
🔌 PORT: 10000
🗄️ MONGODB_URI: ✅ Configurada
🔐 JWT_SECRET: ✅ Configurada
✅ Configuración de DB cargada
🔄 Iniciando servidor...
🔗 Conectando a MongoDB Atlas...
✅ MongoDB conectado exitosamente
🌐 Iniciando servidor en puerto 10000...
🎉 SERVIDOR INICIADO EXITOSAMENTE
```

## Si Persiste el Error

### Verificar Network Access en MongoDB Atlas
1. Ir a: https://cloud.mongodb.com
2. Seleccionar cluster: `miprofesional-cluster`
3. Ir a **Security → Network Access**
4. Agregar IP: `0.0.0.0/0` (permite acceso desde cualquier IP)
5. Guardar cambios

### Verificar Credenciales
- Usuario: `miprofesional_luis`
- Password: `Luisaguerre1966`
- Database: `miprofesional`

## Estado Esperado Después de la Configuración

- ✅ **MONGODB_URI**: Apunta a MongoDB Atlas
- ✅ **Conexión**: Exitosa a la nube
- ✅ **Servidor**: Inicia correctamente
- ✅ **API**: Endpoints funcionales
