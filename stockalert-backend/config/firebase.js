let admin;
try {
  admin = require("firebase-admin");
  if (admin.apps && !admin.apps.length) {
    if (!process.env.FIREBASE_PROJECT_ID) {
      console.error("[firebase] FALTA FIREBASE_PROJECT_ID - no se inicializa");
    } else {
      const pk = process.env.FIREBASE_PRIVATE_KEY || "";
      console.log("[firebase] project:", process.env.FIREBASE_PROJECT_ID);
      console.log("[firebase] client_email presente:", !!process.env.FIREBASE_CLIENT_EMAIL);
      console.log("[firebase] private_key largo:", pk.length, "| empieza con BEGIN:", pk.includes("BEGIN PRIVATE KEY"), "| tiene \\n literal:", pk.includes("\\n"), "| tiene salto real:", pk.includes("\n"));
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: pk.replace(/\\n/g, "\n")
        })
      });
      console.log("[firebase] initializeApp OK - apps:", admin.apps.length);
    }
  }
} catch (e) {
  console.error("[firebase] ERROR al inicializar:", e.message);
  admin = null;
}
module.exports = admin;
