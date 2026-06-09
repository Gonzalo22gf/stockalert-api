const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const enviarEmail = async ({ para, asunto, html }) => {
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "OK" : "VACIO");
  console.log("EMAIL_DESTINO:", para);

  try {
    const info = await transporter.sendMail({
      from: `"StockAlert" <${process.env.EMAIL_USER}>`,
      to: para,
      subject: asunto,
      html
    });

    console.log("EMAIL ENVIADO:", info.messageId);

    return info;
  } catch (error) {
    console.error("ERROR EMAIL:", error.message);
    throw error;
  }
};

module.exports = enviarEmail;