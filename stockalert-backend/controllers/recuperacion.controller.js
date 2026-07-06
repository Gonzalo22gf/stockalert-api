const crypto = require("crypto");
const { validarPassword } = require("../utils/validarPassword");
const bcrypt = require("bcryptjs");
const Usuario = require("../models/Usuario");
const { enviarCorreo } = require("../services/email");

const URL_FRONTEND = "https://gonzalo22gf.github.io/stockalert-api";

// Hashea el token para guardarlo (nunca se guarda el token en crudo)
function hashearToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// PASO 1: El usuario pide recuperar su contraseña
const olvidePassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ mensaje: "El email es obligatorio" });
    }

    const usuario = await Usuario.findOne({ email: email.toLowerCase().trim() });

    // Por seguridad, siempre respondemos lo mismo (exista o no el email),
    // para no revelar qué correos están registrados.
    const respuestaGenerica = {
      mensaje: "Si el correo está registrado, te enviamos un link para restablecer la contraseña."
    };

    if (!usuario) {
      return res.json(respuestaGenerica);
    }

    // Token aleatorio: se manda en crudo por correo, se guarda hasheado
    const token = crypto.randomBytes(32).toString("hex");
    usuario.tokenRecuperacion = hashearToken(token);
    usuario.tokenExpiracion = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    await usuario.save();

    const link = URL_FRONTEND + "/restablecer?token=" + token;

    await enviarCorreo({
      para: usuario.email,
      asunto: "Restablecer tu contraseña - StockAlert",
      html:
        "<div style='font-family:sans-serif;max-width:480px'>" +
        "<h2>Hola, " + usuario.nombre + "</h2>" +
        "<p>Recibimos un pedido para restablecer tu contraseña de <b>StockAlert</b>.</p>" +
        "<p><a href='" + link + "' style='display:inline-block;background:#6366f1;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none'>Restablecer contraseña</a></p>" +
        "<p style='color:#666;font-size:13px'>El link vence en 1 hora. Si no fuiste vos, ignorá este correo y tu contraseña seguirá igual.</p>" +
        "</div>"
    });

    res.json(respuestaGenerica);
  } catch (error) {
    console.error("ERROR OLVIDE PASSWORD:", error);
    res.status(500).json({ mensaje: "Error al procesar la solicitud" });
  }
};

// PASO 2: El usuario llega con el token y la contraseña nueva
const restablecerPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ mensaje: "Token y nueva contraseña son obligatorios" });
    }
    const errorPassword = validarPassword(password);
    if (errorPassword) {
      return res.status(400).json({ mensaje: errorPassword });
    }

    const usuario = await Usuario.findOne({
      tokenRecuperacion: hashearToken(token),
      tokenExpiracion: { $gt: new Date() }
    });

    if (!usuario) {
      return res.status(400).json({ mensaje: "El link es inválido o ya venció. Pedí uno nuevo." });
    }

    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(password, salt);
    usuario.tokenRecuperacion = null;
    usuario.tokenExpiracion = null;
    await usuario.save();

    res.json({ mensaje: "Contraseña restablecida. Ya podés iniciar sesión." });
  } catch (error) {
    console.error("ERROR RESTABLECER PASSWORD:", error);
    res.status(500).json({ mensaje: "Error al restablecer la contraseña" });
  }
};

module.exports = { olvidePassword, restablecerPassword };
