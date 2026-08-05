// Clase base para todos los errores de la aplicacion.
// Cualquier error "esperado" (validacion, no encontrado, etc.) hereda de esta.
class AppError extends Error {
  constructor(mensaje, statusCode = 500) {
    super(mensaje);
    this.statusCode = statusCode;
    this.esOperacional = true; // distingue errores nuestros de bugs inesperados
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(recurso = "Recurso") {
    super(recurso + " no encontrado", 404);
  }
}

class ForbiddenError extends AppError {
  constructor(mensaje = "No tenes permiso para realizar esta accion") {
    super(mensaje, 403);
  }
}

class UnauthorizedError extends AppError {
  constructor(mensaje = "No autorizado") {
    super(mensaje, 401);
  }
}

class ValidationError extends AppError {
  constructor(mensaje) {
    super(mensaje, 400);
  }
}

class ConflictError extends AppError {
  constructor(mensaje) {
    super(mensaje, 409);
  }
}

module.exports = { AppError, NotFoundError, ForbiddenError, UnauthorizedError, ValidationError, ConflictError };
