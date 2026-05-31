// Diagnóstico Final de Conexión MongoDB Atlas - MiProfesional
// Script actualizado con opciones corregidas

require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 DIAGNÓSTICO FINAL DE CONEXIÓN MONGODB ATLAS');
console.log('=' .repeat(60));

// 1. Verificar variable de entorno
console.log('\n1️⃣ VERIFICACIÓN DE MONGODB_URI:');
console.log('-'.repeat(40));

const mongodbUri = process.env.MONGODB_URI;

if (!mongodbUri) {
  console.log('❌ MONGODB_URI no está definida');
  console.log('\n💡 CONFIGURACIÓN REQUERIDA:');
  console.log('MONGODB_URI=mongodb+srv://miprofesional_luis:Luisaguerre1966@miprofesional-cluster.zhkc2iq.mongodb.net/miprofesional?retryWrites=true&w=majority');
  process.exit(1);
}

// Ocultar credenciales
const maskedUri = mongodbUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
console.log(`🔐 URI: ${maskedUri}`);

// 2. Analizar URI
console.log('\n2️⃣ ANÁLISIS DE URI:');
console.log('-'.repeat(40));

try {
  const url = new URL(mongodbUri);
  console.log(`🏢 Host: ${url.hostname}`);
  console.log(`📊 DB: ${url.pathname.replace('/', '') || 'default'}`);
  console.log(`👤 Usuario: ${url.username || 'no especificado'}`);
  console.log(`🔑 Password: ${url.password ? 'configurado' : 'no configurado'}`);
  
  if (url.hostname.includes('mongodb.net')) {
    console.log('✅ Es cluster MongoDB Atlas');
  } else {
    console.log('⚠️ No es cluster Atlas (es localhost)');
  }
} catch (error) {
  console.log('❌ Error analizando URI:', error.message);
}

// 3. Intentar conexión con opciones corregidas
console.log('\n3️⃣ TEST DE CONEXIÓN:');
console.log('-'.repeat(40));

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 10000,
};

console.log('⏳ Conectando...');
mongoose.connect(mongodbUri, options);

mongoose.connection.on('connected', () => {
  console.log('✅ CONEXIÓN EXITOSA');
  console.log(`📊 Database: ${mongoose.connection.name}`);
  console.log(`🏢 Host: ${mongoose.connection.host}`);
  
  // Test de operación
  mongoose.connection.db.admin().ping((err, result) => {
    if (err) {
      console.log('❌ Error ping:', err.message);
    } else {
      console.log('✅ Ping exitoso - Base de datos operativa');
    }
    
    mongoose.connection.close(() => {
      console.log('\n🎉 DIAGNÓSTICO COMPLETADO - CONEXIÓN FUNCIONAL');
      process.exit(0);
    });
  });
});

mongoose.connection.on('error', (error) => {
  console.log('\n❌ ERROR DE CONEXIÓN:');
  console.log(`📝 Mensaje: ${error.message}`);
  
  // Análisis específico
  if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
    console.log('🌐 ERROR DNS - Nombre de host incorrecto');
  }
  if (error.message.includes('authentication')) {
    console.log('🔐 ERROR AUTENTICACIÓN - Credenciales inválidas');
  }
  if (error.message.includes('IP') || error.message.includes('not authorized')) {
    console.log('🔒 ERROR AUTORIZACIÓN - IP no permitida');
  }
  if (error.message.includes('timeout')) {
    console.log('⏱️ ERROR TIMEOUT - Problemas de red');
  }
  
  console.log('\n💡 SOLUCIONES:');
  console.log('1. Verifica MONGODB_URI en Render');
  console.log('2. Agrega IP a Network Access en Atlas');
  console.log('3. Verifica credenciales en Atlas');
  
  mongoose.connection.close(() => {
    console.log('\n❌ DIAGNÓSTICO COMPLETADO - CONEXIÓN FALLIDA');
    process.exit(1);
  });
});

// Timeout
setTimeout(() => {
  console.log('\n⏱️ TIMEOUT - Revisa conexión a internet');
  mongoose.connection.close(() => {
    process.exit(1);
  });
}, 15000);
