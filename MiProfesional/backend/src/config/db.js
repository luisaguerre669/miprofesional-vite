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

    try {
      const db = mongoose.connection.db;
      const indexes = await db.collection("users").indexes();
      const phoneIndex = indexes.find(idx => idx.name === "phone_1");
      if (phoneIndex && phoneIndex.unique) {
        await db.collection("users").dropIndex("phone_1");
        console.log("Dropped stale unique index on phone_1");
      }
    } catch (idxErr) {
      console.log("Index cleanup note:", idxErr.message);
    }
  } catch (error) {
    console.error("Error conectando a la base de datos:");
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
