/** Entry point: wires the services, the game and the menu together. */

import { App } from './app.js';
import { Game } from './game.js';
import { MenuUI } from './ui.js';
import { Intro } from './intro.js';
import { Installer } from './install.js';

const app = new App();
new Installer(app);
const game = new Game(app);
const menu = new MenuUI(app, game);
game.menu = menu;
menu.show();
game.updateSoundButton();
new Intro(app).play();

const isLocalDev = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);

// Console handle for debugging, only on the local dev server: on the published site it would
// let anyone rewrite the score or the game state from the browser console.
if (isLocalDev) globalThis.__pacman = { app, game, menu };

// Offline support. Skipped on localhost so development is never served stale files.
if ('serviceWorker' in navigator && !isLocalDev) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
