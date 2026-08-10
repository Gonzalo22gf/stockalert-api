import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBWY_hXtb3rwEBUyte2TRYWXqBNMw436Ek",
  authDomain: "stockalert-fd4d0.firebaseapp.com",
  projectId: "stockalert-fd4d0",
  storageBucket: "stockalert-fd4d0.firebasestorage.app",
  messagingSenderId: "734896996964",
  appId: "1:734896996964:web:2cd1187c101059c24b9571",
  measurementId: "G-J3LERCNLCL"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

const VAPID_KEY = "BHjXezzqA-k50fMe5e4ro9yW4OzfKvVbmNvfOEHv85oFZHHsPlJyoItMDpQOa8A0KiU5Vxze-dXnEMq9-DFw_Ko";

export async function solicitarPermisoPush() {
  try {
    const permiso = await Notification.requestPermission();
    if (permiso !== "granted") return null;
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token;
  } catch (e) {
    console.error("Error al obtener token push:", e);
    return null;
  }
}

export function escucharMensajes(callback) {
  return onMessage(messaging, callback);
}
