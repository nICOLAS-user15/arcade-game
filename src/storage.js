/**
 * Persistence: settings, personal bests and onboarding progress.
 * Every access is guarded because localStorage can be missing or throw
 * (private mode, blocked cookies, quota) and the game must keep working.
 */

import { DIFFICULTIES, GAME_MODES, CUSTOM_LIMITS, PHASE_COUNT, difficultyFor } from './config.js';
import { isSupported, DEFAULT_LANG } from './i18n.js';
import { THEMES, DEFAULT_THEME, CHARACTERS, DEFAULT_CHARACTER } from './themes.js';

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
    music: true,
    sfxVolume: 100,
    musicVolume: 100,
    haptics: true,
    reduceMotion: prefersReducedMotion,
    dpad: 'auto',
    theme: DEFAULT_THEME,
    mode: 'campaign',
    difficulty: 'normal',
    customLives: CUSTOM_LIMITS.lives.def,
    customSpeed: CUSTOM_LIMITS.speed.def,
    startStage: 1,
    character: DEFAULT_CHARACTER
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

export const BOARD_SIZE = 10;
export const NAME_LENGTH = 3;
const clampVolume = (v) => (Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v))) : 100);

/** Arcade initials: up to three letters or digits, upper case. */
export function cleanName(raw) {
  return String(raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, NAME_LENGTH);
}

function cleanEntry(e) {
  const score = Math.floor(Number(e?.score));
  if (!Number.isFinite(score) || score <= 0) return null;
  const level = Math.floor(Number(e?.level));
  return { name: cleanName(e?.name) || '---', score, level: Number.isFinite(level) && level > 0 ? level : 1, date: Number(e?.date) || 0 };
}

export class Storage {
  constructor(backend = pickBackend(), { prefersReducedMotion = false } = {}) {
    this.backend = backend;
    this.defaults = defaultSettings(prefersReducedMotion);
    this.migrateLegacy();
    this.migrateBoard();
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
    if (!DIFFICULTIES[s.difficulty] && s.difficulty !== 'custom') s.difficulty = 'normal';
    const custom = difficultyFor({ difficulty: 'custom', customLives: s.customLives, customSpeed: s.customSpeed });
    s.customLives = custom.lives;
    s.customSpeed = custom.speedPct;
    s.startStage = Number.isInteger(s.startStage) ? Math.min(PHASE_COUNT, Math.max(1, s.startStage)) : 1;
    if (!Object.hasOwn(CHARACTERS, s.character)) s.character = DEFAULT_CHARACTER;
    if (!Object.hasOwn(THEMES, s.theme)) s.theme = DEFAULT_THEME;
    s.sfxVolume = clampVolume(s.sfxVolume);
    s.musicVolume = clampVolume(s.musicVolume);
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

  // ---- top-10 table with initials -------------------------------------

  /** Top scores for one mode and difficulty, best first. */
  board(mode, difficulty) {
    const all = this.read('board', {});
    const raw = all && typeof all === 'object' ? all[scoreKey(mode, difficulty)] : null;
    const list = Array.isArray(raw) ? raw.map(cleanEntry).filter(Boolean) : [];
    return list.sort((a, b) => b.score - a.score).slice(0, BOARD_SIZE);
  }

  /** Personal bests saved before the table existed become its first entries, with "---" initials. */
  migrateBoard() {
    try {
      if (this.backend.getItem(PREFIX + 'board') !== null) return;
      const board = {};
      for (const [key, e] of Object.entries(this.allScores())) {
        const entry = cleanEntry({ name: '', score: e?.score, level: e?.level });
        if (entry) board[key] = [entry];
      }
      if (Object.keys(board).length) this.write('board', board);
    } catch {
      /* ignore */
    }
  }

  /** Zero-based position a score would take, or -1 when it does not make the table. */
  rankFor(mode, difficulty, score) {
    if (!(score > 0)) return -1;
    const list = this.board(mode, difficulty);
    const at = list.findIndex((e) => score > e.score);
    if (at >= 0) return at;
    return list.length < BOARD_SIZE ? list.length : -1;
  }

  qualifies(mode, difficulty, score) {
    return this.rankFor(mode, difficulty, score) >= 0;
  }

  /** Inserts a result. Returns its zero-based position, or -1 when it does not make the table. */
  addToBoard(mode, difficulty, { name, score, level }) {
    const rank = this.rankFor(mode, difficulty, score);
    if (rank < 0) return -1;
    const list = this.board(mode, difficulty);
    const entry = cleanEntry({ name, score, level, date: Date.now() });
    list.splice(rank, 0, entry);
    list.length = Math.min(list.length, BOARD_SIZE);
    const all = this.read('board', {});
    this.write('board', { ...(all && typeof all === 'object' && !Array.isArray(all) ? all : {}), [scoreKey(mode, difficulty)]: list });
    this.write('player', { name: entry.name });
    return rank;
  }

  /** Initials used last time, offered again on the next entry. */
  lastName() {
    return cleanName(this.read('player', {})?.name);
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

  /**
   * Highest stage (1..PHASE_COUNT) the player has reached in any mode. Endless can start from
   * any stage up to this one. Older saves count too: their best results store the level reached.
   */
  maxStage() {
    let best = Number(this.read('progress', {})?.maxStage) || 1;
    for (const e of Object.values(this.allScores())) best = Math.max(best, Number(e?.level) || 1);
    return Math.min(PHASE_COUNT, Math.max(1, Math.floor(best)));
  }

  reachStage(level) {
    const stage = Math.min(PHASE_COUNT, Math.floor(level));
    if (!(stage > this.maxStage())) return;
    this.write('progress', { maxStage: stage });
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
    for (const key of ['scores', 'board', 'player', 'stats', 'seen', 'progress']) {
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
