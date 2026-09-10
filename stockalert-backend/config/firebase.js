// firebase-admin v14 usa API modular: initializeApp/cert vienen de "firebase-admin/app"
// y getMessaging de "firebase-admin/messaging". La API vieja (admin.messaging()) ya no existe.
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");

let messaging = null;
try {
  if (!process.env.FIREBASE_PROJECT_ID) {
    console.error("[firebase] FALTA FIREBASE_PROJECT_ID - no se inicializa");
  } else if (getApps().length === 0) {
    const pk = process.env.FIREBASE_PRIVATE_KEY || "";
    console.log("[firebase] project:", process.env.FIREBASE_PROJECT_ID);
    console.log("[firebase] client_email presente:", !!process.env.FIREBASE_CLIENT_EMAIL);
    console.log("[firebase] private_key largo:", pk.length, "| BEGIN:", pk.includes("BEGIN PRIVATE KEY"), "| \\n literal:", pk.includes("\\n"));
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: pk.replace(/\\n/g, "\n")
      })
    });
    console.log("[firebase] initializeApp OK - apps:", getApps().length);
  }
  // Si ya habia una app inicializada (o recien la creamos), obtenemos messaging.
  if (getApps().length > 0) {
    messaging = getMessaging();
  }
} catch (e) {
  console.error("[firebase] ERROR al inicializar:", e.message);
  messaging = null;
}

// Exporta el objeto messaging (o null si fallo). push.service.js lo usa directo.
module.exports = messaging;
