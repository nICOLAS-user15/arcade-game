/** Entry point: wires the services, the game and the menu together. */

import { App } from './app.js';
import { Game } from './game.js';
import { MenuUI } from './ui.js';
import { Intro } from './intro.js';
import { Installer } from './install.js';
import { t, setLang, isSupported } from './i18n.js';

const isLocalDev = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);

/**
 * GitHub Pages cannot send X-Frame-Options or a frame-ancestors header, so another site could load
 * the game in a hidden frame and trick a player into clicking (e.g. "Reset progress"). Inside a frame
 * the game does not start; it offers a link that opens it on its own page instead.
 */
function isFramed() {
  try {
    return window.top !== window.self;
  } catch {
    return true; // a cross-origin parent blocks the check: certainly framed
  }
}

function showFrameNotice() {
  const lang = (navigator.language || '').slice(0, 2);
  setLang(isSupported(lang) ? lang : 'en');
  const box = document.createElement('main');
  box.className = 'frame-notice';
  const text = document.createElement('p');
  text.textContent = t('frame.notice');
  const link = document.createElement('a');
  link.href = location.href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.className = 'btn-primary';
  link.textContent = t('frame.open');
  box.append(text, link);
  document.body.replaceChildren(box);
}

/**
 * Trusted Types (CSP require-trusted-types-for): the service worker URL is the only script URL the
 * game ever hands to the browser, so the single policy accepts exactly that and nothing else.
 */
function serviceWorkerUrl() {
  const policy = window.trustedTypes?.createPolicy('pacman', {
    createScriptURL: (url) => {
      if (url !== 'sw.js') throw new TypeError(`Blocked script URL: ${url}`);
      return url;
    }
  });
  return policy ? policy.createScriptURL('sw.js') : 'sw.js';
}

function start() {
  const app = new App();
  new Installer(app);
  const game = new Game(app);
  const menu = new MenuUI(app, game);
  game.menu = menu;
  menu.show();
  game.updateSoundButton();
  new Intro(app).play();

  // Console handle for debugging, only on the local dev server: on the published site it would
  // let anyone rewrite the score or the game state from the browser console.
  if (isLocalDev) globalThis.__pacman = { app, game, menu };

  // Offline support. Skipped on localhost so development is never served stale files.
  if ('serviceWorker' in navigator && !isLocalDev) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(serviceWorkerUrl()).catch(() => {});
    });
  }
}

if (isFramed()) showFrameNotice();
else start();
