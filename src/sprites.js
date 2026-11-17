/**
 * Canvas drawing helpers shared by the game board, the cutscenes, the menu
 * and the tutorial. Everything is scaled from the radius so the same code
 * renders a 9px in-game sprite and a 40px tutorial card.
 * Colors come from the active theme's skin (see setSkin and themes.js).
 */

import { THEMES, DEFAULT_THEME, CHARACTERS, DEFAULT_CHARACTER } from './themes.js';

const TAU = Math.PI * 2;
const REF_RADIUS = 8.8; // TILE_SIZE * 0.44, the radius the proportions were designed for

let skin = THEMES[DEFAULT_THEME].skin;
let character = CHARACTERS[DEFAULT_CHARACTER];

export function setSkin(next) {
  skin = next;
}

export function getSkin() {
  return skin;
}

export function setCharacter(id) {
  character = CHARACTERS[id] || CHARACTERS[DEFAULT_CHARACTER];
}

/** Pac-Man's body color: the character's own color, or the theme's. */
export function pacmanColor(char = character) {
  return char.color || skin.pacman;
}

/**
 * Pac-Man sprite. `as` draws a specific character (menu previews) instead of the selected one.
 * Ms. Pac-Man's bow is drawn upright whatever the direction, like in the arcade.
 */
export function drawPacman(ctx, x, y, r, { angle = 0, mouth = 0.2, glow = false, as = null } = {}) {
  const char = (as && CHARACTERS[as]) || character;
  ctx.save();
  ctx.translate(x, y);
  // Facing left is mirrored rather than rotated, so the eye (and bow) stay on top
  if (Math.abs(Math.cos(angle) + 1) < 1e-6) ctx.scale(-1, 1);
  else ctx.rotate(angle);
  ctx.fillStyle = pacmanColor(char);
  if (glow && skin.glow) {
    ctx.shadowColor = 'rgba(250, 204, 21, 0.9)';
    ctx.shadowBlur = 14;
  }
  ctx.beginPath();
  ctx.arc(0, 0, r, mouth * Math.PI, (2 - mouth) * Math.PI);
  ctx.lineTo(0, 0);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(r * 0.15, -r * 0.55, Math.max(1.4, r * 0.18), 0, TAU);
  ctx.fill();
  ctx.restore();
  if (char.bow) drawBow(ctx, x, y, r, Math.abs(Math.cos(angle) + 1) < 1e-6 ? 1 : -1);
}

/** Ms. Pac-Man's bow on the back of the head (side: 1 = facing left, -1 = otherwise). */
function drawBow(ctx, x, y, r, side) {
  const bx = x + side * r * 0.35;
  const by = y - r * 0.82;
  const s = r * 0.42;
  ctx.save();
  ctx.fillStyle = '#ff2a4f';
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx - s, by - s * 0.7);
  ctx.lineTo(bx - s, by + s * 0.7);
  ctx.closePath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + s, by - s * 0.7);
  ctx.lineTo(bx + s, by + s * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd1dc';
  ctx.beginPath();
  ctx.arc(bx, by, Math.max(1, s * 0.32), 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** progress 0..1: the mouth opens until Pac-Man vanishes. */
export function drawPacmanDying(ctx, x, y, r, progress) {
  const a = Math.min(Math.PI, progress * Math.PI);
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = pacmanColor();
  ctx.beginPath();
  ctx.arc(0, 0, r, a - Math.PI / 2, TAU - a - Math.PI / 2);
  ctx.lineTo(0, 0);
  ctx.fill();
  ctx.restore();
}

export function drawGhostEyes(ctx, r, dx = 0, dy = 0) {
  const s = r / REF_RADIUS;
  const ox = dx * 2.5 * s;
  const oy = dy * 2.5 * s;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(-r * 0.35 + ox * 0.5, -r * 0.2 + oy * 0.5, 3.5 * s, 4.5 * s, 0, 0, TAU);
  ctx.ellipse(r * 0.35 + ox * 0.5, -r * 0.2 + oy * 0.5, 3.5 * s, 4.5 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = skin.pupil;
  ctx.beginPath();
  ctx.arc(-r * 0.35 + ox, -r * 0.2 + oy, 2 * s, 0, TAU);
  ctx.arc(r * 0.35 + ox, -r * 0.2 + oy, 2 * s, 0, TAU);
  ctx.fill();
}

/**
 * state: 'normal' | 'scared' | 'eaten'. When scared and `flash` is true the body is white
 * (the "about to recover" warning, which also differs in shape-independent brightness).
 */
export function drawGhost(ctx, x, y, r, { color, state = 'normal', flash = false, dx = 0, dy = 0, wave = 0 } = {}) {
  ctx.save();
  ctx.translate(x, y);
  const s = r / REF_RADIUS;

  if (state === 'eaten') {
    drawGhostEyes(ctx, r, dx, dy);
    ctx.restore();
    return;
  }

  const scared = state === 'scared';
  const body = scared ? (flash ? skin.flash : skin.scared) : color;
  const w = Math.sin(wave) * 2 * s;

  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, -r * 0.1, r, Math.PI, 0, false);
  ctx.lineTo(r, r * 0.9);
  ctx.lineTo(r * 0.66, r * 0.6 + w);
  ctx.lineTo(r * 0.33, r * 0.9);
  ctx.lineTo(0, r * 0.6 - w);
  ctx.lineTo(-r * 0.33, r * 0.9);
  ctx.lineTo(-r * 0.66, r * 0.6 + w);
  ctx.lineTo(-r, r * 0.9);
  ctx.closePath();
  ctx.fill();

  if (scared) {
    const face = flash ? skin.flashFace : skin.scaredFace;
    ctx.fillStyle = face;
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.2, 2 * s, 0, TAU);
    ctx.arc(r * 0.35, -r * 0.2, 2 * s, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = face;
    ctx.lineWidth = 1.4 * s;
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, r * 0.3);
    ctx.lineTo(-r * 0.2, r * 0.15);
    ctx.lineTo(0, r * 0.3);
    ctx.lineTo(r * 0.2, r * 0.15);
    ctx.lineTo(r * 0.45, r * 0.3);
    ctx.stroke();
  } else {
    drawGhostEyes(ctx, r, dx, dy);
  }
  ctx.restore();
}

/** Adds one pellet to the current path (lets the board batch hundreds of pellets in a single fill). */
export function pelletPath(ctx, x, y, r, shape = skin.pelletShape) {
  if (shape === 'square') {
    ctx.rect(x - r, y - r, r * 2, r * 2);
  } else {
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, TAU);
  }
}

export function drawPowerPellet(ctx, x, y, r) {
  ctx.fillStyle = skin.power;
  ctx.beginPath();
  pelletPath(ctx, x, y, r, skin.powerShape || 'round');
  ctx.fill();
  if (skin.powerRing) {
    ctx.strokeStyle = skin.powerRing;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}

export function drawPellet(ctx, x, y, r = skin.pelletSize) {
  ctx.fillStyle = skin.pellet;
  ctx.beginPath();
  pelletPath(ctx, x, y, r);
  ctx.fill();
}

export function drawPortal(ctx, cx, cy, now) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(now * 0.005);
  ctx.strokeStyle = skin.portalRing || '#00f0ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 7.5, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = skin.portalCore || '#ff00aa';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(3, 0);
    ctx.lineTo(8, 0);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawEmoji(ctx, icon, x, y, size) {
  ctx.save();
  ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, x, y);
  ctx.restore();
}
