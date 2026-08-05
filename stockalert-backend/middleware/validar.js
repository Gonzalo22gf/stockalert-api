const { ValidationError } = require("../utils/errors/AppError");

// Recibe un schema de Zod y devuelve un middleware que valida req.body
function validar(schema) {
  return (req, res, next) => {
    const resultado = schema.safeParse(req.body || {});
    if (!resultado.success) {
      const mensaje = resultado.error.errors.map((e) => e.message).join(". ");
      return next(new ValidationError(mensaje));
    }
    // Reemplazar req.body con los datos ya transformados por Zod
    req.body = resultado.data;
    next();
  };
}

module.exports = validar;
