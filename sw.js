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
  'src/boot.js',
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
  'src/version.js',
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

// Absolute URLs of the files the game is made of. Only these are ever stored: caching any URL that
// happens to be requested would let the cache grow without limit (every ?query is a new entry) and
// keep responses that are not part of the game.
const SHELL_URLS = new Set(APP_SHELL.map((p) => new URL(p, self.location).href));
const INDEX_URL = new URL('index.html', self.location).href;
/** How long a request may take before the cached copy answers instead (slow or flaky connections). */
const NETWORK_TIMEOUT = 4000;

/** The cache key for a request: same URL without ?query or #hash, so "./?utm=x" maps to "./". */
function shellKey(request) {
  const url = new URL(request.url);
  url.search = '';
  url.hash = '';
  return url.href;
}

// Network first, cache as the offline fallback. Serving each file from the cache and refreshing it
// in the background (stale-while-revalidate) mixed versions after an update: a new index.html with
// an old ui.js or i18n.js, which showed raw "{mode}" placeholders. Online, every file is now current.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  const key = shellKey(request);
  const isShell = SHELL_URLS.has(key);
  const isPage = request.mode === 'navigate';
  if (!isShell && !isPage) return; // not part of the game: let the browser handle it normally

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const network = fetch(request, { cache: 'no-cache' }).then((response) => {
        // Only complete, same-origin ("basic") answers for game files are kept
        if (isShell && response.ok && response.type === 'basic') cache.put(key, response.clone());
        return response;
      });
      const cached = (await cache.match(key)) || (isPage ? await cache.match(INDEX_URL) : undefined);
      if (!cached) return network.catch(() => Response.error());
      // A connection that is up but barely works must not freeze the game: after a few seconds the
      // cached copy answers (the network reply still refreshes the cache when it arrives)
      const slow = new Promise((resolve) => setTimeout(() => resolve(cached), NETWORK_TIMEOUT));
      return Promise.race([network.catch(() => cached), slow]);
    })()
  );
});
