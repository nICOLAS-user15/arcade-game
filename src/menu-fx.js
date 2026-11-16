/**
 * Animated visuals for the main menu: a themed background behind the card
 * (faint scrolling maze, pixel starfield, candy bubbles or a dot matrix) and a small
 * "attract mode" lane where Pac-Man and the ghosts take turns chasing each other.
 * With "reduce motion" on, the menu switches to a calm mode (no drifting, scrolling
 * or pointer parallax) instead of freezing completely, so it never looks broken.
 * Drawing is skipped while the page is hidden.
 */

import { drawPacman, drawGhost, drawPowerPellet, drawPellet } from './sprites.js';
import { GHOST_DEFS, PHASES, TILE, COLS, ROWS } from './config.js';

const MAZE_TILE = 18;

/** One copy of the first stage's maze as thin outlines, used as a repeating background pattern. */
function buildMazeTile(color, dotColor) {
  const T = MAZE_TILE;
  const map = PHASES[0].map;
  const c = document.createElement('canvas');
  c.width = COLS * T;
  c.height = ROWS * T;
  const g = c.getContext('2d');
  const wall = (x, y) => x >= 0 && x < COLS && y >= 0 && y < ROWS && (map[y][x] === TILE.WALL || map[y][x] === TILE.VOID);
  const slabs = (inset) => {
    g.beginPath();
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (!wall(x, y)) continue;
        const x0 = x * T + (wall(x - 1, y) ? 0 : inset);
        const x1 = (x + 1) * T - (wall(x + 1, y) ? 0 : inset);
        const y0 = y * T + (wall(x, y - 1) ? 0 : inset);
        const y1 = (y + 1) * T - (wall(x, y + 1) ? 0 : inset);
        g.rect(x0, y0, x1 - x0, y1 - y0);
      }
    }
    g.fill();
  };
  g.fillStyle = color;
  slabs(4);
  g.globalCompositeOperation = 'destination-out';
  slabs(5.5);
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = dotColor;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (map[y][x] === TILE.PELLET) g.fillRect(x * T + T / 2 - 1, y * T + T / 2 - 1, 2, 2);
    }
  }
  return c;
}

/** Floating dots and grid lines that react slightly to the pointer. */
export class Starfield {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.pointer = { x: 0.5, y: 0.5 };
    this.w = 0;
    this.h = 0;
    this.resize();
  }

  resize() {
    const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    this.w = this.canvas.clientWidth || 1;
    this.h = this.canvas.clientHeight || 1;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(110, (this.w * this.h) / 9000));
    this.stars = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: 0.2 + Math.random() * 0.8,
      tw: Math.random() * Math.PI * 2
    }));
  }

  setPointer(nx, ny) {
    this.pointer.x = nx;
    this.pointer.y = ny;
  }

  /** calm: only a gentle twinkle, no drift, scrolling or parallax (for "reduce motion"). look: theme.menu */
  draw(time, calm = false, look = { grid: 'rgba(33, 70, 255, 0.18)', star: '190, 210, 255', square: false }) {
    const { ctx, w, h } = this;
    const animate = !calm;
    ctx.clearRect(0, 0, w, h);
    if (look.style === 'bubbles') {
      this.drawBubbles(time, animate, look);
      return;
    }
    if (look.style === 'maze') {
      this.drawMaze(time, animate, look);
      return;
    }
    if (look.style === 'dots') {
      this.drawDots(time, animate, look);
      return;
    }

    // Perspective grid floor
    ctx.strokeStyle = look.grid;
    ctx.lineWidth = 1;
    const horizon = h * 0.62;
    const shift = animate ? (time * 0.02) % 1 : 0;
    for (let i = 0; i < 9; i++) {
      const p = (i + shift) / 9;
      const y = horizon + (h - horizon) * p * p;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let i = -8; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(w / 2 + i * 14, horizon);
      ctx.lineTo(w / 2 + i * (w / 7), h);
      ctx.stroke();
    }

    for (const s of this.stars) {
      const drift = animate ? time * 0.00002 * s.z : 0;
      const px = animate ? (this.pointer.x - 0.5) * 0.02 * s.z : 0;
      const x = (((s.x - drift + px) % 1) + 1) % 1;
      const y = s.y * horizon + (animate ? (this.pointer.y - 0.5) * 6 * s.z : 0);
      const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(time * (calm ? 0.0009 : 0.002) + s.tw)) * s.z;
      ctx.fillStyle = `rgba(${look.star}, ${a.toFixed(3)})`;
      const size = 0.6 + s.z * 1.2;
      if (look.square) {
        ctx.fillRect(Math.round(x * w - size), Math.round(y - size), Math.ceil(size * 2), Math.ceil(size * 2));
      } else {
        ctx.beginPath();
        ctx.arc(x * w, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /** Classic theme: the arcade maze, very faint, scrolling slowly and fading toward the card. */
  drawMaze(time, animate, look) {
    const { ctx, w, h } = this;
    if (!this.mazePattern || this.mazeColor !== look.maze) {
      this.mazeColor = look.maze;
      this.mazePattern = ctx.createPattern(buildMazeTile(look.maze, look.dots), 'repeat');
    }
    const off = animate ? (time * 0.008) % (ROWS * MAZE_TILE) : 0;
    ctx.save();
    ctx.translate(-w * 0.03, -off);
    ctx.fillStyle = this.mazePattern;
    ctx.fillRect(w * 0.03, off, w, h);
    ctx.restore();

    // Keep the middle (behind the menu card) quieter than the edges
    const mask = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.65);
    mask.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
    mask.addColorStop(1, 'rgba(0, 0, 0, 1)');
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  /** Minimal theme: a static dot matrix with a slow diagonal band of light passing through. */
  drawDots(time, animate, look) {
    const { ctx, w, h } = this;
    const gap = 22;
    const band = animate ? ((time * 0.00006) % 1.6) - 0.3 : -1;
    for (let y = gap / 2; y < h; y += gap) {
      for (let x = gap / 2; x < w; x += gap) {
        const d = (x / w + y / h) / 2;
        const lift = Math.max(0, 1 - Math.abs(d - band) * 9);
        ctx.fillStyle = `rgba(${look.star}, ${(0.1 + lift * 0.4).toFixed(3)})`;
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    }
  }

  /** Pastel theme: big soft candy-colored bubbles rising slowly, plus a few sparkles. */
  drawBubbles(time, animate, look) {
    const { ctx, w, h } = this;
    const count = Math.min(14, this.stars.length);
    for (let i = 0; i < count; i++) {
      const s = this.stars[i];
      const r = (0.08 + s.z * 0.14) * Math.min(w, h) + 30;
      const rise = animate ? (time * 0.000012 * (0.4 + s.z)) % 1 : 0;
      const y = ((((s.y - rise) % 1) + 1) % 1) * (h + 2 * r) - r;
      const x = s.x * w + (animate ? Math.sin(time * 0.0004 + s.tw) * 24 : 0);
      const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      const color = look.colors[i % look.colors.length];
      g.addColorStop(0, `${color}${look.alpha || 'cc'}`);
      g.addColorStop(1, `${color}00`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = count; i < this.stars.length; i++) {
      const s = this.stars[i];
      const a = 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(time * 0.002 + s.tw));
      const x = s.x * w;
      const y = s.y * h;
      const size = 1 + s.z * 2.2;
      ctx.fillStyle = `rgba(${look.star}, ${a.toFixed(3)})`;
      ctx.beginPath(); // four-point sparkle
      ctx.moveTo(x, y - size * 2);
      ctx.lineTo(x + size * 0.5, y - size * 0.5);
      ctx.lineTo(x + size * 2, y);
      ctx.lineTo(x + size * 0.5, y + size * 0.5);
      ctx.lineTo(x, y + size * 2);
      ctx.lineTo(x - size * 0.5, y + size * 0.5);
      ctx.lineTo(x - size * 2, y);
      ctx.lineTo(x - size * 0.5, y - size * 0.5);
      ctx.closePath();
      ctx.fill();
    }
  }
}

/**
 * Looping chase scene on a small canvas. Phase A: ghosts chase Pac-Man across the lane until he
 * eats the power pellet. Phase B: Pac-Man chases the (now blue) ghosts back.
 */
export class AttractLane {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.w = canvas.width;
    this.h = canvas.height;
    this.cycle = 9; // seconds
  }

  draw(time, theme) {
    const { ctx, w, h } = this;
    const color = (g) => theme?.ghosts[g.name] || g.color;
    ctx.clearRect(0, 0, w, h);
    const t = (time / 1000) % this.cycle;
    const y = h / 2;
    const r = 13;
    const pelletX = w * 0.62;
    const half = this.cycle / 2;

    // Pellets along the lane
    for (let x = 24; x < w; x += 24) {
      if (x === Math.round(pelletX / 24) * 24) continue;
      drawPellet(ctx, x, y, 2.4);
    }
    const powerEaten = t > half * 0.62 && t < half * 2;
    const pulse = 1.5 * Math.sin(time * 0.008);
    if (!powerEaten) drawPowerPellet(ctx, pelletX, y, 6 + pulse);

    const mouth = 0.12 + 0.16 * Math.abs(Math.sin(time * 0.014));
    const wave = time * 0.012;

    if (t < half) {
      // Phase A: Pac-Man runs right and the ghosts follow
      const p = t / half;
      const pacX = -20 + p * (w + 60);
      const scared = pacX > pelletX;
      const dir = 1;
      if (!scared) {
        GHOST_DEFS.forEach((g, i) => {
          drawGhost(ctx, pacX - 44 - i * 30, y, 12, { color: color(g), dx: dir, wave: wave + i });
        });
      } else {
        // After the pellet the ghosts turn around and flee left
        const q = (pacX - pelletX) / (w + 60 - pelletX);
        GHOST_DEFS.forEach((g, i) => {
          const gx = pelletX - 44 - i * 30 - q * (pelletX + 100);
          drawGhost(ctx, gx, y, 12, { color: color(g), state: 'scared', flash: q > 0.8 && Math.floor(t * 8) % 2 === 0, dx: -1, wave: wave + i });
        });
      }
      drawPacman(ctx, pacX, y, r, { angle: 0, mouth, glow: scared });
    } else {
      // Phase B: Pac-Man chases the frightened ghosts back to the left
      const p = (t - half) / half;
      const pacX = w + 30 - p * (w + 80);
      GHOST_DEFS.forEach((g, i) => {
        const gx = pacX - 44 - i * 30;
        drawGhost(ctx, gx, y, 12, { color: color(g), state: 'scared', flash: p > 0.75 && Math.floor(t * 8) % 2 === 0, dx: -1, wave: wave + i });
      });
      drawPacman(ctx, pacX, y, r, { angle: Math.PI, mouth, glow: true });
    }
  }
}
