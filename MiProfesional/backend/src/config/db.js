const mongoose = require("mongoose");
const logger = require("../utils/logger");
const { resolveMongoSrv } = require("../utils/srvResolver");

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!uri) {
      throw new Error("MONGODB_URI/MONGO_URI no esta definida en el entorno");
    }

    if (uri.startsWith("mongodb+srv://")) {
      logger.info("Resolviendo DNS SRV para URI de MongoDB Atlas...");
      uri = await resolveMongoSrv(uri);
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 15000),
      connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 15000),
      tls: true
    });

    logger.info("Base de datos conectada correctamente");

    try {
      const db = mongoose.connection.db;
      const indexes = await db.collection("users").indexes();
      const phoneIndex = indexes.find(idx => idx.name === "phone_1");
      if (phoneIndex && phoneIndex.unique) {
        await db.collection("users").dropIndex("phone_1");
        logger.info("Dropped stale unique index on phone_1");
      }
    } catch (idxErr) {
      logger.info(`Index cleanup note: ${idxErr.message}`);
    }

    try {
      const db = mongoose.connection.db;
      const proIndexes = await db.collection("professionals").indexes();
      for (const idx of proIndexes) {
        if (idx.unique && idx.name !== "_id_") {
          await db.collection("professionals").dropIndex(idx.name);
          logger.info(`Dropped stale unique index on professionals: ${idx.name}`);
        }
      }
    } catch (idxErr) {
      logger.info(`Professionals index cleanup note: ${idxErr.message}`);
    }
  } catch (error) {
    logger.error("Error conectando a la base de datos:");
    logger.error(error.message);
    throw error;
  }
};

module.exports = connectDB;
