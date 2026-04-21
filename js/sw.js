const CACHE_NAME = 'jct-v1';
const ASSETS = [
  './',
  './index.html',
  './ascii.html',
  './filters.html',
  './palette.html',
  './gradient.html',
  './bigtext.html',
  './qrcode.html',
  './base64.html',
  './lorem.html',
  './resize.html',
  './colormixer.html',
  './uuid.html',
  './favicon.html',
  './pdf.html',
  './gif.html',
  './style.css',
  './shared.js',
  './ascii.js',
  './filters.js',
  './palette.js',
  './gradient.js',
  './bigtext.js',
  './drag.js',
  './qrcode.js',
  './base64.js',
  './lorem.js',
  './resize.js',
  './colormixer.js',
  './uuid.js',
  './favicon.js',
  './pdf.js',
  './gif.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => 
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((resp) => resp || fetch(e.request).then((fetchResp) => {
      if (fetchResp.ok && e.request.method === 'GET') {
        const clone = fetchResp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
      }
      return fetchResp;
    }))
  );
});