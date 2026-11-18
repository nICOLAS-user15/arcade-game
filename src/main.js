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
  // Everything is translated and themed now: show the menu (see src/boot.js)
  document.documentElement.classList.remove('booting');

  // Console handle for debugging, only on the local dev server: on the published site it would
  // let anyone rewrite the score or the game state from the browser console.
  if (isLocalDev) globalThis.__pacman = { app, game, menu };

  // Offline support. Skipped on localhost so development is never served stale files.
  if ('serviceWorker' in navigator && !isLocalDev) {
    // A page that was already controlled and sees a new worker take over is running old code
    // (e.g. the installed app left open across a release): offer a reload instead of updating silently
    const hadWorker = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadWorker) showUpdateNotice(game);
    });
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(serviceWorkerUrl()).catch(() => {});
    });
  }
}

/** Small bar at the bottom: "A new version is ready" with Update / Later. Never interrupts a run. */
let updateNotice = null;

function showUpdateNotice(game) {
  if (updateNotice) return;
  const bar = document.createElement('div');
  updateNotice = bar;
  bar.className = 'update-notice';
  bar.setAttribute('role', 'status');
  const text = document.createElement('span');
  text.textContent = t('update.ready');
  const reload = document.createElement('button');
  reload.type = 'button';
  reload.className = 'btn-primary small';
  reload.textContent = t('update.reload');
  reload.addEventListener('click', () => {
    game.commitScore();
    location.reload();
  });
  const later = document.createElement('button');
  later.type = 'button';
  later.className = 'btn-ghost';
  later.textContent = t('update.later');
  later.addEventListener('click', () => bar.remove());
  bar.append(text, reload, later);
  document.body.append(bar);
}

if (isFramed()) showFrameNotice();
else start();
