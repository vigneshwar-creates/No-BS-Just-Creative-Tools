// Just Creative Tools — Service Worker v1.0
// Enables offline support and "Install to Home Screen" on mobile

const CACHE_NAME = 'jct-v1';

// Core files to cache immediately on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/shared.js',
  '/assets/manifest.json',
  // Tool pages
  '/html/ascii.html',
  '/html/base64.html',
  '/html/bigtext.html',
  '/html/blur.html',
  '/html/brightness.html',
  '/html/colormixer.html',
  '/html/collage.html',
  '/html/convert.html',
  '/html/crop.html',
  '/html/favicon.html',
  '/html/filters.html',
  '/html/flip.html',
  '/html/gif.html',
  '/html/gradient.html',
  '/html/heic.html',
  '/html/imagediff.html',
  '/html/lorem.html',
  '/html/metadata.html',
  '/html/palette.html',
  '/html/pdf.html',
  '/html/qrcode.html',
  '/html/resize.html',
  '/html/steganography.html',
  '/html/uuid.html',
  '/html/validate.html',
  '/html/watermark.html',
  '/html/wave.html',
  '/html/waveform.html',
  '/html/audio-convert.html',
];

// ── Install: cache all core assets ─────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache what we can; don't fail install if some assets are missing
      return Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch(() => {
            console.warn('[SW] Failed to cache:', url);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: Network-first for HTML, Cache-first for assets ──────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // Skip non-GET requests (e.g. POST from forms)
  if (request.method !== 'GET') return;

  // HTML pages: Network-first (get latest, fall back to cache)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Assets (CSS, JS, images): Cache-first (fast, fall back to network)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

// ── Background Sync: notify clients of new version ─────────────────────────
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
