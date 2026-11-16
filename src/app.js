/**
 * Shared services for the menu and the game: persisted settings, audio, haptics,
 * toasts, screen-reader announcements and the layout flags derived from settings.
 */

import { Storage } from './storage.js';
import { SoundController, Haptics } from './audio.js';
import { setLang, onLangChange } from './i18n.js';
import { getTheme, canvasFont } from './themes.js';
import { setSkin } from './sprites.js';

export class App {
  constructor() {
    this.$ = (id) => document.getElementById(id);
    this.reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    this.coarseQuery = matchMedia('(pointer: coarse)');
    this.anyCoarseQuery = matchMedia('(any-pointer: coarse)');
    this.smallQuery = matchMedia('(max-width: 600px), (max-height: 500px) and (orientation: landscape)');
    this.touchSeen = false;

    this.storage = new Storage(undefined, { prefersReducedMotion: this.reducedMotionQuery.matches });
    this.settings = this.storage.loadSettings();
    this.sound = new SoundController();
    this.haptics = new Haptics();
    this.listeners = new Set();

    // "auto" D-pad follows the primary pointer type, which can change (e.g. a 2-in-1 laptop)
    this.coarseQuery.addEventListener?.('change', () => this.applySettings());
    this.smallQuery.addEventListener?.('change', () => this.applySettings());
    // Some phone browsers (e.g. "desktop site" mode) misreport the primary pointer, so a real touch also counts
    window.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch' || this.touchSeen) return;
      this.touchSeen = true;
      this.applySettings();
    }, { capture: true, passive: true });

    // Browsers only allow audio after a user gesture: unlock it on the first one, so the menu music starts
    const unlock = () => this.sound.init();
    window.addEventListener('pointerdown', unlock, { once: true, capture: true });
    window.addEventListener('keydown', unlock, { once: true, capture: true });

    setLang(this.settings.lang);
    this.applySettings();
  }

  /** Subscribe to any settings change (including language). */
  onChange(fn) {
    this.listeners.add(fn);
    onLangChange(fn);
  }

  save() {
    this.storage.saveSettings(this.settings);
  }

  update(patch) {
    Object.assign(this.settings, patch);
    this.save();
    this.applySettings();
    this.listeners.forEach((fn) => fn(this.settings));
  }

  setLanguage(code) {
    // Store first: setLang notifies the menu, which reads the current language from the settings
    this.settings.lang = code;
    this.save();
    setLang(code);
  }

  get dpadVisible() {
    const mode = this.settings.dpad;
    if (mode !== 'auto') return mode === 'on';
    // Deliberately generous: missing arrows on a phone is far worse than extra arrows on a touch laptop
    const touchScreen = (navigator.maxTouchPoints || 0) > 0 || this.anyCoarseQuery.matches || 'ontouchstart' in window;
    return this.coarseQuery.matches || this.touchSeen || touchScreen || this.smallQuery.matches;
  }

  applySettings() {
    const s = this.settings;
    this.sound.setEnabled(s.sfx);
    this.sound.setMusicEnabled(s.music);
    this.haptics.setEnabled(s.haptics);
    const root = document.documentElement;
    root.dataset.dpad = this.dpadVisible ? 'on' : 'off';
    root.dataset.motion = s.reduceMotion ? 'reduced' : 'full';
    const theme = this.theme;
    root.dataset.theme = theme.id;
    setSkin(theme.skin);
    // The canvas does not trigger web font downloads by itself; ask for the theme's font now
    document.fonts?.load(canvasFont(theme, 12)).catch(() => {});
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.chrome);
  }

  get theme() {
    return getTheme(this.settings.theme);
  }

  get reduceMotion() {
    return this.settings.reduceMotion;
  }

  /** Short visual message in the corner (decorative: not read by screen readers). */
  toast(message, kind = '') {
    const box = this.$('toasts');
    const el = document.createElement('div');
    el.className = `toast ${kind}`.trim();
    el.textContent = message;
    box.appendChild(el);
    setTimeout(() => el.classList.add('out'), 2200);
    setTimeout(() => el.remove(), 2700);
  }

  /** Polite screen-reader announcement. */
  announce(message) {
    const el = this.$('srStatus');
    el.textContent = '';
    // A tick later so repeating the same text is announced again
    setTimeout(() => (el.textContent = message), 30);
  }
}
