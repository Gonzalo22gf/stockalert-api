const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    ciphers: "SSLv3"
  }
});

const enviarEmail = async ({ para, asunto, html }) => {
  await transporter.sendMail({
    from: `"StockAlert" <${process.env.EMAIL_USER}>`,
    to: para,
    subject: asunto,
    html
  });
};

module.exports = enviarEmail;