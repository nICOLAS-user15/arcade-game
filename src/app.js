/**
 * Shared services for the menu and the game: persisted settings, audio, haptics,
 * toasts, screen-reader announcements and the layout flags derived from settings.
 */

import { Storage } from './storage.js';
import { SoundController, Haptics } from './audio.js';
import { setLang, onLangChange } from './i18n.js';
import { getTheme, canvasFont } from './themes.js';
import { setSkin, setCharacter } from './sprites.js';

export class App {
  constructor() {
    this.$ = (id) => document.getElementById(id);
    this.reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

    this.storage = new Storage(undefined, { prefersReducedMotion: this.reducedMotionQuery.matches });
    this.settings = this.storage.loadSettings();
    this.sound = new SoundController();
    this.haptics = new Haptics();
    this.listeners = new Set();

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

  /** On by default: device detection proved unreliable on phones, so the player simply turns it off. */
  get dpadVisible() {
    return this.settings.dpad !== 'off';
  }

  applySettings() {
    const s = this.settings;
    this.sound.setEnabled(s.sfx);
    this.sound.setMusicEnabled(s.music);
    this.sound.setVolumes(s.musicVolume / 100, s.sfxVolume / 100);
    this.haptics.setEnabled(s.haptics);
    const root = document.documentElement;
    root.dataset.dpad = this.dpadVisible ? 'on' : 'off';
    root.dataset.motion = s.reduceMotion ? 'reduced' : 'full';
    const theme = this.theme;
    root.dataset.theme = theme.id;
    setSkin(theme.skin);
    setCharacter(s.character);
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
