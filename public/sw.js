const CACHE_NAME = 'rutasegura-cache-v1';

// Install event: cache the app shell
self.addEventListener('install', (event) => {
  // Skip waiting allows the new service worker to activate immediately.
  self.skipWaiting();
  console.log('Service Worker: Installing...');
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('Service Worker: Activating and claiming clients...');
        // Claim clients immediately so that the new service worker can control the page.
        return self.clients.claim();
    })
  );
});


// Fetch event: serve from cache or fetch from network (Cache-first strategy)
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For API calls, Supabase, and Google APIs, always go to the network.
  const isExternalAPI = event.request.url.includes('/api/') || 
                        event.request.url.includes('supabase.co') || 
                        event.request.url.includes('googleapis.com');

  if (isExternalAPI) {
    // For API calls, it's generally best to go network-first.
    event.respondWith(fetch(event.request));
    return;
  }

  // Use a cache-first strategy for all other requests.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request)
        .then((response) => {
          // If we have a response in the cache, return it.
          if (response) {
            return response;
          }

          // Otherwise, fetch from the network.
          return fetch(event.request).then((networkResponse) => {
            // And cache the new response for next time.
            // We only cache successful responses.
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        })
        .catch(error => {
            console.error('Service Worker fetch error:', error);
            // Optional: return a fallback offline page if you have one.
            // return caches.match('/offline.html');
        });
    })
  );
});
