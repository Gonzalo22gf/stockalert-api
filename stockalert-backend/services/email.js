// Envio de correos via API HTTPS de Brevo (puerto 443).
// Render Free bloquea los puertos SMTP (25/465/587) desde sept 2025,
// por eso NO usamos nodemailer/SMTP: usamos la API web de Brevo.

async function enviarCorreo({ para, asunto, html }) {
  if (!process.env.BREVO_API_KEY || !process.env.EMAIL_USER) {
    throw new Error("Faltan las variables BREVO_API_KEY / EMAIL_USER");
  }

  const respuesta = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sender: { name: "StockAlert", email: process.env.EMAIL_USER },
      to: [{ email: para }],
      subject: asunto,
      htmlContent: html
    })
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    throw new Error("Brevo respondio " + respuesta.status + ": " + detalle);
  }

  return respuesta.json();
}

module.exports = { enviarCorreo };
