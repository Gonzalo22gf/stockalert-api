const nodemailer = require("nodemailer");
const dns = require("dns");

// Render a veces resuelve Gmail por IPv6 y falla (ENETUNREACH). Forzamos IPv4 primero.
dns.setDefaultResultOrder("ipv4first");

const transporte = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

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
