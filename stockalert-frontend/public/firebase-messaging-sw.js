importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBWY_hXtb3rwEBUyte2TRYWXqBNMw436Ek",
  authDomain: "stockalert-fd4d0.firebaseapp.com",
  projectId: "stockalert-fd4d0",
  storageBucket: "stockalert-fd4d0.firebasestorage.app",
  messagingSenderId: "734896996964",
  appId: "1:734896996964:web:2cd1187c101059c24b9571"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "StockAlert", {
    body: body || "",
    icon: "/favicon.svg",
    badge: "/favicon.svg"
  });
});
