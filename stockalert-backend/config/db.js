const logger = require("../utils/logger");
const mongoose = require("mongoose");

const conectarDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("MongoDB conectado correctamente");
  } catch (error) {
    logger.error("Error al conectar MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = conectarDB;