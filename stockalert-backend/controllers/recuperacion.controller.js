const logger = require("../utils/logger");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const Usuario = require("../models/Usuario");
const { enviarCorreo } = require("../services/email");
const { validarPassword } = require("../utils/validarPassword");
const { ValidationError, AppError } = require("../utils/errors/AppError");

const URL_FRONTEND = "https://mistockalert.com";

function hashearToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const olvidePassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw new ValidationError("El email es obligatorio");
    const respuestaGenerica = { mensaje: "Si el correo esta registrado, te enviamos un link para restablecer la contrasena." };
    const usuario = await Usuario.findOne({ email: email.toLowerCase().trim() });
    if (!usuario) return res.json(respuestaGenerica);
    const token = crypto.randomBytes(32).toString("hex");
    usuario.tokenRecuperacion = hashearToken(token);
    usuario.tokenExpiracion = new Date(Date.now() + 60 * 60 * 1000);
    await usuario.save();
    const link = URL_FRONTEND + "/restablecer?token=" + token;
    await enviarCorreo({
      para: usuario.email,
      asunto: "Restablecer tu contrasena - StockAlert",
      html: "<div style='font-family:sans-serif;max-width:480px'><h2>Hola, " + usuario.nombre + "</h2><p>Recibimos un pedido para restablecer tu contrasena de <b>StockAlert</b>.</p><p><a href='" + link + "' style='display:inline-block;background:#6366f1;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none'>Restablecer contrasena</a></p><p style='color:#666;font-size:13px'>El link vence en 1 hora. Si no fuiste vos, ignora este correo.</p></div>"
    });
    res.json(respuestaGenerica);
  } catch (error) {
    next(error);
  }
};

const restablecerPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) throw new ValidationError("Token y nueva contrasena son obligatorios");
    const errorPassword = validarPassword(password);
    if (errorPassword) throw new ValidationError(errorPassword);
    const usuario = await Usuario.findOne({
      tokenRecuperacion: hashearToken(token),
      tokenExpiracion: { $gt: new Date() }
    });
    if (!usuario) throw new ValidationError("El link es invalido o ya vencio. Pedi uno nuevo.");
    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(password, salt);
    usuario.tokenRecuperacion = null;
    usuario.tokenExpiracion = null;
    await usuario.save();
    res.json({ mensaje: "Contrasena restablecida. Ya podes iniciar sesion." });
  } catch (error) {
    next(error);
  }
};

module.exports = { olvidePassword, restablecerPassword };
