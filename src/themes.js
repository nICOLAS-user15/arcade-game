/**
 * Visual themes. A theme restyles the maze (how walls are drawn plus one palette per stage),
 * the sprites, the menu background, the cutscenes and, through html[data-theme], the CSS interface.
 * Every theme keeps each stage's hue (blue, green, red, gold, violet) so the stage names fit them all.
 * DOM-free so it can be unit-tested in Node.
 */

export const DEFAULT_THEME = 'modern';
export const THEME_IDS = ['classic', 'retro', 'modern', 'pastel', 'minimal'];

const PIXEL_FONT = { family: '"Press Start 2P", monospace', weight: '', scale: 1 };

export const THEMES = Object.freeze({
  classic: {
    id: 'classic',
    chrome: '#000000',
    walls: { style: 'outline', inset: 3.5, width: 2.5, radius: 6 },
    pixel: 1,
    font: PIXEL_FONT,
    banner: '#ffff00',
    skin: {
      pacman: '#ffff00', glow: false, pellet: '#ffb8ae', pelletShape: 'square', pelletSize: 2.2,
      power: '#ffb8ae', powerRing: null, scared: '#2121ff', scaredFace: '#ffb8ae',
      flash: '#ffffff', flashFace: '#ff0000', pupil: '#2121ff', door: '#ffb8ff'
    },
    ghosts: { Blinky: '#ff0000', Pinky: '#ffb8ff', Inky: '#00ffff', Clyde: '#ffb852' },
    menu: { grid: 'rgba(33, 33, 222, 0.3)', star: '255, 255, 255', square: false },
    cutscene: { bg: '#000000', floor: '#2121de', title: '#ffff00', accent: '#00ffff' },
    stages: [
      { wall: '#2121de', bg: '#000000' },
      { wall: '#14b04c', bg: '#000000' },
      { wall: '#de2142', bg: '#000000' },
      { wall: '#e8901a', bg: '#000000' },
      { wall: '#9a3fe0', bg: '#000000' }
    ]
  },

  retro: {
    id: 'retro',
    chrome: '#0c0c14',
    walls: { style: 'block', inset: 1, radius: 0 },
    pixel: 2, // the board is drawn at half resolution and scaled up without smoothing
    font: PIXEL_FONT,
    banner: '#f8d800',
    skin: {
      pacman: '#f8d800', glow: false, pellet: '#fca044', pelletShape: 'square', pelletSize: 2.5,
      power: '#fca044', powerShape: 'square', powerRing: null, scared: '#2038ec', scaredFace: '#fcfcfc',
      flash: '#fcfcfc', flashFace: '#f83800', pupil: '#2038ec', door: '#f878f8',
      portalRing: '#3cbcfc', portalCore: '#f878f8'
    },
    ghosts: { Blinky: '#f83800', Pinky: '#f878f8', Inky: '#3cbcfc', Clyde: '#fca044' },
    menu: { grid: 'rgba(32, 56, 236, 0.32)', star: '252, 252, 252', square: true },
    cutscene: { bg: '#000000', floor: '#2038ec', title: '#f8d800', accent: '#3cbcfc' },
    stages: [
      { wall: '#2038ec', bg: '#000000' },
      { wall: '#00a844', bg: '#000000' },
      { wall: '#d82800', bg: '#000000' },
      { wall: '#c88400', bg: '#000000' },
      { wall: '#6844fc', bg: '#000000' }
    ]
  },

  modern: {
    id: 'modern',
    chrome: '#060811',
    walls: { style: 'neon', inset: 3, width: 2, radius: 5 },
    pixel: 1,
    font: PIXEL_FONT,
    banner: '#ffeb3b',
    skin: {
      pacman: '#ffe600', glow: true, pellet: '#ffdedb', pelletShape: 'round', pelletSize: 2.5,
      power: '#ffdedb', powerRing: '#ffffff', scared: '#1d4ed8', scaredFace: '#ffb8b8',
      flash: '#ffffff', flashFace: '#d90429', pupil: '#0022cc', door: '#ffb8ff'
    },
    ghosts: { Blinky: '#ff2a2a', Pinky: '#ffb8ff', Inky: '#22e6ff', Clyde: '#ffb852' },
    menu: { grid: 'rgba(33, 70, 255, 0.18)', star: '190, 210, 255', square: false },
    cutscene: { bg: '#060814', floor: '#2563eb', title: '#ffeb3b', accent: '#38bdf8' },
    stages: [
      { wall: '#2b5bff', bg: '#02030a', fill: '#090d24' },
      { wall: '#00ff88', bg: '#02120a', fill: '#062917' },
      { wall: '#ff007f', bg: '#14010a', fill: '#290416' },
      { wall: '#ffb703', bg: '#140c01', fill: '#2b1b04' },
      { wall: '#a855f7', bg: '#0c0217', fill: '#200738' }
    ]
  },

  pastel: {
    id: 'pastel',
    chrome: '#1b1530',
    walls: { style: 'soft', inset: 2, radius: 8, core: 5.5 },
    pixel: 1,
    font: PIXEL_FONT,
    banner: '#ffd76e',
    skin: {
      pacman: '#ffd76e', glow: false, pellet: '#fff1e6', pelletShape: 'round', pelletSize: 2.6,
      power: '#fff1e6', powerRing: '#ffb3c7', scared: '#7b8cff', scaredFace: '#ffffff',
      flash: '#ffffff', flashFace: '#ff6b8a', pupil: '#3a3a8c', door: '#ffb3e6',
      portalRing: '#9be7d8', portalCore: '#ff9ab0'
    },
    ghosts: { Blinky: '#ff6b81', Pinky: '#ffb3e6', Inky: '#7fe0ef', Clyde: '#ffc285' },
    menu: { grid: 'rgba(255, 154, 176, 0.16)', star: '255, 222, 235', square: false },
    cutscene: { bg: '#1b1530', floor: '#ff9ab0', title: '#ffd76e', accent: '#9be7d8' },
    stages: [
      { wall: '#8fb4ff', core: '#d3e2ff', bg: '#1a1a33' },
      { wall: '#82dcb6', core: '#d4f5e7', bg: '#14262a' },
      { wall: '#ff9aa8', core: '#ffd9de', bg: '#2a1a28' },
      { wall: '#ffc77d', core: '#ffecca', bg: '#2a2118' },
      { wall: '#c3a6ff', core: '#e8ddff', bg: '#211a35' }
    ]
  },

  minimal: {
    id: 'minimal',
    chrome: '#0d0e10',
    walls: { style: 'line', inset: 5, width: 1.25, radius: 4 },
    pixel: 1,
    font: { family: 'Rajdhani, system-ui, sans-serif', weight: '700 ', scale: 1.5 },
    banner: '#e9eaec',
    skin: {
      pacman: '#f2d57e', glow: false, pellet: '#9aa1aa', pelletShape: 'round', pelletSize: 1.8,
      power: '#e9eaec', powerRing: null, scared: '#5b6b8f', scaredFace: '#e9eaec',
      flash: '#e9eaec', flashFace: '#5b6b8f', pupil: '#2a2f38', door: '#6b7280',
      portalRing: '#a9bccd', portalCore: '#e9eaec'
    },
    ghosts: { Blinky: '#e07a7a', Pinky: '#e3a9cf', Inky: '#7cc4cf', Clyde: '#dcb07e' },
    menu: { grid: 'rgba(255, 255, 255, 0.05)', star: '214, 218, 224', square: false },
    cutscene: { bg: '#0d0e10', floor: '#3a3f47', title: '#e9eaec', accent: '#a9bccd' },
    stages: [
      { wall: '#8fa3b8', bg: '#0d0e10', fill: '#14171b' },
      { wall: '#93ab9b', bg: '#0d0e10', fill: '#141815' },
      { wall: '#b89393', bg: '#0d0e10', fill: '#191415' },
      { wall: '#b8a98a', bg: '#0d0e10', fill: '#181612' },
      { wall: '#a597b8', bg: '#0d0e10', fill: '#16141a' }
    ]
  }
});

export function getTheme(id) {
  return Object.hasOwn(THEMES, id) ? THEMES[id] : THEMES[DEFAULT_THEME];
}

/** Colors of one stage in one theme, with the derived glow used by the HUD and the board border. */
export function stageLook(theme, stageIndex) {
  const s = theme.stages[stageIndex % theme.stages.length];
  return { ...s, glow: rgba(s.wall, 0.5) };
}

/** Canvas font string for a theme (the minimal theme swaps the pixel font for a clean sans). */
export function canvasFont(theme, px) {
  const f = theme.font;
  return `${f.weight}${Math.round(px * f.scale)}px ${f.family}`;
}

export function rgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Lightens (amount > 0) or darkens (amount < 0) a #rrggbb color. */
export function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.round(amount >= 0 ? v + (255 - v) * amount : v * (1 + amount));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
