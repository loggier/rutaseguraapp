// A basic service worker to enable PWA installability and standalone mode.

// On install, log a message.
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
});

// On activation, log a message.
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
});

// The fetch event handler is crucial for the browser to consider the app installable.
// This is a "network-first" or "pass-through" fetch handler.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
