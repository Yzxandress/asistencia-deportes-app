// 1. Cambia el número de versión (ejemplo: de v1 a v2)
const CACHE_NAME = 'deportes-app-v2';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './Logo.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Instalación: Guarda la nueva versión en caché
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  // Fuerza al nuevo Service Worker a activarse de inmediato
  self.skipWaiting();
});

// Activación: ELIMINA los cachés antiguos (como 'deportes-app-v1')
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Borrando caché antiguo:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  // Toma el control de la aplicación inmediatamente
  self.clients.claim();
});

// Interceptar peticiones para responder desde la caché nueva o la red
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
