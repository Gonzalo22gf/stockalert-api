const { ValidationError } = require("../utils/errors/AppError");

function validar(schema) {
  return (req, res, next) => {
    const resultado = schema.safeParse(req.body || {});
    if (!resultado.success) {
      const errores = resultado.error?.errors || [];
      const mensaje = errores.length > 0
        ? errores.map((e) => e.message).join(". ")
        : "Datos invalidos";
      return next(new ValidationError(mensaje));
    }
    req.body = resultado.data;
    next();
  };
}

module.exports = validar;
