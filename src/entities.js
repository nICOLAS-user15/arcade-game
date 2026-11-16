/**
 * Pac-Man and the ghosts. Both advance one fixed simulation step at a time
 * (see STEP in config.js); speeds are in pixels per step.
 *
 * They only talk to the game through a small interface, which keeps them
 * unit-testable without a browser:
 *   game.map, game.params, game.pacman, game.isTunnelTile(col,row),
 *   game.onPellet(col,row), game.onPortal(entity)
 */

import { TILE_SIZE, COLS, ROWS, STEP, TILE, DIRS, SPAWN, isPacmanWalkable } from './config.js';
import { drawPacman, drawPacmanDying, drawGhost } from './sprites.js';

const HALF = TILE_SIZE / 2;
const RADIUS = TILE_SIZE * 0.44;
/**
 * How far from a tile center a queued turn is still accepted. Turning snaps the entity onto the
 * corridor's center line, so this is also the largest sideways jump the player can ever see.
 * Small enough to be invisible, large enough that a queued turn is never missed at full speed.
 */
export const TURN_TOLERANCE = 5;
const FRIGHTENED_SPEED = 0.6;
const EATEN_SPEED = 1.8;
const TUNNEL_SPEED = 0.55;
const HOUSE_EXIT_SPEED = 2.8;
const PORTAL_COOLDOWN = 0.9;

const CENTER = (n) => n * TILE_SIZE + HALF;
export const tileOf = (px) => Math.floor(px / TILE_SIZE);
export const opposite = (d) => (d === DIRS.UP ? DIRS.DOWN : d === DIRS.DOWN ? DIRS.UP : d === DIRS.LEFT ? DIRS.RIGHT : DIRS.LEFT);
const isOpposite = (a, b) => a.x === -b.x && a.y === -b.y;

/**
 * Position to draw between the previous and the current simulation step (alpha 0..1).
 * Large jumps (tunnel wrap, portals) are not interpolated, otherwise the sprite would streak across the board.
 */
export function interpolate(prev, cur, alpha) {
  return Math.abs(cur - prev) > TILE_SIZE * 1.5 ? cur : prev + (cur - prev) * alpha;
}

/** Moves an entity back inside the board when it leaves through a side/top tunnel. */
function wrapAround(e) {
  if (e.x < -HALF) e.x = COLS * TILE_SIZE + HALF - 1;
  else if (e.x > COLS * TILE_SIZE + HALF) e.x = -HALF + 1;
  if (e.y < -HALF) e.y = ROWS * TILE_SIZE + HALF - 1;
  else if (e.y > ROWS * TILE_SIZE + HALF) e.y = -HALF + 1;
}

// ============================================================ Pac-Man

export class Pacman {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.x = CENTER(SPAWN.pacman.col);
    this.y = CENTER(SPAWN.pacman.row);
    this.prevX = this.x;
    this.prevY = this.y;
    this.dir = DIRS.LEFT;
    this.nextDir = DIRS.LEFT;
    this.speed = this.game.params.pacmanSpeed;
    this.radius = RADIUS;
    this.mouth = 0.2;
    this.mouthOpening = true;
    this.isDying = false;
    this.deathProgress = 0;
    this.teleportCooldown = 0;
    this.isMoving = false;
  }

  setDirection(dir) {
    if (!dir) return;
    // Reversing is allowed anywhere in a corridor
    if (isOpposite(this.dir, dir)) {
      this.dir = dir;
      this.nextDir = null;
      return;
    }
    this.nextDir = dir;
  }

  canWalk(col, row) {
    return isPacmanWalkable(this.game.map, col, row);
  }

  step() {
    this.prevX = this.x;
    this.prevY = this.y;
    if (this.isDying) return;
    if (this.teleportCooldown > 0) this.teleportCooldown -= STEP;
    wrapAround(this);

    const col = tileOf(this.x);
    const row = tileOf(this.y);
    const cx = CENTER(col);
    const cy = CENTER(row);

    this.applyQueuedTurn(col, row, cx, cy);
    const startX = this.x;
    const startY = this.y;
    this.advance(col, row, cx, cy);
    this.isMoving = this.x !== startX || this.y !== startY;
    this.animateMouth();

    const nowCol = tileOf(this.x);
    const nowRow = tileOf(this.y);
    if (nowCol >= 0 && nowCol < COLS && nowRow >= 0 && nowRow < ROWS) {
      if (this.game.map[nowRow][nowCol] === TILE.PORTAL && this.teleportCooldown <= 0) this.game.onPortal(this);
      this.game.onPellet(nowCol, nowRow);
    }
  }

  applyQueuedTurn(col, row, cx, cy) {
    const next = this.nextDir;
    if (!next || next === this.dir) return;
    if (isOpposite(this.dir, next)) {
      this.dir = next;
      this.nextDir = null;
      return;
    }
    if (!this.canWalk(col + next.x, row + next.y)) return;
    if (next.y !== 0 && Math.abs(this.x - cx) <= TURN_TOLERANCE) {
      this.x = cx;
      this.dir = next;
      this.nextDir = null;
    } else if (next.x !== 0 && Math.abs(this.y - cy) <= TURN_TOLERANCE) {
      this.y = cy;
      this.dir = next;
      this.nextDir = null;
    }
  }

  /** Moves along the current direction, stopping exactly at the center of the last tile before a wall. */
  advance(col, row, cx, cy) {
    const d = this.dir;
    if (!d) return;
    const open = this.canWalk(col + d.x, row + d.y);
    if (d.x !== 0) {
      this.x = this.approach(this.x, cx, d.x, open);
      this.y = cy;
    } else {
      this.y = this.approach(this.y, cy, d.y, open);
      this.x = cx;
    }
  }

  approach(pos, center, sign, open) {
    if (open) return pos + sign * this.speed;
    const behindCenter = sign > 0 ? pos < center : pos > center;
    if (!behindCenter) return center;
    return sign > 0 ? Math.min(center, pos + this.speed) : Math.max(center, pos - this.speed);
  }

  animateMouth() {
    if (!this.isMoving) return;
    const speed = 0.025;
    if (this.mouthOpening) {
      this.mouth += speed;
      if (this.mouth >= 0.28) this.mouthOpening = false;
    } else {
      this.mouth -= speed;
      if (this.mouth <= 0.02) this.mouthOpening = true;
    }
  }

  draw(ctx, alpha = 1) {
    const x = (this.drawX = interpolate(this.prevX, this.x, alpha));
    const y = (this.drawY = interpolate(this.prevY, this.y, alpha));
    if (this.isDying) {
      drawPacmanDying(ctx, x, y, this.radius, this.deathProgress);
      return;
    }
    drawPacman(ctx, x, y, this.radius, { angle: this.dir ? this.dir.angle : 0, mouth: this.mouth });
  }
}

// ============================================================ Ghosts

export class Ghost {
  constructor(game, def, releaseTime) {
    this.game = game;
    this.def = def;
    this.name = def.name;
    this.releaseTime = releaseTime;
    this.reset();
  }

  get color() {
    return this.game.theme?.ghosts[this.name] || this.def.color;
  }

  reset() {
    const { startCol, startRow } = this.def;
    this.x = CENTER(startCol);
    this.y = CENTER(startRow);
    this.dir = DIRS.UP;
    this.state = this.name === 'Blinky' ? 'CHASE' : 'IN_HOUSE';
    this.speed = this.game.params.ghostSpeed;
    this.radius = RADIUS;
    this.frightenedTimer = 0;
    this.timer = 0;
    this.wave = 0;
    this.teleportCooldown = 0;
    this.lastTurnCol = startCol;
    this.lastTurnRow = startRow;

    // Blinky starts already outside, in the corridor above the house
    if (this.name === 'Blinky') {
      this.x = CENTER(SPAWN.ghostExit.col);
      this.y = CENTER(SPAWN.ghostExit.row);
      this.dir = DIRS.LEFT;
      this.lastTurnCol = SPAWN.ghostExit.col;
      this.lastTurnRow = SPAWN.ghostExit.row;
    }
    this.prevX = this.x;
    this.prevY = this.y;
  }

  /** True when this ghost can hurt Pac-Man. */
  get harmful() {
    return this.state === 'CHASE' || this.state === 'EXITING';
  }

  step() {
    this.prevX = this.x;
    this.prevY = this.y;
    this.timer += STEP;
    this.wave += 0.16;
    if (this.teleportCooldown > 0) this.teleportCooldown -= STEP;

    if (this.state === 'IN_HOUSE') {
      if (this.timer < this.releaseTime) {
        this.y += Math.sin(this.timer * 4) * 0.35; // idle bobbing
        return;
      }
      this.state = 'EXITING';
    }

    if (this.state === 'EXITING') {
      this.leaveHouse();
      return;
    }

    if (this.state === 'FRIGHTENED') {
      this.frightenedTimer -= STEP;
      if (this.frightenedTimer <= 0) this.state = 'CHASE';
    }

    wrapAround(this);

    let speed = this.speed;
    if (this.state === 'FRIGHTENED') speed *= FRIGHTENED_SPEED;
    else if (this.state === 'EATEN') speed *= EATEN_SPEED;
    if (this.game.isTunnelTile(tileOf(this.x), tileOf(this.y))) speed *= TUNNEL_SPEED;

    const prevX = this.x;
    const prevY = this.y;
    this.x += this.dir.x * speed;
    this.y += this.dir.y * speed;

    const col = tileOf(this.x);
    const row = tileOf(this.y);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return; // inside a tunnel

    if (this.game.map[row][col] === TILE.PORTAL && this.teleportCooldown <= 0) this.game.onPortal(this);

    // Decide a new direction once per tile, when crossing its center
    const cx = CENTER(col);
    const cy = CENTER(row);
    const crossedX = (prevX - cx) * (this.x - cx) <= 0;
    const crossedY = (prevY - cy) * (this.y - cy) <= 0;
    const atCenter = (this.dir.x !== 0 && crossedX) || (this.dir.y !== 0 && crossedY);
    if (!atCenter || (col === this.lastTurnCol && row === this.lastTurnRow)) return;

    this.x = cx;
    this.y = cy;
    this.lastTurnCol = col;
    this.lastTurnRow = row;

    // Eaten ghosts revive as soon as their eyes reach the house entrance
    if (this.state === 'EATEN' && col === SPAWN.ghostHouse.col && row >= SPAWN.ghostExit.row && row <= SPAWN.ghostHouse.row + 1) {
      this.state = 'CHASE';
      this.dir = DIRS.UP;
      return;
    }
    this.chooseDirection(col, row);
  }

  leaveHouse() {
    const doorX = CENTER(SPAWN.ghostExit.col);
    const exitY = CENTER(SPAWN.ghostExit.row);
    if (Math.abs(this.x - doorX) > 1) {
      this.x += Math.sign(doorX - this.x) * HOUSE_EXIT_SPEED;
      return;
    }
    this.x = doorX;
    this.y -= HOUSE_EXIT_SPEED;
    if (this.y <= exitY) {
      this.y = exitY;
      this.state = 'CHASE';
      this.dir = this.game.random() < 0.5 ? DIRS.LEFT : DIRS.RIGHT;
      this.lastTurnCol = SPAWN.ghostExit.col;
      this.lastTurnRow = SPAWN.ghostExit.row;
    }
  }

  canEnter(col, row) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true; // open tunnel
    const t = this.game.map[row][col];
    if (t === TILE.WALL || t === TILE.VOID) return false;
    if (t === TILE.DOOR || t === TILE.HOUSE) return this.state === 'EATEN';
    return true;
  }

  chooseDirection(col, row) {
    const options = [DIRS.UP, DIRS.LEFT, DIRS.DOWN, DIRS.RIGHT].filter((d) => this.canEnter(col + d.x, row + d.y));
    if (options.length === 0) {
      this.dir = opposite(this.dir); // dead end
      return;
    }
    // Classic rule: never reverse on your own unless there is no other way
    const forward = options.filter((d) => !isOpposite(d, this.dir));
    const candidates = forward.length ? forward : options;

    if (this.state === 'FRIGHTENED') {
      this.dir = candidates[Math.floor(this.game.random() * candidates.length)];
      return;
    }

    const target = this.targetTile(col, row);
    let best = candidates[0];
    let bestDist = Infinity;
    for (const d of candidates) {
      const dist = (col + d.x - target.x) ** 2 + (row + d.y - target.y) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        best = d;
      }
    }
    this.dir = best;
  }

  targetTile(col, row) {
    if (this.state === 'EATEN') return { x: SPAWN.ghostHouse.col, y: SPAWN.ghostHouse.row };
    const pac = this.game.pacman;
    const pc = tileOf(pac.x);
    const pr = tileOf(pac.y);
    switch (this.name) {
      case 'Pinky':
        return { x: pc + pac.dir.x * 4, y: pr + pac.dir.y * 4 };
      case 'Inky':
        return { x: pc + pac.dir.x * 2, y: pr + pac.dir.y * 2 };
      case 'Clyde':
        return Math.hypot(col - pc, row - pr) > 7 ? { x: pc, y: pr } : this.def.corner;
      default: // Blinky
        return { x: pc, y: pr };
    }
  }

  frighten() {
    if (this.state === 'EATEN' || this.state === 'IN_HOUSE' || this.state === 'EXITING') return;
    this.state = 'FRIGHTENED';
    this.frightenedTimer = this.game.params.frightenedDuration;
    this.dir = opposite(this.dir);
    this.lastTurnCol = -1;
    this.lastTurnRow = -1;
  }

  /** Scared ghosts flash white during the last two seconds as a warning. */
  get flashing() {
    return this.state === 'FRIGHTENED' && this.frightenedTimer < 2 && Math.floor(this.frightenedTimer * 5) % 2 === 0;
  }

  draw(ctx, alpha = 1) {
    const state = this.state === 'EATEN' ? 'eaten' : this.state === 'FRIGHTENED' ? 'scared' : 'normal';
    drawGhost(ctx, interpolate(this.prevX, this.x, alpha), interpolate(this.prevY, this.y, alpha), this.radius, {
      color: this.color,
      state,
      flash: this.flashing,
      dx: this.dir.x,
      dy: this.dir.y,
      wave: this.wave
    });
  }
}
