const nodemailer = require("nodemailer");

// Transporte de correo usando Gmail + contraseña de aplicación
const transporte = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Envía un correo. Devuelve una promesa.
async function enviarCorreo({ para, asunto, html }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Faltan las variables EMAIL_USER / EMAIL_PASS");
  }
  return transporte.sendMail({
    from: "\"StockAlert\" <" + process.env.EMAIL_USER + ">",
    to: para,
    subject: asunto,
    html
  });
}

module.exports = { enviarCorreo };
