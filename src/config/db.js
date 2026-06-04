const mongoose = require("mongoose");
const logger = require("../utils/logger");

const MAX_RETRIES = 5;
const RETRY_BASE_DELAY_MS = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async (retryCount = 0) => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    logger.error("MONGODB_URI/MONGO_URI no esta definida en el entorno — el servidor funcionara sin base de datos");
    return;
  }

  try {
    mongoose.set("bufferCommands", false);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 15000),
      connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 15000)
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
    logger.error(`Error conectando a la base de datos (intento ${retryCount + 1}/${MAX_RETRIES}):`);
    logger.error(`  Mensaje: ${error.message}`);
    logger.error(`  Stack: ${error.stack}`);

    if (retryCount < MAX_RETRIES - 1) {
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, retryCount);
      logger.info(`Reintentando conexion en ${delay}ms...`);
      await sleep(delay);
      return connectDB(retryCount + 1);
    }

    logger.error("Se agotaron los reintentos de conexion a la base de datos — el servidor funcionara sin base de datos");
  }
};

module.exports = connectDB;
