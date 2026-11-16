/** Entry point: wires the services, the game and the menu together. */

import { App } from './app.js';
import { Game } from './game.js';
import { MenuUI } from './ui.js';

const app = new App();
const game = new Game(app);
const menu = new MenuUI(app, game);
game.menu = menu;
menu.show();
game.updateSoundButton();

// Handy for debugging in the browser console
globalThis.__pacman = { app, game, menu };

// Offline support. Skipped on localhost so development is never served stale files.
if ('serviceWorker' in navigator && !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
