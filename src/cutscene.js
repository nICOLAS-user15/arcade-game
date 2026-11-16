/**
 * Short animated intermission shown after each stage. The player can tap/press
 * Space during it to collect bonus points (capped, so it can't be farmed).
 */

import { LOGICAL_W, LOGICAL_H } from './config.js';
import { drawPacman, drawGhost, drawEmoji, drawPowerPellet } from './sprites.js';
import { t } from './i18n.js';
import { getTheme, canvasFont, rgba } from './themes.js';

export const MAX_BONUS_TAPS = 25;
const STAGE_Y = 220;

const CONFETTI_COLORS = ['#facc15', '#38bdf8', '#f43f5e', '#a855f7', '#4ade80', '#ffffff'];

const ghost = (name, x, dir, scared = false) => ({ name, x, y: STAGE_Y, dir, scared });

export class Cutscene {
  /**
   * @param {number} variant 1..4, which animation to play
   * @param {number} stageNumber number shown in the title
   * @param {{onBonus:(pts:number)=>void, onChomp:()=>void, reduceMotion:boolean}} hooks
   */
  constructor(variant, stageNumber, hooks) {
    this.variant = variant;
    this.stageNumber = stageNumber;
    this.hooks = hooks;
    this.theme = hooks.theme || getTheme();
    this.time = 0;
    this.duration = 4.8;
    this.done = false;
    this.bonus = 0;
    this.taps = 0;
    this.particles = [];
    this.texts = [];
    this.pellet = { x: 240, y: STAGE_Y, eaten: false };
    this.fruit = null;
    this.pac = { x: -30, y: STAGE_Y, r: 13, mouth: 0.2, mouthSpeed: 3, dir: 1, mega: false };
    this.ghosts = [ghost('Blinky', -75, 1)];

    if (variant === 2) {
      this.ghosts = [ghost('Pinky', -50, 1), ghost('Inky', -90, 1)];
      this.fruit = { x: -70, y: STAGE_Y, eaten: false };
    } else if (variant === 3) {
      this.ghosts = [ghost('Blinky', 260, -1), ghost('Pinky', 295, -1), ghost('Inky', 330, -1), ghost('Clyde', 365, -1)];
      this.pac.x = -60;
    } else if (variant === 4) {
      this.pac.x = LOGICAL_W / 2;
      this.pac.y = 230;
      this.ghosts = [ghost('Blinky', 60, 1, true), ghost('Pinky', 100, 1, true), ghost('Inky', 280, -1, true), ghost('Clyde', 320, -1, true)];
    }
  }

  tap(x = LOGICAL_W / 2, y = STAGE_Y) {
    if (this.done || this.taps >= MAX_BONUS_TAPS) return false;
    this.taps++;
    this.bonus += 100;
    this.hooks.onBonus(100);
    this.texts.push({ text: '+100!', x, y: y - 10, life: 0.9 });
    const count = this.hooks.reduceMotion ? 4 : 14;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4.5;
      this.particles.push({
        x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 1.8,
        color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
        size: 3 + Math.random() * 3,
        life: 0.9
      });
    }
    return true;
  }

  skip() {
    this.done = true;
  }

  burst(x, y, color) {
    for (let i = 0; i < 14; i++) {
      const a = (Math.PI * 2 * i) / 14;
      const speed = 1.5 + Math.random() * 2;
      this.particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, color, size: 2.5, life: 0.6 });
    }
  }

  update(dt) {
    if (this.done) return;
    this.time += dt;
    const f = dt * 60; // particle speeds are expressed per 60 Hz frame

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * f;
      p.y += p.vy * f;
      p.vy += 0.12 * f;
      p.life -= dt * 1.3;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      this.texts[i].life -= dt * 1.5;
      this.texts[i].y -= 30 * dt;
      if (this.texts[i].life <= 0) this.texts.splice(i, 1);
    }

    const pac = this.pac;
    pac.mouth += pac.mouthSpeed * dt;
    if (pac.mouth > 0.32 || pac.mouth < 0.02) pac.mouthSpeed = -pac.mouthSpeed;

    this.animate(dt);
    if (this.time >= this.duration) this.done = true;
  }

  animate(dt) {
    const { pac, ghosts, time } = this;
    switch (this.variant) {
      case 1: // The big chase: Pac-Man grabs a power pellet and turns the tables
        if (time < 1.7 || (!this.pellet.eaten && pac.x < 235)) {
          pac.x += (time < 1.7 ? 165 : 140) * dt;
          ghosts[0].x = pac.x - 45;
        } else if (!this.pellet.eaten) {
          this.pellet.eaten = true;
          pac.mega = true;
          ghosts[0].scared = true;
          this.hooks.onChomp();
          this.burst(pac.x, pac.y, '#facc15');
        } else {
          ghosts[0].dir = -1;
          ghosts[0].x -= 200 * dt;
          pac.dir = -1;
          pac.x -= 230 * dt;
          pac.r = Math.min(26, pac.r + dt * 24);
        }
        break;
      case 2: // Two ghosts carry a strawberry; Pac-Man snatches it
        if (time < 1.8) {
          ghosts.forEach((g) => (g.x += 110 * dt));
          this.fruit.x = (ghosts[0].x + ghosts[1].x) / 2;
        } else {
          if (!this.fruit.eaten) {
            this.fruit.eaten = true;
            this.hooks.onChomp();
            this.burst(LOGICAL_W / 2, 210, '#f43f5e');
          }
          pac.x = LOGICAL_W / 2;
          pac.y = 200 + Math.sin(time * 6) * 10;
          ghosts.forEach((g) => {
            g.scared = true;
            g.x += Math.sin(time * 8) * 1.5;
          });
        }
        break;
      case 3: // Four ghosts march in, then flee from a speeding Pac-Man
        if (time < 1.8) {
          ghosts.forEach((g) => (g.x -= 80 * dt));
        } else {
          pac.x += 360 * dt;
          ghosts.forEach((g) => {
            g.scared = true;
            g.dir = 1;
            g.x += 160 * dt;
          });
        }
        break;
      default: // 4: power surge, Pac-Man rises while the ghosts cower
        pac.y = 230 - Math.min(160, Math.pow(time, 2.2) * 18);
    }
  }

  draw(ctx) {
    const theme = this.theme;
    const look = theme.cutscene;
    const font = (px) => canvasFont(theme, px);
    ctx.fillStyle = look.bg;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Stage floor
    ctx.strokeStyle = look.floor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 240);
    ctx.lineTo(LOGICAL_W, 240);
    ctx.stroke();
    ctx.strokeStyle = rgba(look.floor, 0.2);
    ctx.lineWidth = 1;
    for (let x = 0; x < LOGICAL_W; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 240);
      ctx.lineTo(x - 20, LOGICAL_H);
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = look.title;
    ctx.font = font(12);
    ctx.fillText(t('cutscene.title', { n: this.stageNumber }), LOGICAL_W / 2, 42);

    const blink = this.hooks.reduceMotion || Math.sin(performance.now() * 0.008) > 0;
    ctx.fillStyle = blink ? look.accent : '#ffffff';
    ctx.font = font(8);
    ctx.fillText(t('cutscene.tap'), LOGICAL_W / 2, 70);

    ctx.fillStyle = look.title;
    ctx.font = font(9);
    ctx.fillText(t('cutscene.total', { n: this.bonus }), LOGICAL_W / 2, 98);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = font(7);
    ctx.textAlign = 'right';
    ctx.fillText(t('cutscene.skip'), LOGICAL_W - 10, 20);

    if (this.variant === 1 && !this.pellet.eaten) {
      const pulse = this.hooks.reduceMotion ? 0 : Math.sin(performance.now() * 0.015) * 2;
      drawPowerPellet(ctx, this.pellet.x, this.pellet.y, 9 + pulse);
    }
    if (this.fruit && !this.fruit.eaten) drawEmoji(ctx, '🍓', this.fruit.x, this.fruit.y, 24);

    for (const g of this.ghosts) {
      drawGhost(ctx, g.x, g.y, 12, { color: theme.ghosts[g.name], state: g.scared ? 'scared' : 'normal', dx: g.dir, wave: this.time * 10 });
    }
    const p = this.pac;
    drawPacman(ctx, p.x, p.y, p.r, { angle: p.dir === -1 ? Math.PI : 0, mouth: p.mouth, glow: p.mega });
    if (p.mega) drawEmoji(ctx, '👑', p.x - p.r * 0.2, p.y - p.r * 1.2, 14);

    for (const c of this.particles) {
      ctx.globalAlpha = Math.max(0, c.life);
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = look.accent;
    ctx.font = font(9);
    ctx.textAlign = 'center';
    for (const tx of this.texts) {
      ctx.globalAlpha = Math.max(0, tx.life);
      ctx.fillText(tx.text, tx.x, tx.y);
    }
    ctx.globalAlpha = 1;
  }
}
