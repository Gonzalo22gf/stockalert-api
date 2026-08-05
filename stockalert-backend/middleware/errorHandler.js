const logger = require("../utils/logger");
const { AppError } = require("../utils/errors/AppError");

// Maneja errores de Mongoose (validacion, duplicados, cast)
function manejarErrorMongoose(error) {
  // Campo duplicado (unique violation)
  if (error.code === 11000) {
    const campo = Object.keys(error.keyValue || {})[0] || "campo";
    return { statusCode: 409, mensaje: "Ya existe un registro con ese " + campo };
  }
  // Error de validacion de schema
  if (error.name === "ValidationError") {
    const mensaje = Object.values(error.errors).map((e) => e.message).join(". ");
    return { statusCode: 400, mensaje };
  }
  // ID invalido
  if (error.name === "CastError") {
    return { statusCode: 400, mensaje: "ID invalido: " + error.value };
  }
  return null;
}

// Middleware de manejo de errores — SIEMPRE va al final de app.js
function errorHandler(error, req, res, next) {
  // Errores de Mongoose
  const mongooseError = manejarErrorMongoose(error);
  if (mongooseError) {
    return res.status(mongooseError.statusCode).json({ mensaje: mongooseError.mensaje });
  }

  // Errores JWT
  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({ mensaje: "Token invalido o expirado" });
  }
  if (error.name === "TokenExpiredError") {
    return res.status(401).json({ mensaje: "Token expirado, vuelve a iniciar sesion" });
  }

  // Errores operacionales nuestros (AppError y sus hijos)
  if (error.esOperacional) {
    return res.status(error.statusCode).json({ mensaje: error.message });
  }

  // Error inesperado (bug) — loguear full stack y no exponer detalles
  logger.error("ERROR INESPERADO:", error);
  res.status(500).json({ mensaje: "Algo salio mal. Intentalo de nuevo." });
}

module.exports = errorHandler;
