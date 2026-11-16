/**
 * Shared services for the menu and the game: persisted settings, audio, haptics,
 * toasts, screen-reader announcements and the layout flags derived from settings.
 */

import { Storage } from './storage.js';
import { SoundController, Haptics } from './audio.js';
import { setLang, onLangChange } from './i18n.js';

export class App {
  constructor() {
    this.$ = (id) => document.getElementById(id);
    this.reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    this.coarseQuery = matchMedia('(pointer: coarse)');

    this.storage = new Storage(undefined, { prefersReducedMotion: this.reducedMotionQuery.matches });
    this.settings = this.storage.loadSettings();
    this.sound = new SoundController();
    this.haptics = new Haptics();
    this.listeners = new Set();
    this.toastTimers = new Set();

    // "auto" D-pad follows the primary pointer type, which can change (e.g. a 2-in-1 laptop)
    this.coarseQuery.addEventListener?.('change', () => this.applySettings());

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
    setLang(code);
    this.settings.lang = code;
    this.save();
  }

  get dpadVisible() {
    const mode = this.settings.dpad;
    return mode === 'on' || (mode === 'auto' && this.coarseQuery.matches);
  }

  applySettings() {
    const s = this.settings;
    this.sound.setEnabled(s.sfx);
    this.haptics.setEnabled(s.haptics);
    const root = document.documentElement;
    root.dataset.dpad = this.dpadVisible ? 'on' : 'off';
    root.dataset.hand = s.leftHanded ? 'left' : 'right';
    root.dataset.motion = s.reduceMotion ? 'reduced' : 'full';
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
    const fade = setTimeout(() => el.classList.add('out'), 2200);
    const remove = setTimeout(() => el.remove(), 2700);
    this.toastTimers.add(fade).add(remove);
  }

  /** Polite screen-reader announcement. */
  announce(message) {
    const el = this.$('srStatus');
    el.textContent = '';
    // A tick later so repeating the same text is announced again
    setTimeout(() => (el.textContent = message), 30);
  }
}
