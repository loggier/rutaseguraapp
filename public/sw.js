
// Estrategia: Cache First (para assets estáticos)
const CACHE_NAME = 'rutasegura-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  // Es importante no cachear el Service Worker en sí mismo.
];

self.addEventListener('install', event => {
  // Realiza la instalación
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // No intervenir en las peticiones que no son GET
  if (event.request.method !== 'GET') {
      return;
  }
  
  // No cachear las peticiones a la API
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si el recurso está en la caché, devuélvelo.
        if (response) {
          return response;
        }

        // Si no, búscalo en la red.
        return fetch(event.request).then(
          networkResponse => {
            // Y si lo encontramos, lo añadimos a la caché para la próxima vez.
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Borra las cachés antiguas
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
