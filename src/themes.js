/**
 * Visual themes. A theme restyles the maze (how walls are drawn plus one look per stage),
 * the sprites, the menu background, the cutscenes and, through html[data-theme], the CSS interface.
 * Colorful themes keep each stage's hue (blue, green, red, gold, violet) so the stage names fit;
 * the monochrome Minimal theme changes the wall texture per stage instead.
 * DOM-free so it can be unit-tested in Node.
 */

export const DEFAULT_THEME = 'classic';
export const THEME_IDS = ['classic', 'retro', 'pastel', 'minimal'];

// Canvas text (banners, score pop-ups, cutscene titles) uses each theme's display font.
// `scale` evens out how wide each font is compared with Press Start 2P.
const ARCADE_FONT = { family: '"Press Start 2P", monospace', weight: '', scale: 1 };
const PIXEL_FONT = { family: '"Silkscreen", monospace', weight: '', scale: 1.3 };
const ROUND_FONT = { family: '"Fredoka", "Nunito", sans-serif', weight: '700 ', scale: 1.4 };
const MONO_FONT = { family: '"Space Mono", ui-monospace, Consolas, monospace', weight: '700 ', scale: 1.25 };

export const THEMES = Object.freeze({
  classic: {
    id: 'classic',
    chrome: '#000000',
    walls: { style: 'outline', inset: 3.5, width: 2.5, radius: 6 },
    pixel: 1,
    font: ARCADE_FONT,
    banner: '#ffff00',
    skin: {
      pacman: '#ffff00', glow: true, pellet: '#ffb8ae', pelletShape: 'square', pelletSize: 2.2,
      power: '#ffb8ae', powerRing: null, scared: '#2121ff', scaredFace: '#ffb8ae',
      flash: '#ffffff', flashFace: '#ff0000', pupil: '#2121ff', door: '#ffb8ff'
    },
    ghosts: { Blinky: '#ff0000', Pinky: '#ffb8ff', Inky: '#00ffff', Clyde: '#ffb852' },
    menu: { style: 'maze', maze: 'rgba(52, 52, 255, 0.34)', dots: 'rgba(255, 184, 174, 0.22)', star: '255, 255, 255' },
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
    menu: { style: 'stars', grid: 'rgba(32, 56, 236, 0.32)', star: '252, 252, 252', square: true },
    cutscene: { bg: '#000000', floor: '#2038ec', title: '#f8d800', accent: '#3cbcfc' },
    stages: [
      { wall: '#2038ec', bg: '#000000' },
      { wall: '#00a844', bg: '#000000' },
      { wall: '#d82800', bg: '#000000' },
      { wall: '#c88400', bg: '#000000' },
      { wall: '#6844fc', bg: '#000000' }
    ]
  },

  pastel: {
    id: 'pastel',
    chrome: '#171126',
    walls: { style: 'soft', inset: 2, radius: 8, core: 5.5 },
    pixel: 1,
    font: ROUND_FONT,
    banner: '#ffd76e',
    skin: {
      pacman: '#ffd76e', glow: false, pellet: '#fff1e6', pelletShape: 'round', pelletSize: 2.6,
      power: '#fff1e6', powerRing: '#ffb3c7', scared: '#7b8cff', scaredFace: '#ffffff',
      flash: '#ffffff', flashFace: '#ff6b8a', pupil: '#3a3a8c', door: '#ffb3e6',
      portalRing: '#9be7d8', portalCore: '#ff9ab0'
    },
    ghosts: { Blinky: '#ff6b81', Pinky: '#ffb3e6', Inky: '#7fe0ef', Clyde: '#ffc285' },
    menu: { style: 'bubbles', alpha: '55', colors: ['#ffb3c7', '#c3a6ff', '#9be7d8', '#ffd76e', '#8fb4ff'], star: '255, 255, 255' },
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
    chrome: '#000000',
    walls: { style: 'slab', inset: 2, radius: 0 },
    pixel: 1,
    font: MONO_FONT,
    banner: '#ffffff',
    skin: {
      pacman: '#ffffff', glow: false, pellet: '#ffffff', pelletShape: 'square', pelletSize: 1.6,
      power: '#ffffff', powerShape: 'square', powerRing: null, scared: '#4a4a4a', scaredFace: '#ffffff',
      flash: '#ffffff', flashFace: '#000000', pupil: '#000000', door: '#ffffff',
      portalRing: '#ffffff', portalCore: '#7a7a7a'
    },
    ghosts: { Blinky: '#e05a5a', Pinky: '#e39acb', Inky: '#6cc3cf', Clyde: '#e0a868' },
    menu: { style: 'dots', star: '255, 255, 255' },
    cutscene: { bg: '#000000', floor: '#ffffff', title: '#ffffff', accent: '#bdbdbd' },
    // Monochrome on purpose: each stage gets a different raw concrete-like wall texture
    stages: [
      { wall: '#ffffff', bg: '#000000', pattern: 'double' },
      { wall: '#ffffff', bg: '#000000', pattern: 'hatch' },
      { wall: '#ffffff', bg: '#000000', pattern: 'frame' },
      { wall: '#ffffff', bg: '#000000', pattern: 'groove' },
      { wall: '#ffffff', bg: '#000000', pattern: 'dots' }
    ]
  }
});

/**
 * Playable characters. They only change how Pac-Man looks, never the rules.
 * color null = the theme's own Pac-Man color; bow = Ms. Pac-Man's red bow.
 */
export const DEFAULT_CHARACTER = 'pac';
export const CHARACTER_IDS = ['pac', 'ms', 'cherry', 'mint'];
export const CHARACTERS = Object.freeze({
  pac: { id: 'pac', color: null, bow: false },
  ms: { id: 'ms', color: null, bow: true },
  cherry: { id: 'cherry', color: '#ff6fae', bow: false },
  mint: { id: 'mint', color: '#3ff0c0', bow: false }
});

export function getTheme(id) {
  return Object.prototype.hasOwnProperty.call(THEMES, id) ? THEMES[id] : THEMES[DEFAULT_THEME];
}

/** Colors of one stage in one theme, with the derived glow used by the HUD and the board border. */
export function stageLook(theme, stageIndex) {
  const s = theme.stages[stageIndex % theme.stages.length];
  return { ...s, glow: rgba(s.wall, 0.5) };
}

/** Canvas font string for a theme, sized so every font reads about as large. */
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
