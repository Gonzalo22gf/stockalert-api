const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
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