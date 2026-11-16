// Service worker: makes the game installable and playable offline.
// __BUILD__ is replaced with the commit SHA by scripts/build.mjs, so every deploy gets a fresh cache.

const VERSION = '__BUILD__';
const CACHE = `pacman-${VERSION}`;

const APP_SHELL = [
  './',
  'index.html',
  'style.css',
  'manifest.webmanifest',
  'src/app.js',
  'src/audio.js',
  'src/config.js',
  'src/cutscene.js',
  'src/entities.js',
  'src/game.js',
  'src/i18n.js',
  'src/input.js',
  'src/main.js',
  'src/menu-fx.js',
  'src/sprites.js',
  'src/storage.js',
  'src/themes.js',
  'src/ui.js',
  'assets/fonts/fonts.css',
  'assets/fonts/press-start-2p-400-latin.woff2',
  'assets/fonts/press-start-2p-400-latin-ext.woff2',
  'assets/fonts/rajdhani-600-latin.woff2',
  'assets/fonts/rajdhani-600-latin-ext.woff2',
  'assets/fonts/rajdhani-700-latin.woff2',
  'assets/fonts/rajdhani-700-latin-ext.woff2',
  'assets/icons/icon.svg',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('pacman-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Stale-while-revalidate: instant loads from cache, refreshed in the background for next time.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
