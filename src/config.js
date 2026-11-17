/**
 * Static game data and pure rules: constants, tile types, difficulties,
 * the five stages and the level-parameter formula used by Campaign and Endless.
 * Stage colors live in themes.js so each visual theme can restyle them.
 * No DOM access here so everything can be unit-tested in Node.
 */

export const TILE_SIZE = 20;
export const COLS = 19;
export const ROWS = 21;
export const LOGICAL_W = COLS * TILE_SIZE;
export const LOGICAL_H = ROWS * TILE_SIZE;

/** The simulation always advances in fixed steps so speed never depends on the display refresh rate. */
export const STEP = 1 / 60;
export const MAX_STEPS_PER_FRAME = 5;

export const TILE = Object.freeze({
  EMPTY: 0,
  WALL: 1,
  PELLET: 2,
  POWER: 3,
  DOOR: 4,   // ghost house door (ghosts only)
  HOUSE: 5,  // ghost house interior
  PORTAL: 6, // corner warp portal
  VOID: 9    // outside the playfield
});

export const DIRS = Object.freeze({
  UP: Object.freeze({ x: 0, y: -1, angle: 1.5 * Math.PI, name: 'UP' }),
  DOWN: Object.freeze({ x: 0, y: 1, angle: 0.5 * Math.PI, name: 'DOWN' }),
  LEFT: Object.freeze({ x: -1, y: 0, angle: Math.PI, name: 'LEFT' }),
  RIGHT: Object.freeze({ x: 1, y: 0, angle: 0, name: 'RIGHT' })
});

export const SPAWN = Object.freeze({
  pacman: { col: 9, row: 16 },
  fruit: { col: 9, row: 12 },
  ghostExit: { col: 9, row: 8 },
  ghostHouse: { col: 9, row: 9 }
});

export const SCORE = Object.freeze({
  PELLET: 10,
  POWER: 50,
  GHOST_BASE: 200, // 200, 400, 800, 1600
  EXTRA_LIFE_AT: 10000,
  CUTSCENE_TAP: 100
});

export const GAME_MODES = Object.freeze({
  campaign: { id: 'campaign', endless: false },
  endless: { id: 'endless', endless: true }
});

/**
 * Difficulty only scales the existing stage values, so the five stages keep their identity.
 * speed/fright/release are multipliers; lives is the starting count; extraLife grants one more at 10,000 points.
 */
export const DIFFICULTIES = Object.freeze({
  easy: { id: 'easy', lives: 5, ghostSpeed: 0.85, fright: 1.3, release: 1.35, extraLife: true },
  normal: { id: 'normal', lives: 3, ghostSpeed: 1, fright: 1, release: 1, extraLife: true },
  hard: { id: 'hard', lives: 2, ghostSpeed: 1.1, fright: 0.7, release: 0.7, extraLife: true },
  hardcore: { id: 'hardcore', lives: 1, ghostSpeed: 1.18, fright: 0.5, release: 0.45, extraLife: false }
});

/** Limits of the "Custom" difficulty. Custom games are never ranked. */
export const CUSTOM_LIMITS = Object.freeze({
  lives: { min: 1, max: 5, def: 3 },
  speed: { min: 70, max: 140, step: 5, def: 100 } // ghost speed, % of Normal
});

const clampInt = (v, { min, max, def }) => (Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : def);

/** The difficulty object for the saved settings, including the player-tuned "custom" one. */
export function difficultyFor(settings) {
  if (settings?.difficulty === 'custom') {
    const lives = clampInt(settings.customLives, CUSTOM_LIMITS.lives);
    const speed = clampInt(settings.customSpeed, CUSTOM_LIMITS.speed);
    return { id: 'custom', custom: true, lives, speedPct: speed, ghostSpeed: speed / 100, fright: 1, release: 1, extraLife: true };
  }
  return DIFFICULTIES[settings?.difficulty] || DIFFICULTIES.normal;
}

export const GHOST_DEFS = Object.freeze([
  { name: 'Blinky', color: '#ff2a2a', startCol: 9, startRow: 8, corner: { x: 18, y: 0 } },
  { name: 'Pinky', color: '#ffb8ff', startCol: 9, startRow: 10, corner: { x: 0, y: 0 } },
  { name: 'Inky', color: '#22e6ff', startCol: 8, startRow: 10, corner: { x: 18, y: 20 } },
  { name: 'Clyde', color: '#ffb852', startCol: 10, startRow: 10, corner: { x: 0, y: 20 } }
]);

// Legend: 0 empty, 1 wall, 2 pellet, 3 power pellet, 4 ghost door, 5 ghost house, 6 portal, 9 void
export const PHASES = [
  {
    id: 'classic',
    ghostSpeed: 1.35,
    pacmanSpeed: 2,
    frightenedDuration: 9,
    ghostReleases: [0, 2.5, 6, 10],
    fruit: { icon: '🍒', points: 100 },
    feature: { icon: '🌀' },
    tunnels: [{ row: 10, leftCol: 0, rightCol: 18 }],
    portals: [],
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 3, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 3, 1],
      [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
      [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1],
      [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
      [1, 1, 1, 1, 2, 1, 1, 1, 0, 0, 0, 1, 1, 1, 2, 1, 1, 1, 1],
      [9, 9, 9, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 9, 9, 9],
      [1, 1, 1, 1, 2, 1, 0, 1, 1, 4, 1, 1, 0, 1, 2, 1, 1, 1, 1],
      [0, 0, 0, 0, 2, 0, 0, 1, 5, 5, 5, 1, 0, 0, 2, 0, 0, 0, 0],
      [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
      [9, 9, 9, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 9, 9, 9],
      [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
      [1, 3, 2, 1, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 1, 2, 3, 1],
      [1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1],
      [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
      [1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
  },
  {
    id: 'emerald',
    ghostSpeed: 1.65,
    pacmanSpeed: 2.1,
    frightenedDuration: 7.5,
    ghostReleases: [0, 1.8, 4.5, 7.5],
    fruit: { icon: '🍓', points: 300 },
    feature: { icon: '🌀🌀' },
    tunnels: [{ row: 10, leftCol: 0, rightCol: 18 }, { row: 4, leftCol: 0, rightCol: 18 }],
    portals: [],
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 3, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 3, 1],
      [1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1],
      [1, 2, 1, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1, 1, 2, 1],
      [0, 2, 2, 2, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 2, 2, 2, 0],
      [1, 2, 1, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1, 2, 1, 1, 2, 1],
      [1, 2, 2, 2, 2, 1, 2, 1, 1, 0, 1, 1, 2, 1, 2, 2, 2, 2, 1],
      [1, 1, 1, 1, 2, 1, 2, 1, 0, 0, 0, 1, 2, 1, 2, 1, 1, 1, 1],
      [9, 9, 9, 1, 2, 2, 0, 0, 0, 0, 0, 0, 0, 2, 2, 1, 9, 9, 9],
      [1, 1, 1, 1, 2, 1, 0, 1, 1, 4, 1, 1, 0, 1, 2, 1, 1, 1, 1],
      [0, 0, 0, 0, 2, 0, 0, 1, 5, 5, 5, 1, 0, 0, 2, 0, 0, 0, 0],
      [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
      [9, 9, 9, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 9, 9, 9],
      [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
      [1, 3, 2, 1, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 1, 2, 3, 1],
      [1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1],
      [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
      [1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
  },
  {
    id: 'crimson',
    ghostSpeed: 1.95,
    pacmanSpeed: 2.2,
    frightenedDuration: 6,
    ghostReleases: [0, 1.2, 3.2, 5.5],
    fruit: { icon: '🍊', points: 500 },
    feature: { icon: '🌌' },
    tunnels: [{ row: 10, leftCol: 0, rightCol: 18 }],
    portals: [{ r1: 1, c1: 1, r2: 19, c2: 17 }, { r1: 1, c1: 17, r2: 19, c2: 1 }],
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 6, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 6, 1],
      [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
      [1, 2, 1, 1, 2, 1, 3, 1, 2, 1, 2, 1, 3, 1, 2, 1, 1, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1],
      [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
      [1, 1, 1, 1, 2, 1, 1, 1, 0, 0, 0, 1, 1, 1, 2, 1, 1, 1, 1],
      [9, 9, 9, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 9, 9, 9],
      [1, 1, 1, 1, 2, 1, 0, 1, 1, 4, 1, 1, 0, 1, 2, 1, 1, 1, 1],
      [0, 0, 0, 0, 2, 0, 0, 1, 5, 5, 5, 1, 0, 0, 2, 0, 0, 0, 0],
      [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
      [9, 9, 9, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 9, 9, 9],
      [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
      [1, 2, 2, 1, 2, 2, 3, 2, 2, 0, 2, 2, 3, 2, 2, 1, 2, 2, 1],
      [1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1],
      [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
      [1, 6, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 6, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
  },
  {
    id: 'golden',
    ghostSpeed: 2.2,
    pacmanSpeed: 2.3,
    frightenedDuration: 5,
    ghostReleases: [0, 0.8, 2.2, 4],
    fruit: { icon: '🍎', points: 700 },
    feature: { icon: '🏰' },
    tunnels: [{ row: 6, leftCol: 0, rightCol: 18 }, { row: 14, leftCol: 0, rightCol: 18 }],
    portals: [],
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 3, 2, 2, 2, 2, 2, 1, 2, 1, 2, 1, 2, 2, 2, 2, 2, 3, 1],
      [1, 2, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 2, 1],
      [1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 1],
      [1, 2, 1, 2, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 2, 1, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 1, 2, 1, 2, 1, 2, 2, 2, 2, 2, 2, 1],
      [0, 2, 1, 1, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 1, 1, 2, 0],
      [1, 2, 1, 1, 2, 1, 1, 1, 0, 0, 0, 1, 1, 1, 2, 1, 1, 2, 1],
      [9, 9, 9, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 9, 9, 9],
      [1, 1, 1, 1, 2, 1, 0, 1, 1, 4, 1, 1, 0, 1, 2, 1, 1, 1, 1],
      [1, 1, 1, 1, 2, 0, 0, 1, 5, 5, 5, 1, 0, 0, 2, 1, 1, 1, 1],
      [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
      [9, 9, 9, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 9, 9, 9],
      [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
      [0, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 0],
      [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
      [1, 3, 2, 1, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 1, 2, 3, 1],
      [1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1],
      [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
      [1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
  },
  {
    id: 'quantum',
    ghostSpeed: 2.5,
    pacmanSpeed: 2.4,
    frightenedDuration: 4,
    ghostReleases: [0, 0.5, 1.5, 2.5],
    fruit: { icon: '🔑', points: 1000 },
    feature: { icon: '⚡' },
    tunnels: [{ row: 10, leftCol: 0, rightCol: 18 }],
    portals: [{ r1: 1, c1: 1, r2: 19, c2: 17 }, { r1: 1, c1: 17, r2: 19, c2: 1 }],
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 6, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 6, 1],
      [1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 1, 2, 1],
      [1, 2, 1, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 1, 2, 1],
      [1, 2, 2, 2, 2, 1, 2, 1, 1, 3, 1, 1, 2, 1, 2, 2, 2, 2, 1],
      [1, 2, 1, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1, 2, 1, 1, 2, 1],
      [1, 2, 2, 2, 2, 1, 2, 1, 1, 0, 1, 1, 2, 1, 2, 2, 2, 2, 1],
      [1, 1, 1, 1, 2, 1, 2, 1, 0, 0, 0, 1, 2, 1, 2, 1, 1, 1, 1],
      [9, 9, 9, 1, 2, 2, 0, 0, 0, 0, 0, 0, 0, 2, 2, 1, 9, 9, 9],
      [1, 1, 1, 1, 2, 1, 0, 1, 1, 4, 1, 1, 0, 1, 2, 1, 1, 1, 1],
      [0, 0, 0, 0, 2, 0, 0, 1, 5, 5, 5, 1, 0, 0, 2, 0, 0, 0, 0],
      [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
      [9, 9, 9, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 9, 9, 9],
      [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
      [1, 3, 2, 1, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 1, 2, 3, 1],
      [1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1],
      [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
      [1, 6, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 6, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
  }
];

export const PHASE_COUNT = PHASES.length;

/** Which stage layout a given level number uses (levels repeat every PHASE_COUNT in Endless). */
export function phaseForLevel(level) {
  return PHASES[(level - 1) % PHASE_COUNT];
}

/** How many full cycles of the five stages have been completed before this level. */
export function loopForLevel(level) {
  return Math.floor((level - 1) / PHASE_COUNT);
}

/**
 * Speeds and timers for a level. In Endless the stages repeat with ghosts that get
 * gradually faster (capped, so the game stays playable), shorter power-ups and
 * faster ghost-house releases.
 */
export function levelParams(level, difficulty = DIFFICULTIES.normal) {
  const phase = phaseForLevel(level);
  const loop = loopForLevel(level);
  const ghostRamp = Math.min(1.2, 1 + loop * 0.05);
  const frightRamp = Math.max(0.4, 1 - loop * 0.12);
  return {
    pacmanSpeed: phase.pacmanSpeed,
    ghostSpeed: round2(phase.ghostSpeed * difficulty.ghostSpeed * ghostRamp),
    frightenedDuration: Math.max(1.5, round2(phase.frightenedDuration * difficulty.fright * frightRamp)),
    ghostReleases: phase.ghostReleases.map((t) => round2((t * difficulty.release) / ghostRamp)),
    fruitPoints: phase.fruit.points * (1 + loop),
    loop
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/** Where a portal at (col,row) leads, or null if that tile is not a portal endpoint. */
export function portalDestination(portals, col, row) {
  for (const p of portals) {
    if (p.c1 === col && p.r1 === row) return { col: p.c2, row: p.r2 };
    if (p.c2 === col && p.r2 === row) return { col: p.c1, row: p.r1 };
  }
  return null;
}

export function countPellets(map) {
  let n = 0;
  for (const row of map) for (const t of row) if (t === TILE.PELLET || t === TILE.POWER) n++;
  return n;
}

export function cloneMap(map) {
  return map.map((row) => row.slice());
}

/**
 * Tile Pac-Man can stand on. Off the board is walkable only as the straight continuation of a
 * tunnel (the board edge on that row/column is open); otherwise turning while half outside a
 * tunnel would let Pac-Man wander off-screen and vanish.
 */
export function isPacmanWalkable(map, col, row) {
  const offX = col < 0 || col >= COLS;
  const offY = row < 0 || row >= ROWS;
  if (offX && offY) return false;
  if (offX) return isPacmanWalkable(map, col < 0 ? 0 : COLS - 1, row);
  if (offY) return isPacmanWalkable(map, col, row < 0 ? 0 : ROWS - 1);
  const t = map[row][col];
  return t !== TILE.WALL && t !== TILE.VOID && t !== TILE.DOOR && t !== TILE.HOUSE;
}
