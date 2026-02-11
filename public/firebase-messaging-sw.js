
// Scripts for firebase and firebase messaging
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

// **ACCIÓN REQUERIDA:**
// Reemplaza estas credenciales con las de tu proyecto de Firebase.
// Debes copiarlas aquí porque el Service Worker se ejecuta en un entorno separado.
const firebaseConfig = {
    apiKey: "AIzaSyBQY3hL4_FJ5brqyXJrvZGv8Wzz7Jbvlow",
    authDomain: "dev2026-914cf.firebaseapp.com",
    projectId: "dev2026-914cf",
    storageBucket: "dev2026-914cf.firebasestorage.app",
    messagingSenderId: "961466814009",
    appId: "1:961466814009:web:b888041a63c159cc9fc7e8",
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon || '/logo.jpeg', // Icono por defecto
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
