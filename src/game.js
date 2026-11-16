/**
 * Game orchestration: session state, rules, the fixed-step loop, rendering and HUD.
 *
 * States: MENU, READY, PLAYING, PAUSED, DYING, STAGE_CLEAR, INTERMISSION,
 *         BRIEFING, GAMEOVER, VICTORY
 */

import {
  TILE_SIZE, COLS, ROWS, LOGICAL_W, LOGICAL_H, STEP, MAX_STEPS_PER_FRAME, TILE, SPAWN, SCORE,
  DIFFICULTIES, GAME_MODES, GHOST_DEFS, PHASES, PHASE_COUNT, phaseForLevel, levelParams,
  countPellets, cloneMap, isPacmanWalkable, portalDestination
} from './config.js';
import { Pacman, Ghost, tileOf } from './entities.js';
import { Cutscene } from './cutscene.js';
import { drawPowerPellet, drawPortal, drawEmoji, pelletPath, getSkin } from './sprites.js';
import { stageLook, canvasFont, shade } from './themes.js';
import { HAPTICS } from './audio.js';
import { Input } from './input.js';
import { t, formatNumber } from './i18n.js';

const MODALS = ['pauseModal', 'briefingModal', 'standardModal'];
const TAU = Math.PI * 2;
const FRUIT_SECONDS = 11;
const HIT_STOP = 0.12;

/**
 * Fills the union of all wall tiles, pulled back `inset` px from every corridor, so neighbouring
 * tiles merge into continuous rounded shapes instead of a grid of squares.
 */
function paintWallShape(g, map, inset, radius, color) {
  const T = TILE_SIZE;
  const wall = (c, r) => c >= 0 && c < COLS && r >= 0 && r < ROWS && (map[r][c] === TILE.WALL || map[r][c] === TILE.VOID);
  g.fillStyle = color;
  g.beginPath();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!wall(c, r)) continue;
      const l = wall(c - 1, r);
      const rt = wall(c + 1, r);
      const u = wall(c, r - 1);
      const d = wall(c, r + 1);
      const x0 = c * T + (l ? 0 : inset);
      const x1 = (c + 1) * T - (rt ? 0 : inset);
      const y0 = r * T + (u ? 0 : inset);
      const y1 = (r + 1) * T - (d ? 0 : inset);
      if (radius > 0 && g.roundRect) {
        g.roundRect(x0, y0, x1 - x0, y1 - y0, [!l && !u ? radius : 0, !rt && !u ? radius : 0, !rt && !d ? radius : 0, !l && !d ? radius : 0]);
      } else {
        g.rect(x0, y0, x1 - x0, y1 - y0);
      }
    }
  }
  g.fill();
  if (inset <= 0) return;

  // Inner corners: keep the same distance from a corridor corner that touches the wall only diagonally
  g.save();
  g.globalCompositeOperation = 'destination-out';
  g.beginPath();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!wall(c, r)) continue;
      for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        if (!wall(c + dx, r) || !wall(c, r + dy) || wall(c + dx, r + dy)) continue;
        const cx = (c + (dx > 0 ? 1 : 0)) * T;
        const cy = (r + (dy > 0 ? 1 : 0)) * T;
        g.moveTo(cx + inset, cy);
        g.arc(cx, cy, inset, 0, TAU);
      }
    }
  }
  g.fill();
  g.restore();
}

export class Game {
  constructor(app) {
    this.app = app;
    this.$ = app.$;
    this.canvas = this.$('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.overlay = this.$('gameOverlay');
    this.random = Math.random;

    this.state = 'MENU';
    this.screen = 'menu';
    this.menu = null; // injected by main.js
    this.scale = 1;
    this.mazeCache = null;
    this.acc = 0;
    this.alpha = 1;
    this.last = performance.now();
    this.floaters = [];
    this.particles = [];
    this.hitStop = 0;
    this.cutscene = null;
    this.seenHints = new Set();
    this.hintTimer = null;

    this.setupCanvas();
    this.bindUI();
    this.input = new Input(this);
    app.onChange(() => this.onSettingsChanged());

    this.frame = this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }

  // ================================================================ session

  get diff() {
    return DIFFICULTIES[this.app.settings.difficulty] || DIFFICULTIES.normal;
  }

  get phase() {
    return phaseForLevel(this.level);
  }

  get theme() {
    return this.app.theme;
  }

  get isEndlessView() {
    return this.endless || this.level > PHASE_COUNT;
  }

  newSession() {
    const s = this.app.settings;
    this.mode = GAME_MODES[s.mode] ? s.mode : 'campaign';
    this.difficulty = this.diff;
    this.endless = GAME_MODES[this.mode].endless;
    this.score = 0;
    this.lives = this.difficulty.lives;
    this.extraLifeGiven = false;
    this.storedBest = this.app.storage.best(this.mode, this.difficulty.id).score;
    this.cutscene = null;
    this.updateScore();
    this.updateLives();
    this.loadLevel(1);
  }

  loadLevel(n) {
    this.level = n;
    this.params = levelParams(n, this.difficulty);
    const phase = this.phase;

    this.map = cloneMap(phase.map);
    this.pelletsTotal = countPellets(this.map);
    this.pelletsLeft = this.pelletsTotal;
    this.dotsEaten = 0;
    this.tunnelRows = new Set();
    for (let r = 0; r < ROWS; r++) {
      if (isPacmanWalkable(this.map, 0, r) && this.map[r][0] !== TILE.WALL) this.tunnelRows.add(r);
    }
    this.fruit = { active: false, timer: 0, x: SPAWN.fruit.col * TILE_SIZE + TILE_SIZE / 2, y: SPAWN.fruit.row * TILE_SIZE + TILE_SIZE / 2 };
    this.ghostCombo = 0;
    this.floaters.length = 0;
    this.particles.length = 0;
    this.hitStop = 0;
    this.mazeCache = null;

    this.pacman = new Pacman(this);
    this.ghosts = GHOST_DEFS.map((def, i) => new Ghost(this, def, this.params.ghostReleases[i]));
    this.applyStageLook();
    this.updateStage();
    this.updatePowerBar();
  }

  startNewGame() {
    this.commitScore();
    this.newSession();
    this.app.storage.incrementGamesPlayed();
    this.app.sound.init();
    this.app.sound.gameStart();
    this.showGameScreen();
    this.beginLevel(true);
  }

  restart() {
    this.startNewGame();
  }

  beginLevel(fresh) {
    this.hideOverlay();
    this.cutscene = null;
    this.state = 'READY';
    this.readyTimer = fresh ? 2 : 1.4;
    this.acc = 0;
    this.updatePauseButton();
    if (fresh) {
      this.app.announce(t('sr.stageStart', { name: t(`phase.${this.phase.id}.name`) }));
      if (this.phase.portals.length) this.hint('portal', 'hint.portal');
      else if (this.level === 1) this.hint('move', this.app.dpadVisible ? 'hint.move.touch' : 'hint.move.keys');
    }
  }

  showGameScreen() {
    this.screen = 'game';
    this.$('menu').hidden = true;
    this.$('game').hidden = false;
    this.menu?.hide();
    this.resize();
    this.updateFullscreenButton();
  }

  showMenu() {
    this.commitScore();
    this.state = 'MENU';
    this.screen = 'menu';
    this.hideOverlay();
    this.hideHint();
    this.$('game').hidden = true;
    this.$('menu').hidden = false;
    this.menu?.show();
  }

  /** Stores the score as a personal best if it beats the previous one. Returns true on a new record. */
  commitScore() {
    if (!this.mode || !this.score) return false;
    return this.app.storage.submitScore(this.mode, this.difficulty.id, this.score, this.level);
  }

  // ================================================================ loop

  frame(ts) {
    requestAnimationFrame(this.frame);
    const dt = Math.min(0.25, Math.max(0, (ts - this.last) / 1000));
    this.last = ts;
    this.input.pollGamepad();
    if (this.screen !== 'game') return;

    if (this.state === 'INTERMISSION') {
      this.cutscene.update(dt);
      if (this.cutscene.done) this.showBriefing();
    } else if (['READY', 'PLAYING', 'DYING', 'STAGE_CLEAR'].includes(this.state)) {
      this.acc += dt;
      let steps = 0;
      while (this.acc >= STEP && steps < MAX_STEPS_PER_FRAME) {
        this.tick();
        this.acc -= STEP;
        steps++;
      }
      if (steps === MAX_STEPS_PER_FRAME) this.acc = 0; // drop the backlog after a long stall
    }
    // Draw between the last two simulation steps. Without this, a 60 Hz simulation shown on a
    // 120/144 Hz display (or with uneven frame times) repeats positions and looks like stutter.
    this.alpha = this.state === 'PLAYING' && this.hitStop <= 0 ? this.acc / STEP : 1;
    this.updatePowerBar();
    this.render();
  }

  /** Advances the simulation by exactly one fixed step. */
  tick() {
    switch (this.state) {
      case 'READY':
        this.updateEffects();
        this.readyTimer -= STEP;
        if (this.readyTimer <= 0) this.state = 'PLAYING';
        break;
      case 'PLAYING':
        this.simulate();
        break;
      case 'DYING':
        this.deathTime += STEP;
        this.pacman.deathProgress = Math.min(1, this.deathTime / 0.85);
        this.updateEffects();
        if (this.deathTime >= 1.3) this.loseLife();
        break;
      case 'STAGE_CLEAR':
        this.updateEffects();
        this.stageTimer -= STEP;
        if (this.stageTimer <= 0) this.afterStageClear();
        break;
      default:
    }
  }

  simulate() {
    if (this.hitStop > 0) {
      this.hitStop -= STEP;
      this.updateEffects();
      return;
    }
    this.pacman.step();
    if (this.state !== 'PLAYING') return; // the stage was cleared on this step

    this.checkFruit();
    for (const ghost of this.ghosts) {
      ghost.step();
      if (ghost.state === 'EATEN' || ghost.state === 'IN_HOUSE') continue;
      if (Math.hypot(this.pacman.x - ghost.x, this.pacman.y - ghost.y) >= TILE_SIZE * 0.75) continue;
      if (ghost.state === 'FRIGHTENED') {
        this.eatGhost(ghost);
        break;
      }
      if (ghost.harmful) {
        this.killPacman();
        return;
      }
    }

    if (this.fruit.active) {
      this.fruit.timer -= STEP;
      if (this.fruit.timer <= 0) this.fruit.active = false;
    }
    if (this.isTunnelTile(tileOf(this.pacman.x), tileOf(this.pacman.y))) this.hint('tunnel', 'hint.tunnel');
    this.updateEffects();
  }

  updateEffects() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= STEP * 2;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.life -= STEP * 1.5;
      f.y -= 0.5;
      if (f.life <= 0) this.floaters.splice(i, 1);
    }
  }

  // ================================================================ rules (called by entities)

  isTunnelTile(col, row) {
    return this.tunnelRows.has(row) && (col <= 1 || col >= COLS - 2);
  }

  onPellet(col, row) {
    const tile = this.map[row][col];
    if (tile !== TILE.PELLET && tile !== TILE.POWER) return;
    this.map[row][col] = TILE.EMPTY;
    this.pelletsLeft--;
    this.dotsEaten++;

    if (tile === TILE.PELLET) {
      this.addScore(SCORE.PELLET);
      this.app.sound.waka();
    } else {
      this.addScore(SCORE.POWER);
      this.app.sound.power();
      this.app.haptics.play(HAPTICS.power);
      this.app.announce(t('sr.power'));
      this.ghostCombo = 0;
      this.ghosts.forEach((g) => g.frighten());
      this.hint('scared', 'hint.scared');
    }

    if (this.dotsEaten === 12) this.hint('power', 'hint.power');
    const first = Math.floor(this.pelletsTotal * 0.3);
    const second = Math.floor(this.pelletsTotal * 0.7);
    if ((this.dotsEaten === first || this.dotsEaten === second) && !this.fruit.active) this.spawnFruit();

    if (this.pelletsLeft <= 0) this.stageClear();
  }

  onPortal(entity) {
    const dest = portalDestination(this.phase.portals, tileOf(entity.x), tileOf(entity.y));
    if (!dest) return;
    entity.x = dest.col * TILE_SIZE + TILE_SIZE / 2;
    entity.y = dest.row * TILE_SIZE + TILE_SIZE / 2;
    entity.teleportCooldown = 0.9;
    this.app.sound.teleport();
    this.burst(entity.x, entity.y, this.look.wall, 14);
  }

  spawnFruit() {
    this.fruit.active = true;
    this.fruit.timer = FRUIT_SECONDS;
    this.hint('fruit', 'hint.fruit');
  }

  checkFruit() {
    const f = this.fruit;
    if (!f.active) return;
    if (Math.hypot(this.pacman.x - f.x, this.pacman.y - f.y) >= TILE_SIZE * 0.8) return;
    f.active = false;
    const pts = this.params.fruitPoints;
    this.addScore(pts);
    this.app.sound.fruit();
    this.app.haptics.play(HAPTICS.fruit);
    this.floaters.push({ text: `+${pts}`, x: f.x, y: f.y, life: 1.2, color: '#ffffff' });
  }

  eatGhost(ghost) {
    ghost.state = 'EATEN';
    this.ghostCombo++;
    const pts = SCORE.GHOST_BASE * 2 ** (this.ghostCombo - 1);
    this.addScore(pts);
    this.app.sound.eatGhost();
    this.app.haptics.play(HAPTICS.ghost);
    this.floaters.push({ text: `+${pts}`, x: ghost.x, y: ghost.y, life: 1, color: '#67e8f9' });
    this.burst(ghost.x, ghost.y, ghost.color, 10);
    this.hitStop = this.app.reduceMotion ? 0 : HIT_STOP;
  }

  killPacman() {
    this.state = 'DYING';
    this.deathTime = 0;
    this.pacman.isDying = true;
    this.pacman.deathProgress = 0;
    this.app.sound.death();
    this.app.haptics.play(HAPTICS.death);
  }

  loseLife() {
    this.lives--;
    this.updateLives();
    this.app.announce(t('sr.lifeLost', { n: Math.max(0, this.lives) }));
    if (this.lives <= 0) {
      this.gameOver();
      return;
    }
    this.pacman.reset();
    this.ghosts.forEach((g) => g.reset());
    this.ghostCombo = 0;
    this.hitStop = 0;
    this.state = 'READY';
    this.readyTimer = 1.4;
    this.acc = 0;
  }

  addScore(pts) {
    this.score += pts;
    if (this.difficulty.extraLife && !this.extraLifeGiven && this.score >= SCORE.EXTRA_LIFE_AT) {
      this.extraLifeGiven = true;
      this.lives++;
      this.updateLives();
      this.app.sound.extraLife();
      this.app.haptics.play(HAPTICS.extraLife);
      this.app.toast(t('toast.extraLife'), 'good');
      this.app.announce(t('sr.extraLife'));
    }
    this.updateScore(pts >= 100);
  }

  burst(x, y, color, count = 12) {
    if (this.app.reduceMotion) count = Math.ceil(count / 3);
    for (let i = 0; i < count; i++) {
      const a = (TAU / count) * i;
      const speed = 1.5 + this.random() * 2;
      this.particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, color, life: 0.6 });
    }
  }

  // ================================================================ stage flow

  stageClear() {
    this.state = 'STAGE_CLEAR';
    this.stageTimer = 1.1;
    this.app.sound.stageClear();
    this.app.haptics.play(HAPTICS.stageClear);
    this.commitScore();
  }

  afterStageClear() {
    if (!this.endless && this.level === PHASE_COUNT) {
      this.victory();
      return;
    }
    this.startCutscene();
  }

  startCutscene() {
    const variant = ((this.level - 1) % 4) + 1;
    this.cutscene = new Cutscene(variant, this.level, {
      reduceMotion: this.app.reduceMotion,
      theme: this.theme,
      onBonus: (pts) => {
        this.addScore(pts);
        this.app.sound.bonusCoin();
        this.app.haptics.play(HAPTICS.tap);
      },
      onChomp: () => this.app.sound.bigChomp()
    });
    this.state = 'INTERMISSION';
    this.hideOverlay();
  }

  showBriefing() {
    this.state = 'BRIEFING';
    const next = this.level + 1;
    const ph = phaseForLevel(next);
    const params = levelParams(next, this.difficulty);
    const $ = this.$;

    $('briefingLevel').textContent = this.endless || next > PHASE_COUNT
      ? t('briefing.endless', { n: next })
      : t('briefing.unlocked', { n: next, max: PHASE_COUNT });
    $('briefingTitle').textContent = t(`phase.${ph.id}.name`).toUpperCase();
    $('briefingFeatureIcon').textContent = ph.feature.icon;
    $('briefingFeatureText').textContent = t(`phase.${ph.id}.feature`);
    $('briefingFruitIcon').textContent = ph.fruit.icon;
    $('briefingFruitText').textContent = `${t(`phase.${ph.id}.fruit`)} (+${formatNumber(params.fruitPoints)})`;

    const baseline = PHASES[0].ghostSpeed * this.difficulty.ghostSpeed;
    const pct = Math.round((params.ghostSpeed / baseline - 1) * 100);
    $('briefingSpeedText').textContent = pct > 0 ? t('briefing.speed.up', { n: pct }) : t('briefing.speed.base');

    const bonus = this.cutscene ? this.cutscene.bonus : 0;
    $('briefingBonusPts').textContent = `+${formatNumber(bonus)}`;
    $('briefingBonusPts').parentElement.hidden = bonus === 0;

    const nextLook = stageLook(this.theme, (next - 1) % PHASE_COUNT);
    const modal = $('briefingModal');
    modal.style.setProperty('--next', nextLook.wall);
    modal.style.setProperty('--next-glow', nextLook.glow);
    const btn = $('btnStartPhase');
    btn.textContent = t(this.endless || next > PHASE_COUNT ? 'briefing.enterLevel' : 'briefing.enterStage', { n: next });
    this.showOverlayModal('briefingModal');
  }

  enterNextLevel() {
    if (this.state !== 'BRIEFING') return;
    this.loadLevel(this.level + 1);
    this.beginLevel(true);
  }

  victory() {
    this.state = 'VICTORY';
    this.app.sound.stageClear();
    const isRecord = this.commitScore();
    this.showResult({
      icon: '👑',
      title: t('result.victory'),
      text: t('result.victory.text', { max: PHASE_COUNT, score: formatNumber(this.score) }),
      isRecord,
      primary: [t('result.endless'), () => {
        this.endless = true;
        this.cutscene = null;
        this.showBriefing();
      }],
      secondary: [t('result.menu'), () => this.showMenu()]
    });
  }

  gameOver() {
    this.state = 'GAMEOVER';
    const isRecord = this.commitScore();
    this.app.announce(t('sr.gameOver', { score: formatNumber(this.score) }));
    const where = t(this.isEndlessView ? 'result.where.level' : 'result.where.stage', { n: this.level });
    this.showResult({
      icon: '💀',
      title: t('result.gameover'),
      text: t('result.gameover.text', { score: formatNumber(this.score), where }),
      isRecord,
      primary: [t('result.playAgain'), () => this.startNewGame()],
      secondary: [t('result.menu'), () => this.showMenu()]
    });
  }

  // ================================================================ pause / actions

  pause() {
    if (this.state !== 'PLAYING' && this.state !== 'READY') return;
    this.prevState = this.state;
    this.state = 'PAUSED';
    this.commitScore();
    this.updatePauseButton();
    this.app.announce(t('sr.paused'));
    this.showOverlayModal('pauseModal');
  }

  resume() {
    if (this.state !== 'PAUSED') return;
    this.state = this.prevState || 'PLAYING';
    this.acc = 0;
    this.hideOverlay();
    this.updatePauseButton();
    this.app.announce(t('sr.resumed'));
  }

  togglePause() {
    if (this.state === 'PAUSED') this.resume();
    else this.pause();
  }

  steer(dir) {
    if (this.state === 'PLAYING' || this.state === 'READY') this.pacman.setDirection(dir);
  }

  skipCutscene() {
    if (this.state === 'INTERMISSION') this.cutscene.skip();
  }

  /** Space/Enter/tap on the board while a cutscene plays collects the bonus. */
  onBoardTap(clientX, clientY) {
    if (this.state !== 'INTERMISSION' || !this.cutscene) return;
    const rect = this.canvas.getBoundingClientRect();
    this.cutscene.tap(((clientX - rect.left) / rect.width) * LOGICAL_W, ((clientY - rect.top) / rect.height) * LOGICAL_H);
  }

  toggleSound() {
    const on = !this.app.settings.sfx;
    this.app.update({ sfx: on });
    if (on) this.app.sound.init();
    this.app.toast(t(on ? 'toast.soundOn' : 'toast.soundOff'));
  }

  // ================================================================ rendering

  setupCanvas() {
    if (window.ResizeObserver) new ResizeObserver(() => this.resize()).observe(this.canvas);
    window.addEventListener('resize', () => this.resize());
  }

  /** Matches the backing store to the displayed size and device pixel ratio for crisp rendering. */
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width) return;
    const dpr = window.devicePixelRatio || 1;
    const scale = Math.max(1, (rect.width / LOGICAL_W) * dpr);
    const w = Math.round(LOGICAL_W * scale);
    const h = Math.round(LOGICAL_H * scale);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.mazeCache = null;
    }
    this.scale = w / LOGICAL_W;
  }

  /**
   * Walls never change during a stage, so they are painted once into an offscreen canvas.
   * Wall tiles are merged into continuous shapes (see paintWallShape) and each theme decides how
   * to paint them: arcade outline, 8-bit bevelled blocks, soft candy or brutalist slabs.
   */
  buildMazeCache(scale) {
    const w = Math.round(LOGICAL_W * scale);
    const h = Math.round(LOGICAL_H * scale);
    const layer = () => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const g = c.getContext('2d');
      g.setTransform(scale, 0, 0, scale, 0, 0);
      return { c, g };
    };
    const shape = (inset, radius, color) => {
      const L = layer();
      paintWallShape(L.g, this.map, inset, radius, color);
      return L;
    };
    const stamp = (target, source, op = 'source-over', dx = 0, dy = 0) => {
      target.g.save();
      target.g.setTransform(1, 0, 0, 1, 0, 0);
      target.g.globalCompositeOperation = op;
      target.g.drawImage(source.c, dx * scale, dy * scale);
      target.g.restore();
    };
    const band = (inset, width, radius, color) => {
      const outer = shape(inset, radius, color);
      stamp(outer, shape(inset + width, Math.max(0, radius - width), '#000'), 'destination-out');
      return outer;
    };

    const out = layer();
    const look = this.look;
    const wl = this.theme.walls;
    switch (wl.style) {
      case 'block': {
        // 8-bit bevel: light rim top-left, dark rim bottom-right, flat face in the middle
        const blocks = shape(wl.inset, 0, shade(look.wall, 0.45));
        stamp(blocks, shape(wl.inset, 0, shade(look.wall, -0.5)), 'source-atop', 2, 2);
        stamp(blocks, shape(wl.inset + 2, 0, look.wall), 'source-atop');
        stamp(out, blocks);
        break;
      }
      case 'soft':
        stamp(out, shape(wl.inset, wl.radius, look.wall));
        stamp(out, shape(wl.core, Math.max(0, wl.radius - (wl.core - wl.inset)), look.core));
        break;
      case 'slab': {
        // Brutalist: square monochrome slabs, a different raw texture on every stage
        const edge = () => band(wl.inset, 2, 0, look.wall);
        if (look.pattern === 'frame') {
          stamp(out, band(wl.inset, 3, 0, look.wall));
        } else if (look.pattern === 'groove') {
          stamp(out, shape(wl.inset, 0, look.wall));
          stamp(out, band(wl.inset + 3.5, 1.5, 0, '#000'), 'destination-out');
        } else if (look.pattern === 'hatch' || look.pattern === 'dots') {
          const tex = layer();
          tex.g.fillStyle = look.wall;
          tex.g.strokeStyle = look.wall;
          tex.g.lineWidth = 1.6;
          tex.g.beginPath();
          if (look.pattern === 'hatch') {
            for (let k = -LOGICAL_H; k < LOGICAL_W; k += 5) {
              tex.g.moveTo(k, 0);
              tex.g.lineTo(k + LOGICAL_H, LOGICAL_H);
            }
            tex.g.stroke();
          } else {
            for (let y = 2; y < LOGICAL_H; y += 4) for (let x = 2; x < LOGICAL_W; x += 4) tex.g.rect(x - 0.8, y - 0.8, 1.6, 1.6);
            tex.g.fill();
          }
          stamp(tex, shape(wl.inset, 0, '#000'), 'destination-in');
          stamp(out, tex);
          stamp(out, edge());
        } else {
          stamp(out, shape(wl.inset, 0, look.wall));
        }
        break;
      }
      default: // 'outline'
        stamp(out, band(wl.inset, wl.width, wl.radius, look.wall));
    }

    const g = out.g;
    g.fillStyle = getSkin().door;
    for (let r = 0; r < ROWS; r++) {
      for (let col = 0; col < COLS; col++) {
        if (this.map[r][col] === TILE.DOOR) g.fillRect(col * TILE_SIZE, r * TILE_SIZE + TILE_SIZE / 2 - 2, TILE_SIZE, 4);
      }
    }
    return out.c;
  }

  /** Offscreen canvas for themes that draw the board at a lower resolution (chunky pixels). */
  lowResBuffer(pixel) {
    const w = Math.round(LOGICAL_W / pixel);
    const h = Math.round(LOGICAL_H / pixel);
    if (!this.lowRes || this.lowRes.width !== w || this.lowRes.height !== h) {
      this.lowRes = document.createElement('canvas');
      this.lowRes.width = w;
      this.lowRes.height = h;
    }
    return this.lowRes;
  }

  render() {
    const ctx = this.ctx;
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    if (this.state === 'INTERMISSION' && this.cutscene) {
      this.cutscene.draw(ctx);
      return;
    }
    if (!this.map) return;

    const now = performance.now();
    const pixel = this.theme.pixel || 1;
    if (pixel > 1) {
      const low = this.lowResBuffer(pixel);
      const lctx = low.getContext('2d');
      lctx.setTransform(1 / pixel, 0, 0, 1 / pixel, 0, 0);
      this.drawScene(lctx, now, 1 / pixel);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(low, 0, 0, this.canvas.width, this.canvas.height);
      ctx.restore();
    } else {
      this.drawScene(ctx, now, this.scale);
    }
    this.drawTexts(ctx, now);
  }

  /** Everything on the board except text, drawn in logical coordinates. */
  drawScene(ctx, now, scale) {
    ctx.fillStyle = this.look.bg;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    if (!this.mazeCache || this.mazeCacheScale !== scale) {
      this.mazeCache = this.buildMazeCache(scale);
      this.mazeCacheScale = scale;
    }
    ctx.drawImage(this.mazeCache, 0, 0, LOGICAL_W, LOGICAL_H);
    this.drawCollectibles(ctx, now);
    this.drawTunnelArrows(ctx, now);

    if (this.fruit.active) {
      const blinking = this.fruit.timer < 3 && Math.floor(this.fruit.timer * 5) % 2 === 0;
      if (!blinking) drawEmoji(ctx, this.phase.fruit.icon, this.fruit.x, this.fruit.y, 14);
    }

    if (this.state !== 'STAGE_CLEAR') {
      if (!(this.state === 'DYING' && this.deathTime > 0.3)) this.ghosts.forEach((g) => g.draw(ctx, this.alpha));
      this.pacman.draw(ctx, this.alpha);
    } else {
      this.pacman.draw(ctx, 1);
    }

    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /** Score pop-ups and banners stay at full resolution so they are always readable. */
  drawTexts(ctx, now) {
    ctx.font = canvasFont(this.theme, 8);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of this.floaters) {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;

    if (this.state === 'READY') this.drawBanner(ctx, t('canvas.ready'), this.theme.banner);
    if (this.state === 'STAGE_CLEAR') this.drawStageClear(ctx, now);
  }

  drawCollectibles(ctx, now) {
    const skin = getSkin();
    const pulse = this.app.reduceMotion ? 0 : Math.sin(now * 0.008) * 1.5;
    ctx.fillStyle = skin.pellet;
    ctx.beginPath();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.map[r][c] !== TILE.PELLET) continue;
        pelletPath(ctx, c * TILE_SIZE + TILE_SIZE / 2, r * TILE_SIZE + TILE_SIZE / 2, skin.pelletSize);
      }
    }
    ctx.fill();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = this.map[r][c];
        const x = c * TILE_SIZE + TILE_SIZE / 2;
        const y = r * TILE_SIZE + TILE_SIZE / 2;
        if (tile === TILE.POWER) drawPowerPellet(ctx, x, y, 5.5 + pulse);
        else if (tile === TILE.PORTAL) drawPortal(ctx, x, y, this.app.reduceMotion ? 0 : now);
      }
    }
  }

  drawTunnelArrows(ctx, now) {
    ctx.fillStyle = this.look.wall;
    ctx.globalAlpha = this.app.reduceMotion ? 0.7 : 0.4 + 0.4 * (Math.sin(now * 0.006) > 0 ? 1 : 0.2);
    for (const r of this.tunnelRows) {
      const y = r * TILE_SIZE + TILE_SIZE / 2;
      for (const [x, d] of [[6, -1], [LOGICAL_W - 6, 1]]) {
        ctx.beginPath();
        ctx.moveTo(x + d * 3, y);
        ctx.lineTo(x - d * 2, y - 4);
        ctx.lineTo(x - d * 2, y + 4);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  drawBanner(ctx, text, color) {
    const y = SPAWN.fruit.row * TILE_SIZE + TILE_SIZE / 2;
    ctx.font = canvasFont(this.theme, 12);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.strokeText(text, LOGICAL_W / 2, y);
    ctx.fillStyle = color;
    ctx.fillText(text, LOGICAL_W / 2, y);
  }

  drawStageClear(ctx, now) {
    const alpha = this.app.reduceMotion ? 0.25 : 0.2 + Math.abs(Math.sin(now * 0.012)) * 0.3;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    this.drawBanner(ctx, t('canvas.stageClear'), this.theme.banner);
  }

  // ================================================================ HUD

  /** Stage colors for the active theme, shared by the board and the HUD (--phase variables). */
  applyStageLook() {
    this.themeId = this.theme.id;
    this.look = stageLook(this.theme, (this.level - 1) % PHASE_COUNT);
    this.mazeCache = null;
    const root = document.documentElement;
    root.style.setProperty('--phase', this.look.wall);
    root.style.setProperty('--phase-glow', this.look.glow);
    const chip = this.$('fruitChip');
    chip.textContent = this.phase.fruit.icon;
    this.refreshFruitLabel();
  }

  refreshFruitLabel() {
    const chip = this.$('fruitChip');
    const label = `${t(`phase.${this.phase.id}.fruit`)} (+${formatNumber(this.params.fruitPoints)})`;
    chip.setAttribute('aria-label', label);
    chip.title = label;
  }

  updateStage() {
    const name = t(`phase.${this.phase.id}.name`);
    this.$('stageNum').textContent = this.isEndlessView
      ? t('hud.level', { n: this.level })
      : t('hud.stage', { n: this.level, max: PHASE_COUNT });
    this.$('stageName').textContent = name;
    const mode = t(this.mode === 'endless' ? 'mode.endless' : 'mode.campaign');
    this.canvas.setAttribute('aria-label', t('a11y.board', { mode, name }));
    this.updateBest();
  }

  updateScore(bump = false) {
    this.$('score').textContent = formatNumber(this.score);
    this.updateBest();
    if (bump && !this.app.reduceMotion) {
      const el = this.$('score');
      el.classList.remove('bump');
      void el.offsetWidth; // restart the CSS animation
      el.classList.add('bump');
    }
  }

  updateBest() {
    this.$('highScore').textContent = formatNumber(Math.max(this.storedBest || 0, this.score || 0));
  }

  updateLives() {
    const box = this.$('livesIcons');
    box.textContent = '';
    const shown = Math.min(this.lives, 6);
    for (let i = 0; i < shown; i++) {
      const icon = document.createElement('span');
      icon.className = 'life-icon';
      box.appendChild(icon);
    }
    if (this.lives > shown) {
      const more = document.createElement('span');
      more.className = 'life-more';
      more.textContent = `+${this.lives - shown}`;
      box.appendChild(more);
    }
    box.setAttribute('role', 'img');
    box.setAttribute('aria-label', String(Math.max(0, this.lives)));
  }

  updatePowerBar() {
    const bar = (this.powerBarEl ||= this.$('powerBar'));
    let left = 0;
    for (const g of this.ghosts || []) if (g.state === 'FRIGHTENED') left = Math.max(left, g.frightenedTimer);
    const total = this.params ? this.params.frightenedDuration : 1;
    const show = left > 0;
    if (bar.hidden === show) bar.hidden = !show;
    if (show) {
      (this.powerFillEl ||= this.$('powerFill')).style.transform = `scaleX(${Math.min(1, left / total).toFixed(3)})`;
      bar.classList.toggle('ending', left < 2);
    }
  }

  updatePauseButton() {
    const btn = this.$('btnPause');
    const paused = this.state === 'PAUSED';
    btn.dataset.paused = paused ? 'true' : 'false';
    const label = t(paused ? 'btn.resume' : 'btn.pause');
    btn.setAttribute('aria-label', label);
    btn.title = label;
  }

  updateSoundButton() {
    this.$('btnSound').setAttribute('aria-pressed', String(!!this.app.settings.sfx));
  }

  updateFullscreenButton() {
    const btn = this.$('btnFullscreen');
    const supported = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
    btn.hidden = !supported; // iPhone Safari has no Fullscreen API for pages
    const on = this.isFullscreen();
    const label = t(on ? 'btn.fullscreen.exit' : 'btn.fullscreen');
    btn.setAttribute('aria-label', label);
    btn.title = label;
    btn.classList.toggle('active', on);
  }

  onSettingsChanged() {
    this.updateSoundButton();
    this.updatePauseButton();
    this.updateFullscreenButton();
    if (this.map) {
      if (this.themeId !== this.theme.id) this.applyStageLook();
      this.updateStage();
      this.refreshFruitLabel();
    }
    if (this.state === 'BRIEFING') this.showBriefing();
  }

  // ================================================================ hints (contextual onboarding)

  hintSeen(key) {
    if (this.seenHints.has(key)) return true;
    if (this.app.storage.seen(`hint:${key}`)) {
      this.seenHints.add(key);
      return true;
    }
    return false;
  }

  /** Shows a one-time tip over the board. Skipped if already seen or another tip is on screen. */
  hint(key, i18nKey, ms = 4500) {
    if (this.hintTimer || this.hintSeen(key)) return;
    this.seenHints.add(key);
    this.app.storage.markSeen(`hint:${key}`);
    this.$('coachText').textContent = t(i18nKey);
    this.$('coach').hidden = false;
    this.hintTimer = setTimeout(() => this.hideHint(), ms);
  }

  hideHint() {
    clearTimeout(this.hintTimer);
    this.hintTimer = null;
    this.$('coach').hidden = true;
  }

  // ================================================================ overlay modals

  showOverlayModal(id) {
    for (const m of MODALS) this.$(m).hidden = m !== id;
    this.overlay.hidden = false;
    const modal = this.$(id);
    const focusTarget = modal.querySelector('.btn-primary') || modal.querySelector('button');
    setTimeout(() => focusTarget && focusTarget.focus({ preventScroll: true }), 30);
  }

  hideOverlay() {
    this.overlay.hidden = true;
    for (const m of MODALS) this.$(m).hidden = true;
    const active = document.activeElement;
    if (active && active !== document.body && this.overlay.contains(active)) active.blur();
  }

  get overlayOpen() {
    return !this.overlay.hidden;
  }

  showResult({ icon, title, text, isRecord, primary, secondary }) {
    this.$('overlayIcon').textContent = icon;
    this.$('overlayTitle').textContent = title;
    this.$('overlaySubtitle').textContent = text;
    this.$('newBest').hidden = !isRecord;
    this.$('btnPrimary').textContent = primary[0];
    this.$('btnSecondary').textContent = secondary[0];
    this.resultActions = { primary: primary[1], secondary: secondary[1] };
    this.showOverlayModal('standardModal');
  }

  // ================================================================ fullscreen

  isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  toggleFullscreen() {
    const root = this.$('app');
    try {
      if (this.isFullscreen()) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document)?.catch?.(() => {});
      } else {
        const request = root.requestFullscreen || root.webkitRequestFullscreen;
        request?.call(root)?.catch?.(() => {});
      }
    } catch {
      /* fullscreen is optional */
    }
  }

  // ================================================================ DOM wiring

  bindUI() {
    const $ = this.$;
    const press = (id, fn) => {
      $(id).addEventListener('click', (e) => {
        this.app.sound.init();
        this.app.sound.click();
        // Pointer clicks drop focus so Space keeps pausing the game; keyboard activation keeps it
        if (e.detail > 0 && e.currentTarget.closest('.toolbar')) e.currentTarget.blur();
        fn(e);
      });
    };

    press('btnPause', () => this.togglePause());
    press('btnSound', () => this.toggleSound());
    press('btnFullscreen', () => this.toggleFullscreen());
    press('btnContinue', () => this.resume());
    press('btnRestartPause', () => this.restart());
    press('btnSettingsPause', () => this.menu?.openSettings());
    press('btnQuit', () => this.showMenu());
    press('btnStartPhase', () => this.enterNextLevel());
    press('btnPrimary', () => this.resultActions?.primary());
    press('btnSecondary', () => this.resultActions?.secondary());

    document.addEventListener('fullscreenchange', () => this.updateFullscreenButton());
    document.addEventListener('webkitfullscreenchange', () => this.updateFullscreenButton());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.screen === 'game') this.pause();
    });
    window.addEventListener('pagehide', () => this.commitScore());
  }
}
