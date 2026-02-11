// /public/sw.js

console.log('[SW] Script start.');

try {
  // Se utiliza importScripts porque es la forma síncrona y compatible con service workers clásicos.
  importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');
  console.log('[SW] Firebase scripts imported successfully.');
} catch (e) {
  console.error('[SW] Error importing Firebase scripts:', e);
}


// IMPORTANTE: ¡DEBES REEMPLAZAR ESTO CON TU CONFIGURACIÓN DE FIREBASE!
// La encuentras en: Configuración del proyecto > General > Tus apps > Configuración de SDK.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

try {
  // Usamos el namespace global `firebase` que está disponible después de importScripts.
  firebase.initializeApp(firebaseConfig);
  console.log('[SW] Firebase app initialized.');
  
  const messaging = firebase.messaging();
  
  messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: payload.notification.icon || '/icons/icon-192x192.png',
    };
  
    self.registration.showNotification(notificationTitle, notificationOptions);
  });
  console.log('[SW] Background message handler set up.');

} catch (e) {
  console.error('[SW] Error during Firebase setup:', e.message);
  // Si la configuración no es válida, la inicialización fallará aquí.
}


const CACHE_NAME = 'rutasegura-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/logo.jpeg',
  '/icons/icon-192x192.png'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Event: install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('[SW] Caching failed:', err);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Event: activate');
  // Elimina cachés antiguas.
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Le dice al service worker que tome el control de la página inmediatamente.
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Estrategia Network-first para peticiones de navegación.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
    return;
  }

  // Estrategia Cache-first para todos los demás recursos.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

console.log('[SW] Script end.');
