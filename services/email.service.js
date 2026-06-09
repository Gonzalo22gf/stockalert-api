const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const enviarEmail = async ({ para, asunto, html }) => {
  console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY ? "OK" : "VACIO");
  console.log("EMAIL_DESTINO:", para);

  try {
    const info = await resend.emails.send({
      from: "StockAlert <onboarding@resend.dev>",
      to: para,
      subject: asunto,
      html
    });

    console.log("EMAIL ENVIADO:", info);

    return info;
  } catch (error) {
    console.error("ERROR EMAIL:", error.message);
    throw error;
  }
};

module.exports = enviarEmail;