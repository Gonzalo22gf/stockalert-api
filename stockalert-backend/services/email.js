const nodemailer = require("nodemailer");
const dns = require("dns").promises;

// Render no tiene salida IPv6 y Gmail resuelve primero por IPv6 (ENETUNREACH).
// Fix: resolvemos la IP de Gmail con el resolver del sistema forzando IPv4,
// y conectamos directo a esa IP con el servername correcto para el TLS.
async function crearTransporte() {
  const { address } = await dns.lookup("smtp.gmail.com", { family: 4 });
  return nodemailer.createTransport({
    host: address,
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: { servername: "smtp.gmail.com" }
  });
}

async function enviarCorreo({ para, asunto, html }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Faltan las variables EMAIL_USER / EMAIL_PASS");
  }
  const transporte = await crearTransporte();
  return transporte.sendMail({
    from: "\"StockAlert\" <" + process.env.EMAIL_USER + ">",
    to: para,
    subject: asunto,
    html
  });
}

module.exports = { enviarCorreo };
