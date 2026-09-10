// firebase-admin v14: API modular. La credencial se lee desde FIREBASE_CREDENTIALS_B64
// (el JSON completo de la cuenta de servicio codificado en Base64 — robusto, sin problemas de \n).
// Si no existe esa variable, cae al metodo viejo por campos sueltos.
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");

let messaging = null;
try {
  let credencial = null;

  if (process.env.FIREBASE_CREDENTIALS_B64) {
    // Metodo robusto: JSON completo en Base64
    const json = Buffer.from(process.env.FIREBASE_CREDENTIALS_B64, "base64").toString("utf8");
    const cuenta = JSON.parse(json);
    credencial = cert(cuenta);
    console.log("[firebase] credencial desde Base64 OK - project:", cuenta.project_id);
  } else if (process.env.FIREBASE_PROJECT_ID) {
    // Metodo viejo: campos sueltos (fallback)
    const pk = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
    console.log("[firebase] credencial desde campos sueltos - BEGIN:", pk.includes("BEGIN PRIVATE KEY"));
    credencial = cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: pk
    });
  } else {
    console.error("[firebase] FALTAN credenciales - no se inicializa");
  }

  if (credencial && getApps().length === 0) {
    initializeApp({ credential: credencial });
    console.log("[firebase] initializeApp OK - apps:", getApps().length);
  }
  if (getApps().length > 0) {
    messaging = getMessaging();
  }
} catch (e) {
  console.error("[firebase] ERROR al inicializar:", e.message);
  messaging = null;
}

module.exports = messaging;
