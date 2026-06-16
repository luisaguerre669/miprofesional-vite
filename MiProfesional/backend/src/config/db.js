const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error("ERROR: MONGODB_URI no est\u00E1 definida en el archivo .env");
      process.exit(1);
    }
    await mongoose.connect(uri);
    console.log("Base de datos conectada correctamente");
  } catch (error) {
    console.error("Error conectando a la base de datos:");
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
