// Prueba de URI corregida para MongoDB Atlas
require('dotenv').config();
const mongoose = require('mongoose');

async function testCorrectedURI() {
  console.log('=== PRUEBA DE URI CORREGIDA MONGODB ATLAS ===');
  
  // URI corregida sin parámetros problemáticos
  const uri = 'mongodb+srv://miprofesional_luis:Luisaguerre1966@miprofesional-cluster.zhkc2iq.mongodb.net/miprofesional';
  
  console.log('URI:', uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
  console.log('Intentando conectar...');
  
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 15000,
    });
    
    console.log('✅ CONEXIÓN EXITOSA A MONGODB ATLAS');
    
    // Verificar que podemos hacer operaciones
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Colecciones encontradas: ${collections.length}`);
    
    await mongoose.disconnect();
    console.log('🎉 PRUEBA COMPLETADA: CONEXIÓN FUNCIONAL');
    
  } catch (error) {
    console.error('❌ ERROR:');
    console.error('Tipo:', error.constructor.name);
    console.error('Mensaje:', error.message);
    
    // Análisis específico
    if (error.message.includes('not authorized') || error.message.includes('IP')) {
      console.log('\n🔒 ERROR DE AUTORIZACIÓN DE IP');
      console.log('Solución: Agregar 0.0.0.0/0 a Network Access en Atlas');
    } else if (error.message.includes('authentication')) {
      console.log('\n🔐 ERROR DE AUTENTICACIÓN');
      console.log('Solución: Verificar usuario y contraseña');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n🌐 ERROR DE DNS');
      console.log('Solución: Verificar nombre del cluster');
    } else {
      console.log('\n❓ ERROR DESCONOCIDO');
      console.log('Revisar: https://cloud.mongodb.com');
    }
    
    process.exit(1);
  }
}

testCorrectedURI();
