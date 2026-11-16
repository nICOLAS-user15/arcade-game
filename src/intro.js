/**
 * Opening animation, played once when the app starts:
 *
 *   1. Pac-Man chomps across the screen along a row of dots, chased by the four ghosts.
 *      Every letter of the logo pops into place right as he passes over it.
 *   2. He swallows a power pellet: the screen flashes, the ghosts turn blue and flee,
 *      and Pac-Man turns around to chase them.
 *   3. The big logo flies into its place in the menu card while the rest of the menu
 *      cascades in.
 *
 * The logo is a clone of the real one, so it automatically uses the theme's font, colors
 * and shadows, and lands pixel-perfect on top of it. Any key, click or tap skips ahead.
 * Skipped entirely with reduced motion.
 */

import { drawPacman, drawGhost, drawPellet, drawPowerPellet, getSkin } from './sprites.js';
import { GHOST_DEFS } from './config.js';

const ENTER_AT = 250; // ms before Pac-Man appears
const RUN_MS = 1500; // time to cross from the left edge to the power pellet
const CHASE_MS = 750; // ghosts fleeing before the logo flies to the menu
const FLY_MS = 650;
const GHOST_GAP = 2.6; // distance between characters, in Pac-Man radii
const DOT_GAP = 2.2;

export class Intro {
  constructor(app) {
    this.app = app;
    this.menu = document.getElementById('menu');
    this.done = false;
  }

  /** Runs the intro; resolves when the menu is fully shown. */
  play() {
    if (this.app.reduceMotion || !this.menu || this.menu.hidden) return Promise.resolve();
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.setup();
      this.start = performance.now();
      this.raf = requestAnimationFrame((t) => this.frame(t));
    });
  }

  setup() {
    const menu = this.menu;
    menu.classList.add('intro-active');
    this.realLogo = menu.querySelector('.logo');
    this.target = this.realLogo.getBoundingClientRect();

    // Overlay: the big logo clone plus a canvas for the characters
    const root = (this.root = document.createElement('div'));
    root.className = 'intro';
    root.setAttribute('aria-hidden', 'true');
    this.canvas = document.createElement('canvas');
    root.appendChild(this.canvas);

    const logo = (this.logo = this.realLogo.cloneNode(true));
    logo.removeAttribute('id');
    logo.classList.add('intro-logo');
    for (const part of logo.querySelectorAll('.logo-pac, .logo-man')) {
      const text = part.textContent;
      part.textContent = '';
      for (const ch of text) {
        const s = document.createElement('span');
        s.className = 'intro-ch';
        s.textContent = ch;
        part.appendChild(s);
      }
    }
    Object.assign(logo.style, {
      left: `${this.target.left}px`,
      top: `${this.target.top}px`,
      width: `${this.target.width}px`
    });
    root.appendChild(logo);
    document.body.appendChild(root);

    // Start big and centered: the same element shrinks back to the target later (FLIP)
    const vw = innerWidth;
    const vh = innerHeight;
    this.scale = Math.min(2.2, (vw * 0.84) / this.target.width, (vh * 0.3) / this.target.height);
    this.dx = vw / 2 - (this.target.left + this.target.width / 2);
    this.dy = vh * 0.44 - (this.target.top + this.target.height / 2);
    logo.style.transform = `translate(${this.dx}px, ${this.dy}px) scale(${this.scale})`;

    // Where the action happens: a lane through the middle of the big logo
    const box = logo.getBoundingClientRect();
    this.laneY = box.top + box.height * 0.5;
    this.r = Math.max(12, Math.min(26, box.height * 0.36));
    this.startX = -this.r * 2;
    this.pelletX = Math.min(vw - this.r * 1.6, box.right + this.r * 2.2);
    this.speed = (this.pelletX - this.startX) / RUN_MS; // px per ms
    this.letters = [...logo.querySelectorAll('.intro-ch')].map((el) => {
      const b = el.getBoundingClientRect();
      return { el, x: b.left + b.width / 2, on: false };
    });
    this.dots = [];
    for (let x = this.r * 1.2; x < this.pelletX - this.r * 1.5; x += this.r * DOT_GAP) this.dots.push({ x, eaten: false });
    this.particles = [];

    this.resize();
    this.onResize = () => this.resize();
    addEventListener('resize', this.onResize);
    // Any input skips ahead (capture, so it does not also press the focused menu button)
    this.onSkip = (e) => {
      if (e.type === 'keydown') {
        e.preventDefault();
        e.stopPropagation();
      }
      this.skip();
    };
    addEventListener('keydown', this.onSkip, true);
    root.addEventListener('pointerdown', this.onSkip);
  }

  resize() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    this.canvas.width = Math.round(innerWidth * dpr);
    this.canvas.height = Math.round(innerHeight * dpr);
    this.ctx = this.canvas.getContext('2d');
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Jumps straight to the final flight. */
  skip() {
    if (this.flying || this.done) return;
    this.fly(0.45);
  }

  frame(now) {
    if (this.done) return;
    this.raf = requestAnimationFrame((t) => this.frame(t));
    const t = now - this.start;
    const run = t - ENTER_AT;
    const powerAt = RUN_MS;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const skin = getSkin();
    const r = this.r;

    // Pac-Man position: right until the pellet, then back to the left chasing the ghosts
    let px;
    let dir = 0;
    if (run < powerAt) px = this.startX + Math.max(0, run) * this.speed;
    else {
      px = this.pelletX - (run - powerAt) * this.speed * 0.9;
      dir = Math.PI;
    }

    // Dots and the power pellet
    for (const d of this.dots) {
      if (!d.eaten && run < powerAt && px >= d.x) {
        d.eaten = true;
        this.app.sound.waka();
      }
      if (!d.eaten) drawPellet(ctx, d.x, this.laneY, Math.max(2, r * 0.16));
    }
    if (run < powerAt) {
      if (Math.floor(now / 160) % 2 === 0) drawPowerPellet(ctx, this.pelletX, this.laneY, r * 0.38);
    } else if (!this.powered) {
      this.powered = true;
      this.powerUp();
    }

    // Letters pop as he passes
    for (const l of this.letters) {
      if (!l.on && px >= l.x && run < powerAt) {
        l.on = true;
        l.el.classList.add('on');
        this.sparkle(l.x, this.laneY, skin.pacman);
      }
    }

    // Ghosts: chase from behind, then flee frightened (and faster than Pac-Man)
    GHOST_DEFS.forEach((g, i) => {
      const lag = (i + 1) * GHOST_GAP * r;
      let gx;
      let state = 'normal';
      let flash = false;
      let dx = 1;
      if (run < powerAt) gx = px - lag;
      else {
        const turnX = this.startX + powerAt * this.speed - lag;
        gx = turnX - (run - powerAt) * this.speed * 1.15;
        state = 'scared';
        flash = run - powerAt > CHASE_MS * 0.55 && Math.floor(now / 120) % 2 === 0;
        dx = -1;
      }
      if (gx > -r * 2) {
        const color = this.app.theme.ghosts?.[g.name] || g.color;
        drawGhost(ctx, gx, this.laneY, r * 0.95, { color, state, flash, dx, wave: now / 90 + i });
      }
    });

    if (px > -r * 2) {
      const mouth = 0.04 + Math.abs(Math.sin(now / 55)) * 0.24;
      drawPacman(ctx, px, this.laneY, r, { angle: dir, mouth, glow: skin.glow });
    }

    // Spark particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.life -= 0.035;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    }
    ctx.globalAlpha = 1;

    if (!this.flying && run >= powerAt + CHASE_MS) this.fly(1);
  }

  sparkle(x, y, color) {
    for (let i = 0; i < 7; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 1.2 + Math.random() * 2.4;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.5, life: 1, color });
    }
  }

  powerUp() {
    this.app.sound.power();
    this.root.classList.add('flash');
    this.logo.classList.add('charged');
    // Any letter not revealed yet (e.g. after a resize) shows now
    for (const l of this.letters) if (!l.on) l.el.classList.add('on');
    for (let i = 0; i < 4; i++) this.sparkle(this.pelletX, this.laneY, getSkin().power);
  }

  /** Logo flies to its place in the menu, the rest of the menu cascades in. */
  fly(speed) {
    this.flying = true;
    for (const l of this.letters) l.el.classList.add('on');
    const ms = FLY_MS * speed;
    // The menu may have moved (resize) since setup: aim at where the real logo is now
    const now = this.realLogo.getBoundingClientRect();
    const ox = now.left + now.width / 2 - (this.target.left + this.target.width / 2);
    const oy = now.top + now.height / 2 - (this.target.top + this.target.height / 2);
    // Menu items cascade in one after another
    this.menu.querySelectorAll('.menu-hero > *, .menu-options > *').forEach((el, i) => el.style.setProperty('--i', i));
    this.logo.style.transition = `transform ${ms}ms cubic-bezier(0.65, 0, 0.35, 1)`;
    this.logo.style.transform = `translate(${ox}px, ${oy}px) scale(${now.width / this.target.width})`;
    this.root.style.setProperty('--fly-ms', `${ms}ms`);
    this.root.classList.add('leaving');
    this.menu.classList.remove('intro-active');
    this.menu.classList.add('intro-reveal');
    this.realLogo.style.visibility = 'hidden';
    setTimeout(() => this.finish(), ms + 30);
  }

  finish() {
    if (this.done) return;
    this.done = true;
    cancelAnimationFrame(this.raf);
    removeEventListener('resize', this.onResize);
    removeEventListener('keydown', this.onSkip, true);
    this.realLogo.style.visibility = '';
    this.root.remove();
    // intro-reveal stays on: removing it would swap the animations back and replay the old
    // fade-in. It also makes the menu cascade in again whenever it comes back from a game.
    this.resolve?.();
  }
}

/** Seconds a full, unskipped intro takes. */
export const INTRO_SECONDS = (ENTER_AT + RUN_MS + CHASE_MS + FLY_MS) / 1000;
