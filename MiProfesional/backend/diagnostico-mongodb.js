require("dotenv").config();
const mongoose = require("mongoose");

async function diagnosticoMongoDB() {
  console.log("=== DIAGNÓSTICO DE CONEXIÓN A MONGODB ===");

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("ERROR: MONGODB_URI no está definida.");
    process.exit(1);
  }

  console.log("MONGODB_URI encontrada.");

  try {
    console.log("Intentando conectar a MongoDB...");

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("Conexión exitosa a MongoDB.");

    const db = mongoose.connection.db;

    const admin = db.admin();
    const info = await admin.serverStatus();

    console.log("Estado del servidor:", info.ok);

    await mongoose.disconnect();

    console.log("DIAGNÓSTICO COMPLETADO: TODO FUNCIONA");

  } catch (error) {
    console.error("ERROR AL CONECTAR:");

    console.error("Mensaje:", error.message);

    if (
      error.message.includes("IP") ||
      error.message.includes("not authorized") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("ENOTFOUND")
    ) {
      console.log("");
      console.log("POSIBLE CAUSA:");
      console.log("La IP del servidor no está autorizada en MongoDB Atlas.");
      console.log("Revisar: Seguridad → Acceso a la red.");
    }

    console.log("");
    console.log("FIN DEL DIAGNÓSTICO CON ERRORES");

    process.exit(1);
  }
}

diagnosticoMongoDB();
