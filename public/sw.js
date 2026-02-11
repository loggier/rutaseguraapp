// Importa los scripts de Firebase (¡asegúrate de que las versiones coincidan con tu package.json!)
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging-compat.js');

console.log('[SW] Service Worker cargado.');

// **IMPORTANTE**: Reemplaza esta configuración con la de tu propio proyecto de Firebase.
// La encuentras en: Configuración del proyecto > Tus apps > SDK de Firebase.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_FROM_FIREBASE_CONSOLE_GOES_HERE",
  authDomain: "YOUR_AUTH_DOMAIN_FROM_FIREBASE_CONSOLE_GOES_HERE",
  projectId: "YOUR_PROJECT_ID_FROM_FIREBASE_CONSOLE_GOES_HERE",
  storageBucket: "YOUR_STORAGE_BUCKET_FROM_FIREBASE_CONSOLE_GOES_HERE",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_FROM_FIREBASE_CONSOLE_GOES_HERE",
  appId: "YOUR_APP_ID_FROM_FIREBASE_CONSOLE_GOES_HERE",
};

try {
  firebase.initializeApp(firebaseConfig);
  console.log('[SW] Firebase app inicializada correctamente.');
} catch (e) {
  console.error('[SW] Error al inicializar Firebase en el Service Worker:', e);
}


const messaging = firebase.messaging();
console.log('[SW] Firebase Messaging object inicializado.');

// Este manejador se activa cuando se recibe un mensaje y la app está en segundo plano o cerrada.
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Received background message. ', payload);

  // IMPORTANTE: El backend debe enviar toda la información de la notificación
  // dentro del payload `data`. El payload `notification` NO debe usarse,
  // ya que puede ser manejado automáticamente por el navegador, causando duplicados.
  const data = payload.data;
  if (!data || !data.title) {
    console.error('[SW] Background message is missing `data` payload or `data.title`. Cannot display notification.');
    return;
  }

  const notificationTitle = data.title;
  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-72x72.png', // Un ícono más pequeño para la barra de estado de Android
    data: {
      url: data.url || '/mipanel/notifications', // URL a abrir cuando se haga clic
    },
    // Usar una etiqueta (tag) ayuda a agrupar o reemplazar notificaciones
    tag: 'rutasegura-notification'
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});


// Este manejador se activa cuando el usuario hace clic en la notificación.
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received.', event);

  event.notification.close(); // Cierra la notificación

  const urlToOpen = new URL(event.notification.data.url || '/', self.location.origin).href;

  // Intenta enfocar una pestaña existente de la app o abrir una nueva.
  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {
      // Si ya hay una ventana abierta con la misma URL, la enfoca.
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abre una nueva ventana.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('install', (event) => {
  console.log('[SW] Evento: install');
  // Fuerza al nuevo Service Worker a activarse inmediatamente.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Evento: activate');
  // Toma el control de todas las páginas abiertas inmediatamente.
  event.waitUntil(clients.claim());
});
