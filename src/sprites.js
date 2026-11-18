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

/**
 * Bonus fruit, drawn with shapes instead of emoji so it looks the same on every device and fits the
 * game's style. `size` is the overall height in canvas units.
 */
export const FRUIT_KINDS = ['cherry', 'strawberry', 'orange', 'apple', 'key'];

export function drawFruit(ctx, kind, x, y, size) {
  const s = size / 24; // shapes are designed on a 24-unit grid centered on (0,0)
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const shine = (cx, cy, r) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  };
  const leaf = (cx, cy, angle, len = 6) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.fillStyle = '#3ecf5a';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len / 2, -len / 2.4, len, 0);
    ctx.quadraticCurveTo(len / 2, len / 2.4, 0, 0);
    ctx.fill();
    ctx.restore();
  };

  switch (kind) {
    case 'cherry': {
      ctx.strokeStyle = '#3ecf5a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-5, 4);
      ctx.quadraticCurveTo(-2, -6, 5, -10);
      ctx.moveTo(5, 5);
      ctx.quadraticCurveTo(5, -4, 5, -10);
      ctx.stroke();
      leaf(5, -10, -2.6, 6);
      for (const [cx, cy] of [[-5, 6], [5, 7]]) {
        ctx.fillStyle = '#e3263b';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
        shine(cx - 1.8, cy - 1.8, 1.3);
      }
      break;
    }
    case 'strawberry': {
      ctx.fillStyle = '#e8304a';
      ctx.beginPath();
      ctx.moveTo(0, 11);
      ctx.bezierCurveTo(-9, 4, -10, -6, -4, -6);
      ctx.quadraticCurveTo(0, -7.5, 4, -6);
      ctx.bezierCurveTo(10, -6, 9, 4, 0, 11);
      ctx.fill();
      ctx.fillStyle = '#ffe680';
      for (const [sx, sy] of [[-4, -1], [0, -2], [4, -1], [-2, 3], [2, 3], [0, 7]]) ctx.fillRect(sx - 0.6, sy - 0.6, 1.2, 1.2);
      for (const a of [-2.4, -1.57, -0.7]) leaf(0, -6.5, a, 6);
      break;
    }
    case 'orange': {
      ctx.fillStyle = '#ff9f1a';
      ctx.beginPath();
      ctx.arc(0, 2, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      for (const [dx, dy] of [[3, 5], [-4, 4], [1, -1], [5, 0]]) ctx.fillRect(dx, dy, 1, 1);
      shine(-3.5, -1.5, 2);
      ctx.strokeStyle = '#7a4a1a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(0, -9.5);
      ctx.stroke();
      leaf(0, -9, -0.5, 6.5);
      break;
    }
    case 'apple': {
      ctx.fillStyle = '#d7263d';
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.bezierCurveTo(5, -9, 11, -4, 9, 3);
      ctx.bezierCurveTo(7.5, 9, 3, 11, 0, 9);
      ctx.bezierCurveTo(-3, 11, -7.5, 9, -9, 3);
      ctx.bezierCurveTo(-11, -4, -5, -9, 0, -5);
      ctx.fill();
      shine(-4, -1, 1.8);
      ctx.strokeStyle = '#7a4a1a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.quadraticCurveTo(0.5, -8.5, 2, -10.5);
      ctx.stroke();
      leaf(1.5, -8.5, -0.4, 6);
      break;
    }
    case 'key': {
      ctx.strokeStyle = '#ffd23f';
      ctx.fillStyle = '#ffd23f';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(0, -5.5, 4.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillRect(-1.3, -1, 2.6, 12);
      ctx.fillRect(1.3, 5, 4, 2.2);
      ctx.fillRect(1.3, 8.8, 3, 2.2);
      break;
    }
    default:
  }
  ctx.restore();
}

/** Paints one fruit into a small <canvas> element (HUD chip, briefing card), sharp on any screen. */
export function paintFruit(canvas, kind, cssSize) {
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  canvas.width = Math.round(cssSize * dpr);
  canvas.height = Math.round(cssSize * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssSize, cssSize);
  drawFruit(ctx, kind, cssSize / 2, cssSize / 2, cssSize * 0.92);
}

/** Small gold crown (the cutscene's victory lap). */
export function drawCrown(ctx, x, y, size) {
  const s = size / 24;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#ffd23f';
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 1.2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-10, 7);
  ctx.lineTo(-11, -5);
  ctx.lineTo(-5, 0);
  ctx.lineTo(0, -9);
  ctx.lineTo(5, 0);
  ctx.lineTo(11, -5);
  ctx.lineTo(10, 7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ff4d6d';
  ctx.beginPath();
  ctx.arc(0, 2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
