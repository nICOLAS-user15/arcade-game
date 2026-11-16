/**
 * "Install app" button. Chrome, Edge and Android offer a real install prompt (beforeinstallprompt);
 * iPhones and iPads have none, so the button opens short "Add to Home Screen" instructions instead.
 * The button stays hidden when the game already runs as an installed app.
 */

import { t } from './i18n.js';

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export class Installer {
  constructor(app) {
    this.app = app;
    this.button = app.$('btnInstall');
    this.dialog = app.$('installDialog');
    this.standalone = matchMedia('(display-mode: standalone)');
    this.deferred = null;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferred = e;
      this.update();
    });
    window.addEventListener('appinstalled', () => {
      this.deferred = null;
      this.update();
      app.toast(t('toast.installed'), 'good');
    });
    this.standalone.addEventListener?.('change', () => this.update());
    this.button.addEventListener('click', () => this.onClick());
    this.update();
  }

  get installed() {
    return this.standalone.matches || navigator.standalone === true;
  }

  update() {
    this.button.hidden = this.installed || !(this.deferred || isIos());
  }

  async onClick() {
    this.app.sound.init();
    this.app.sound.click();
    const prompt = this.deferred;
    if (!prompt) {
      this.dialog.showModal();
      return;
    }
    // A saved prompt can only be used once
    this.deferred = null;
    this.update();
    try {
      await prompt.prompt();
    } catch {
      /* the browser refused to show it */
    }
  }
}
