// Reglas de seguridad para contrasenas nuevas.
// Devuelve null si es valida, o un mensaje de error si no cumple.
function validarPassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres";
  }
  if (!/[A-Z]/.test(password)) {
    return "La contraseña debe incluir al menos una letra mayúscula";
  }
  if (!/[0-9]/.test(password)) {
    return "La contraseña debe incluir al menos un número";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "La contraseña debe incluir al menos un símbolo (ej: ! @ # $ %)";
  }
  return null;
}

module.exports = { validarPassword };
