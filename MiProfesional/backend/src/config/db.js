const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!uri) {
      console.error("ERROR: MONGODB_URI/MONGO_URI no esta definida en el entorno");
      process.exit(1);
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 15000),
      connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 15000)
    });

    console.log("Base de datos conectada correctamente");
  } catch (error) {
    console.error("Error conectando a la base de datos:");
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
