// -------------------------------------------------------------------------
// ¡ACCIÓN REQUERIDA!
// Reemplaza las siguientes credenciales con las de tu propio proyecto de Firebase.
// Las encuentras en: Configuración del proyecto > General > Tus apps > Configuración de SDK.
// -------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBQY3hL4_FJ5brqyXJrvZGv8Wzz7Jbvlow",
  authDomain: "dev2026-914cf.firebaseapp.com",
  projectId: "dev2026-914cf",
  storageBucket: "dev2026-914cf.firebasestorage.app",
  messagingSenderId: "961466814009",
  appId: "1:961466814009:web:b888041a63c159cc9fc7e8",
};

self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker is being installed.');
  try {
    // Usa 'importScripts' que es la sintaxis correcta para Service Workers.
    // Usamos las versiones 'compat' por su mayor compatibilidad en este entorno.
    importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
    importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");
    console.log('[SW] Firebase scripts imported successfully.');

    // Inicializa Firebase
    firebase.initializeApp(firebaseConfig);
    console.log('[SW] Firebase initialized successfully.');

  } catch (error) {
    console.error('[SW] Error during Firebase initialization in install event:', error);
    // Si esto falla, el SW no se instalará correctamente.
  }
  // self.skipWaiting() fuerza al SW a activarse más rápido.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker is being activated.');
  // self.clients.claim() asegura que el nuevo SW tome control de la página inmediatamente.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[SW] Push event received.', event.data.text());

  const notificationData = event.data.json();
  const title = notificationData.notification.title;
  const options = {
    body: notificationData.notification.body,
    icon: notificationData.notification.icon || '/logo.jpeg',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

console.log('[SW] Script loaded. Event listeners are set up.');
