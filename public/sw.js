// Escucha el evento de instalación del Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Service Worker a instalar...');
    // Forza al SW a activarse inmediatamente
    self.skipWaiting();
});

// Escucha el evento de activación del Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Service Worker activado.');
    // Toma el control de todas las páginas abiertas
    event.waitUntil(self.clients.claim());
});

// Intenta importar los scripts de Firebase. Si falla, lo registrará en la consola.
try {
    // Usamos importScripts porque 'import' no funciona en el scope global de un SW
    importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');
    console.log('[SW] Scripts de Firebase importados correctamente.');

    // ¡¡¡MUY IMPORTANTE!!!
    // REEMPLAZA ESTAS CREDENCIALES CON LAS DE TU PROYECTO DE FIREBASE.
    // Las encuentras en: Configuración del proyecto > General > Tus apps > Configuración de SDK.
    const firebaseConfig = {
      apiKey: "AIzaSyBQY3hL4_FJ5brqyXJrvZGv8Wzz7Jbvlow",
      authDomain: "dev2026-914cf.firebaseapp.com",
      projectId: "dev2026-914cf",
      storageBucket: "dev2026-914cf.firebasestorage.app",
      messagingSenderId: "961466814009",
      appId: "1:961466814009:web:b888041a63c159cc9fc7e8"
    };

    // Inicializa Firebase solo si no ha sido inicializado antes.
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('[SW] Firebase inicializado.');
    } else {
        firebase.app(); // Si ya está inicializado, simplemente lo usa.
        console.log('[SW] Firebase ya estaba inicializado.');
    }

    const messaging = firebase.messaging();

    // Este manejador se ejecuta cuando se recibe un mensaje PUSH y la app está en segundo plano o cerrada.
    messaging.onBackgroundMessage((payload) => {
        console.log('[SW] Mensaje de background recibido: ', payload);
        
        const notificationTitle = payload.notification?.title || 'Nueva Notificación';
        const notificationOptions = {
            body: payload.notification?.body || 'Has recibido una nueva notificación.',
            icon: payload.notification?.icon || '/icons/icon-192x192.png',
            // Añadimos datos personalizados para usarlos en el evento de clic
            data: {
                url: payload.data?.url || '/mipanel/notifications' // URL a abrir al hacer clic
            }
        };

        // Muestra la notificación al usuario
        self.registration.showNotification(notificationTitle, notificationOptions);
    });

} catch(e) {
    console.error('[SW] Error crítico al importar o inicializar Firebase en Service Worker:', e);
}


// Este manejador se ejecuta cuando el usuario HACE CLIC en la notificación.
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notificación clickeada: ', event.notification);

    event.notification.close(); // Cierra la notificación

    // Obtiene la URL de los datos que guardamos en onBackgroundMessage
    const urlToOpen = event.notification.data?.url || '/mipanel';

    // Busca si ya hay una ventana de la app abierta y la enfoca. Si no, abre una nueva.
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                // Si encontramos una ventana abierta con la misma URL, la enfocamos.
                if (client.url === self.origin + urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no hay ninguna ventana abierta, abrimos una nueva.
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
