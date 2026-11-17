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
  'src/install.js',
  'src/intro.js',
  'src/main.js',
  'src/menu-fx.js',
  'src/chiptune.js',
  'src/songs.js',
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
  'assets/fonts/fredoka-500-700-latin-ext.woff2',
  'assets/fonts/fredoka-500-700-latin.woff2',
  'assets/fonts/nunito-500-800-latin-ext.woff2',
  'assets/fonts/nunito-500-800-latin.woff2',
  'assets/fonts/silkscreen-400-latin-ext.woff2',
  'assets/fonts/silkscreen-400-latin.woff2',
  'assets/fonts/silkscreen-700-latin-ext.woff2',
  'assets/fonts/silkscreen-700-latin.woff2',
  'assets/fonts/space-grotesk-500-700-latin-ext.woff2',
  'assets/fonts/space-grotesk-500-700-latin.woff2',
  'assets/fonts/vt323-400-latin-ext.woff2',
  'assets/fonts/vt323-400-latin.woff2',
  'assets/fonts/space-mono-400-latin-ext.woff2',
  'assets/fonts/space-mono-400-latin.woff2',
  'assets/fonts/space-mono-700-latin-ext.woff2',
  'assets/fonts/space-mono-700-latin.woff2',
  'assets/icons/icon.svg',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-512.png',
  'assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  // cache: 'reload' skips the HTTP cache, otherwise a quick redeploy could precache the previous files
  const fresh = APP_SHELL.map((url) => new Request(url, { cache: 'reload' }));
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(fresh)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('pacman-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network first, cache as the offline fallback. Serving each file from the cache and refreshing it
// in the background (stale-while-revalidate) mixed versions after an update: a new index.html with
// an old ui.js or i18n.js, which showed raw "{mode}" placeholders. Online, every file is now current.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then((cache) =>
      fetch(request, { cache: 'no-cache' })
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(async () => {
          const cached = await cache.match(request, { ignoreSearch: true });
          return cached || (request.mode === 'navigate' ? cache.match('index.html') : Response.error());
        })
    )
  );
});
