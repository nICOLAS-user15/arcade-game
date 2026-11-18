/*
 * Runs before the first paint (a classic script in <head>; the CSP forbids inline scripts).
 * Applies the saved theme, language, D-pad and motion settings to <html>, so the page never flashes
 * the default Classic theme or English text before the game has loaded. The menu stays hidden
 * (html.booting) until main.js has translated it; a timer lifts that in any case.
 * Keep the lists below in sync with src/themes.js, src/i18n.js and SETTINGS_VERSION in src/storage.js.
 */
(function boot() {
  var root = document.documentElement;
  try {
    var s = JSON.parse(localStorage.getItem('pacman_settings') || '{}') || {};
    var themes = { classic: 1, retro: 1, pastel: 1, minimal: 1 };
    var langs = { en: 'en', pt: 'pt-BR', fr: 'fr', es: 'es', ja: 'ja' };
    if (themes[s.theme] === 1) root.setAttribute('data-theme', s.theme);
    if (Object.prototype.hasOwnProperty.call(langs, s.lang)) root.lang = langs[s.lang];
    // Saves older than v4 get the D-pad switched back on once, so only a recent "Off" counts
    if (s.dpad === 'off' && s.version >= 4) root.setAttribute('data-dpad', 'off');
    if (s.reduceMotion === true) root.setAttribute('data-motion', 'reduced');
  } catch (e) {
    /* storage blocked or corrupt: the defaults in index.html apply */
  }
  root.classList.add('booting');
  setTimeout(function () { root.classList.remove('booting'); }, 3000);
})();
