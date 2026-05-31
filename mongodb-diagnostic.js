// Diagnóstico de Conexión MongoDB Atlas - MiProfesional
// Script para verificar el estado de la conexión con MongoDB Atlas

require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 DIAGNÓSTICO DE CONEXIÓN MONGODB ATLAS - MIPROFESIONAL');
console.log('=' .repeat(60));

// 1. Verificar variable de entorno MONGODB_URI
console.log('\n1️⃣ VERIFICANDO VARIABLE DE ENTORNO MONGODB_URI:');
console.log('-'.repeat(40));

const mongodbUri = process.env.MONGODB_URI;

if (!mongodbUri) {
  console.log('❌ ERROR: MONGODB_URI no está definida');
  console.log('   Variables de entorno disponibles:');
  Object.keys(process.env)
    .filter(key => key.includes('MONGO') || key.includes('mongo'))
    .forEach(key => console.log(`   - ${key}: ${process.env[key] ? '✅ Definida' : '❌ No definida'}`));
  
  console.log('\n💡 SOLUCIÓN:');
  console.log('   Configura MONGODB_URI en tu archivo .env o en las variables de entorno de Render');
  console.log('   Valor esperado: mongodb+srv://usuario:password@cluster.mongodb.net/database');
  
  process.exit(1);
}

console.log('✅ MONGODB_URI está definida');
console.log(`📄 Longitud: ${mongodbUri.length} caracteres`);
console.log(`🔗 Protocolo: ${mongodbUri.includes('mongodb+srv://') ? 'mongodb+srv' : 'mongodb'}`);

// Ocultar credenciales en el log
const maskedUri = mongodbUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
console.log(`🔐 URI (enmascarada): ${maskedUri}`);

// 2. Analizar componentes de la URI
console.log('\n2️⃣ ANÁLISIS DE COMPONENTES DE LA URI:');
console.log('-'.repeat(40));

try {
  const url = new URL(mongodbUri);
  
  console.log(`🏢 Cluster: ${url.hostname}`);
  console.log(`📊 Database: ${url.pathname.replace('/', '') || '(default)'}`);
  console.log(`👤 Usuario: ${url.username || '(no especificado)'}`);
  console.log(`🔑 Password: ${url.password ? '✅ Configurado' : '❌ No configurado'}`);
  
  // Verificar si es un cluster de Atlas
  if (url.hostname.includes('mongodb.net')) {
    console.log('✅ Es un cluster de MongoDB Atlas');
  } else {
    console.log('⚠️ No parece ser un cluster de MongoDB Atlas');
  }
  
} catch (error) {
  console.log('❌ Error al analizar la URI:', error.message);
}

// 3. Intentar conexión con mongoose
console.log('\n3️⃣ INTENTANDO CONEXIÓN CON MONGOOSE:');
console.log('-'.repeat(40));

const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // 10 segundos timeout
  connectTimeoutMS: 10000,
  socketTimeoutMS: 10000,
  bufferMaxEntries: 0,
  bufferCommands: false,
};

console.log('⏳ Conectando a MongoDB Atlas...');
console.log(`⏱️ Timeout: ${connectionOptions.serverSelectionTimeoutMS}ms`);

mongoose.connect(mongodbUri, connectionOptions);

mongoose.connection.on('connected', () => {
  console.log('✅ CONEXIÓN ESTABLECIDA');
  console.log('📊 Estado: Connected');
  console.log(`🏢 Host: ${mongoose.connection.host}`);
  console.log(`📊 Database: ${mongoose.connection.name}`);
  console.log(`🔗 Port: ${mongoose.connection.port}`);
  
  // Verificar si podemos hacer operaciones
  mongoose.connection.db.admin().ping((err, result) => {
    if (err) {
      console.log('❌ Error al hacer ping:', err.message);
    } else {
      console.log('✅ Ping exitoso - Base de datos responde');
    }
    
    // Cerrar conexión
    mongoose.connection.close(() => {
      console.log('🔌 Conexión cerrada');
      console.log('\n🎉 DIAGNÓSTICO COMPLETADO - CONEXIÓN EXITOSA');
      process.exit(0);
    });
  });
});

mongoose.connection.on('error', (error) => {
  console.log('\n❌ ERROR DE CONEXIÓN DETECTADO:');
  console.log('-'.repeat(40));
  console.log(`📝 Mensaje: ${error.message}`);
  console.log(`🔍 Nombre: ${error.name}`);
  
  // Análisis específico de errores comunes
  console.log('\n🔍 ANÁLISIS DEL ERROR:');
  
  if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
    console.log('🌐 ERROR DE DNS / RED:');
    console.log('   - No se puede resolver el nombre del host');
    console.log('   - Posible causa: Error en el nombre del cluster');
    console.log('   - Solución: Verifica el nombre del cluster en MongoDB Atlas');
  }
  
  if (error.message.includes('ECONNREFUSED')) {
    console.log('🚫 CONEXIÓN RECHAZADA:');
    console.log('   - El servidor rechazó la conexión');
    console.log('   - Posible causa: Firewall o problema de red');
    console.log('   - Solución: Verifica la configuración de red');
  }
  
  if (error.message.includes('authentication') || error.message.includes('auth')) {
    console.log('🔐 ERROR DE AUTENTICACIÓN:');
    console.log('   - Usuario o contraseña incorrectos');
    console.log('   - Posible causa: Credenciales inválidas');
    console.log('   - Solución: Verifica usuario y password en MongoDB Atlas');
  }
  
  if (error.message.includes('IP') || error.message.includes('not authorized')) {
    console.log('🔒 ERROR DE AUTORIZACIÓN DE IP:');
    console.log('   - Tu IP no está en la lista blanca');
    console.log('   - Posible causa: Network Access en MongoDB Atlas');
    console.log('   - Solución: Agrega tu IP a Network Access en Atlas');
  }
  
  if (error.message.includes('timeout')) {
    console.log('⏱️ ERROR DE TIMEOUT:');
    console.log('   - La conexión tardó demasiado');
    console.log('   - Posible causa: Problemas de red o firewall');
    console.log('   - Solución: Verifica conexión a internet');
  }
  
  console.log('\n💡 RECOMENDACIONES:');
  console.log('1. Verifica las credenciales en MongoDB Atlas');
  console.log('2. Agrega tu IP a Network Access en Atlas');
  console.log('3. Verifica que el cluster esté activo');
  console.log('4. Confirma el nombre de la base de datos');
  
  mongoose.connection.close(() => {
    console.log('\n❌ DIAGNÓSTICO COMPLETADO - CONEXIÓN FALLIDA');
    process.exit(1);
  });
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Conexión desconectada');
});

// Timeout global
setTimeout(() => {
  console.log('\n⏱️ TIMEOUT GLOBAL - La conexión tardó demasiado');
  console.log('💡 Posibles causas:');
  console.log('   - Problemas de red');
  console.log('   - Firewall bloqueando la conexión');
  console.log('   - MongoDB Atlas no responde');
  
  mongoose.connection.close(() => {
    console.log('\n❌ DIAGNÓSTICO COMPLETADO - TIMEOUT');
    process.exit(1);
  });
}, 15000); // 15 segundos timeout global
