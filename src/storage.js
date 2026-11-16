/**
 * Persistence: settings, personal bests and onboarding progress.
 * Every access is guarded because localStorage can be missing or throw
 * (private mode, blocked cookies, quota) and the game must keep working.
 */

import { DIFFICULTIES, GAME_MODES } from './config.js';
import { isSupported, DEFAULT_LANG } from './i18n.js';
import { THEMES, DEFAULT_THEME } from './themes.js';

const PREFIX = 'pacman_';
const LEGACY_HIGH_SCORE_KEY = 'pacman_high_score';

export const DPAD_MODES = ['auto', 'on', 'off'];
/** Bumped when a saved setting must be reset once (v2: D-pad back to "auto" after the detection fix). */
export const SETTINGS_VERSION = 2;

export function defaultSettings(prefersReducedMotion = false) {
  return {
    version: SETTINGS_VERSION,
    lang: DEFAULT_LANG,
    sfx: true,
    haptics: true,
    reduceMotion: prefersReducedMotion,
    dpad: 'auto',
    theme: DEFAULT_THEME,
    mode: 'campaign',
    difficulty: 'normal'
  };
}

/** In-memory backend, used when localStorage is unavailable and in tests. */
export class MemoryBackend {
  constructor() {
    this.data = new Map();
  }
  getItem(k) {
    return this.data.has(k) ? this.data.get(k) : null;
  }
  setItem(k, v) {
    this.data.set(k, String(v));
  }
  removeItem(k) {
    this.data.delete(k);
  }
}

function pickBackend() {
  try {
    const ls = globalThis.localStorage;
    const probe = PREFIX + 'probe';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return new MemoryBackend();
  }
}

export const scoreKey = (mode, difficulty) => `${mode}:${difficulty}`;

export class Storage {
  constructor(backend = pickBackend(), { prefersReducedMotion = false } = {}) {
    this.backend = backend;
    this.defaults = defaultSettings(prefersReducedMotion);
    this.migrateLegacy();
  }

  read(key, fallback) {
    try {
      const raw = this.backend.getItem(PREFIX + key);
      if (raw === null) return fallback;
      const value = JSON.parse(raw);
      return value === null || value === undefined ? fallback : value;
    } catch {
      return fallback;
    }
  }

  write(key, value) {
    try {
      this.backend.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* storage unavailable or full: continue without saving */
    }
  }

  // ---- settings -------------------------------------------------------

  loadSettings() {
    const saved = this.read('settings', {});
    const s = { ...this.defaults };
    if (saved && typeof saved === 'object') {
      for (const key of Object.keys(s)) {
        if (typeof saved[key] === typeof s[key]) s[key] = saved[key];
      }
    }
    if (saved?.version !== SETTINGS_VERSION) {
      s.dpad = 'auto';
      s.version = SETTINGS_VERSION;
    }
    // Sanitize anything that could have been edited by hand
    if (!isSupported(s.lang)) s.lang = DEFAULT_LANG;
    if (!DPAD_MODES.includes(s.dpad)) s.dpad = 'auto';
    if (!GAME_MODES[s.mode]) s.mode = 'campaign';
    if (!DIFFICULTIES[s.difficulty]) s.difficulty = 'normal';
    if (!Object.hasOwn(THEMES, s.theme)) s.theme = DEFAULT_THEME;
    return s;
  }

  saveSettings(settings) {
    this.write('settings', settings);
  }

  // ---- scores ---------------------------------------------------------

  allScores() {
    const raw = this.read('scores', {});
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  }

  best(mode, difficulty) {
    const entry = this.allScores()[scoreKey(mode, difficulty)];
    const score = Number(entry?.score);
    const level = Number(entry?.level);
    return {
      score: Number.isFinite(score) && score > 0 ? Math.floor(score) : 0,
      level: Number.isFinite(level) && level > 0 ? Math.floor(level) : 0
    };
  }

  /** Records a result. Returns true when it beats the previous best score. */
  submitScore(mode, difficulty, score, level) {
    const all = this.allScores();
    const key = scoreKey(mode, difficulty);
    const prev = this.best(mode, difficulty);
    const entry = { score: prev.score, level: Math.max(prev.level, level) };
    const isRecord = score > prev.score;
    if (isRecord) entry.score = Math.floor(score);
    if (isRecord || entry.level !== prev.level) {
      all[key] = entry;
      this.write('scores', all);
    }
    return isRecord;
  }

  // ---- stats and onboarding -------------------------------------------

  stats() {
    const s = this.read('stats', {});
    return { gamesPlayed: Number(s?.gamesPlayed) > 0 ? Math.floor(s.gamesPlayed) : 0 };
  }

  incrementGamesPlayed() {
    const s = this.stats();
    s.gamesPlayed++;
    this.write('stats', s);
    return s.gamesPlayed;
  }

  seen(name) {
    const seen = this.read('seen', {});
    return !!(seen && seen[name]);
  }

  markSeen(name) {
    const seen = this.read('seen', {});
    this.write('seen', { ...(seen && typeof seen === 'object' ? seen : {}), [name]: true });
  }

  /** Erases scores, stats and onboarding progress but keeps the user's settings. */
  resetProgress() {
    for (const key of ['scores', 'stats', 'seen']) {
      try {
        this.backend.removeItem(PREFIX + key);
      } catch {
        /* ignore */
      }
    }
  }

  // The first version of the game saved a single number under this key.
  migrateLegacy() {
    try {
      const raw = this.backend.getItem(LEGACY_HIGH_SCORE_KEY);
      if (raw === null) return;
      const legacy = parseInt(raw, 10);
      if (legacy > 0 && this.best('campaign', 'normal').score === 0) {
        this.submitScore('campaign', 'normal', legacy, 1);
      }
      this.backend.removeItem(LEGACY_HIGH_SCORE_KEY);
    } catch {
      /* ignore */
    }
  }
}
