import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PHASES, TILE, TILE_SIZE, COLS, ROWS, DIRS, GHOST_DEFS, SPAWN, STEP,
  levelParams, cloneMap, isPacmanWalkable, portalDestination
} from '../src/config.js';
import { Pacman, Ghost, tileOf, opposite, interpolate, TURN_TOLERANCE } from '../src/entities.js';

/** Small deterministic PRNG so failures are reproducible. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Minimal stand-in for the Game: only what Pacman and Ghost rely on. */
function makeGame(phaseIndex, { seed = 1, level = phaseIndex + 1 } = {}) {
  const phase = PHASES[phaseIndex];
  const map = cloneMap(phase.map);
  const tunnelRows = new Set();
  map.forEach((row, r) => { if (isPacmanWalkable(map, 0, r)) tunnelRows.add(r); });
  const game = {
    map,
    params: levelParams(level),
    random: rng(seed),
    eaten: 0,
    portalJumps: 0,
    isTunnelTile: (c, r) => tunnelRows.has(r) && (c <= 1 || c >= COLS - 2),
    onPellet(c, r) {
      if (map[r][c] === TILE.PELLET || map[r][c] === TILE.POWER) {
        map[r][c] = TILE.EMPTY;
        game.eaten++;
      }
    },
    onPortal(entity) {
      const dest = portalDestination(phase.portals, tileOf(entity.x), tileOf(entity.y));
      if (!dest) return false;
      entity.x = dest.col * TILE_SIZE + TILE_SIZE / 2;
      entity.y = dest.row * TILE_SIZE + TILE_SIZE / 2;
      if (entity === game.pacman) game.portalJumps++;
      else game.ghostJumps = (game.ghostJumps || 0) + 1;
      return true;
    }
  };
  game.pacman = new Pacman(game);
  game.ghosts = GHOST_DEFS.map((def, i) => new Ghost(game, def, game.params.ghostReleases[i]));
  return game;
}

const isSolid = (t) => t === TILE.WALL || t === TILE.VOID;
const DIR_LIST = [DIRS.UP, DIRS.DOWN, DIRS.LEFT, DIRS.RIGHT];

test('Pac-Man starts at the spawn tile, centered, heading left', () => {
  const g = makeGame(0);
  assert.equal(tileOf(g.pacman.x), SPAWN.pacman.col);
  assert.equal(tileOf(g.pacman.y), SPAWN.pacman.row);
  assert.equal(g.pacman.dir, DIRS.LEFT);
});

test('Pac-Man stops flush against a wall instead of entering it', () => {
  const g = makeGame(0);
  g.pacman.dir = DIRS.UP; // a wall sits right above the spawn
  g.pacman.nextDir = null;
  const startY = g.pacman.y;
  for (let i = 0; i < 120; i++) g.pacman.step();
  const row = tileOf(g.pacman.y);
  assert.ok(!isSolid(g.map[row][tileOf(g.pacman.x)]));
  assert.ok(Math.abs(g.pacman.y - startY) <= TILE_SIZE, 'did not drift through the wall');
});

test('reversing direction is instant, turning waits for an opening', () => {
  const g = makeGame(0);
  g.pacman.dir = DIRS.LEFT;
  g.pacman.setDirection(DIRS.RIGHT);
  assert.equal(g.pacman.dir, DIRS.RIGHT);
  g.pacman.setDirection(DIRS.UP);
  assert.equal(g.pacman.nextDir, DIRS.UP, 'a perpendicular turn is queued');
});

test('Pac-Man eats pellets along the way', () => {
  const g = makeGame(0);
  for (let i = 0; i < 200; i++) g.pacman.step();
  assert.ok(g.eaten >= 3, `ate ${g.eaten}`);
});

test('side tunnels wrap Pac-Man to the other edge', () => {
  const g = makeGame(0);
  const row = PHASES[0].tunnels[0].row;
  g.pacman.x = 1.5 * TILE_SIZE;
  g.pacman.y = row * TILE_SIZE + TILE_SIZE / 2;
  g.pacman.dir = DIRS.LEFT;
  g.pacman.nextDir = null;
  let wrapped = false;
  for (let i = 0; i < 60; i++) {
    g.pacman.step();
    if (g.pacman.x > (COLS - 2) * TILE_SIZE) wrapped = true;
  }
  assert.ok(wrapped, 'Pac-Man reappeared on the right side');
});

test('corner portals teleport Pac-Man (stage 3)', () => {
  const g = makeGame(2);
  const p = PHASES[2].portals[0];
  g.pacman.x = (p.c1 + 1) * TILE_SIZE + TILE_SIZE / 2;
  g.pacman.y = p.r1 * TILE_SIZE + TILE_SIZE / 2;
  g.pacman.dir = DIRS.LEFT;
  g.pacman.nextDir = null;
  for (let i = 0; i < 30; i++) g.pacman.step();
  assert.ok(g.portalJumps >= 1, 'a portal jump happened');
});

for (const [stage, dir, from] of [[2, 'LEFT', [3, 1]], [2, 'RIGHT', [15, 1]], [4, 'LEFT', [3, 1]], [4, 'RIGHT', [15, 1]]]) {
  test(`stage ${stage + 1}: entering a portal sideways teleports once and walks out of the pocket (${dir})`, () => {
    const g = makeGame(stage);
    const p = g.pacman;
    p.x = from[0] * TILE_SIZE + TILE_SIZE / 2;
    p.y = from[1] * TILE_SIZE + TILE_SIZE / 2;
    p.dir = DIRS[dir];
    p.nextDir = null;
    for (let i = 0; i < 60 * 4; i++) p.step();
    assert.equal(g.portalJumps, 1, 'no ping-pong between the two corners');
    assert.ok(tileOf(p.y) < ROWS - 2, `Pac-Man walked up out of the bottom pocket (row ${tileOf(p.y)})`);
  });
}

test('standing still on a portal never teleports again', () => {
  const g = makeGame(2);
  const p = g.pacman;
  const portal = PHASES[2].portals[0];
  p.x = portal.c2 * TILE_SIZE + TILE_SIZE / 2;
  p.y = portal.r2 * TILE_SIZE + TILE_SIZE / 2;
  p.lastTile = portal.r2 * COLS + portal.c2;
  p.dir = DIRS.LEFT; // a wall: Pac-Man stays on the portal tile
  p.nextDir = null;
  for (let i = 0; i < 60 * 5; i++) p.step();
  assert.equal(g.portalJumps, 0);
});

test('ghosts go through portals and leave the destination instead of snapping back', () => {
  const g = makeGame(2);
  const blinky = g.ghosts[0];
  blinky.state = 'CHASE';
  blinky.x = 3 * TILE_SIZE + TILE_SIZE / 2;
  blinky.y = 1 * TILE_SIZE + TILE_SIZE / 2;
  blinky.dir = DIRS.LEFT;
  blinky.lastTurnCol = 3;
  blinky.lastTurnRow = 1;
  g.pacman.x = 17 * TILE_SIZE + TILE_SIZE / 2; // lure him across the board
  g.pacman.y = 15 * TILE_SIZE + TILE_SIZE / 2;
  let jumpedAt = -1;
  for (let i = 0; i < 120; i++) {
    blinky.step();
    if (g.ghostJumps && jumpedAt < 0) jumpedAt = i;
    if (jumpedAt >= 0) assert.ok(tileOf(blinky.y) > 10, `step ${i}: Blinky snapped back to row ${tileOf(blinky.y)}`);
  }
  assert.equal(g.ghostJumps, 1);
  assert.ok(tileOf(blinky.y) < ROWS - 2, 'left the pocket around the destination portal');
});

test('simulation speed is independent of frame rate: movement per step is constant', () => {
  const g = makeGame(0);
  g.pacman.setDirection(DIRS.RIGHT);
  const x0 = g.pacman.x;
  g.pacman.step();
  const delta = Math.abs(g.pacman.x - x0);
  assert.ok(delta > 0 && delta <= g.params.pacmanSpeed + 1e-9);
  assert.equal(STEP, 1 / 60);
});

for (const [index, phase] of PHASES.entries()) {
  test(`stage ${index + 1} (${phase.id}): Pac-Man never leaves the corridors under random input`, () => {
    for (const seed of [1, 2, 3]) {
      const g = makeGame(index, { seed });
      const rand = rng(seed * 77);
      for (let i = 0; i < 4000; i++) {
        if (i % 7 === 0) g.pacman.setDirection(DIR_LIST[Math.floor(rand() * 4)]);
        g.pacman.step();
        const c = tileOf(g.pacman.x);
        const r = tileOf(g.pacman.y);
        if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
          const t = g.map[r][c];
          assert.ok(!isSolid(t) && t !== TILE.DOOR && t !== TILE.HOUSE, `seed ${seed} step ${i}: inside tile type ${t} at (${c},${r})`);
        }
      }
    }
  });

  test(`stage ${index + 1} (${phase.id}): ghosts stay inside the maze, leave the house and keep moving`, () => {
    const g = makeGame(index);
    const rand = rng(99);
    const visited = GHOST_DEFS.map(() => new Set());
    let left = GHOST_DEFS.map(() => false);
    for (let i = 0; i < 60 * 90; i++) { // 90 seconds
      if (i % 11 === 0) g.pacman.setDirection(DIR_LIST[Math.floor(rand() * 4)]);
      g.pacman.step();
      g.ghosts.forEach((gh, k) => {
        gh.step();
        const c = tileOf(gh.x);
        const r = tileOf(gh.y);
        if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
          const t = g.map[r][c];
          if (gh.state === 'CHASE' || gh.state === 'FRIGHTENED') {
            assert.ok(!isSolid(t), `${gh.name} inside a wall at (${c},${r}) on step ${i}`);
            assert.ok(t !== TILE.HOUSE && t !== TILE.DOOR, `${gh.name} re-entered the house while alive at (${c},${r})`);
            left[k] = true;
            visited[k].add(`${c},${r}`);
          }
        }
      });
    }
    assert.ok(left.every(Boolean), 'all four ghosts left the house');
    visited.forEach((set, k) => assert.ok(set.size >= 25, `${GHOST_DEFS[k].name} explored only ${set.size} tiles`));
  });
}

test('ghosts wait in the house until their release time', () => {
  const g = makeGame(0);
  const inky = g.ghosts[2];
  const release = g.params.ghostReleases[2];
  assert.equal(inky.state, 'IN_HOUSE');
  for (let i = 0; i < Math.floor((release - 0.5) / STEP); i++) inky.step();
  assert.equal(inky.state, 'IN_HOUSE');
  for (let i = 0; i < 60 * 4; i++) inky.step();
  assert.notEqual(inky.state, 'IN_HOUSE');
});

test('power pellet: ghosts become frightened, then recover on schedule', () => {
  const g = makeGame(0);
  const blinky = g.ghosts[0];
  blinky.frighten();
  assert.equal(blinky.state, 'FRIGHTENED');
  assert.equal(blinky.harmful, false);
  const steps = Math.ceil(g.params.frightenedDuration / STEP) + 2;
  for (let i = 0; i < steps; i++) blinky.step();
  assert.equal(blinky.state, 'CHASE');
  assert.equal(blinky.harmful, true);
});

test('frightening ignores ghosts that are in the house, leaving it, or already eaten', () => {
  const g = makeGame(0);
  const pinky = g.ghosts[1];
  pinky.frighten();
  assert.equal(pinky.state, 'IN_HOUSE');
  pinky.state = 'EXITING';
  pinky.frighten();
  assert.equal(pinky.state, 'EXITING');
  pinky.state = 'EATEN';
  pinky.frighten();
  assert.equal(pinky.state, 'EATEN');
});

test('frightened ghosts reverse direction', () => {
  const g = makeGame(0);
  const blinky = g.ghosts[0];
  const before = blinky.dir;
  blinky.frighten();
  assert.equal(blinky.dir, opposite(before));
});

test('eaten ghosts return to the house and revive', () => {
  const g = makeGame(0);
  const blinky = g.ghosts[0];
  blinky.frighten();
  blinky.state = 'EATEN';
  let revived = false;
  for (let i = 0; i < 60 * 30 && !revived; i++) {
    g.pacman.step();
    blinky.step();
    revived = blinky.state === 'CHASE';
  }
  assert.ok(revived, 'Blinky came back to life within 30 seconds');
});

test('Harmful states: only chasing or house-exiting ghosts can hurt Pac-Man', () => {
  const g = makeGame(0);
  const ghost = g.ghosts[0];
  for (const [state, harmful] of [['CHASE', true], ['EXITING', true], ['FRIGHTENED', false], ['EATEN', false], ['IN_HOUSE', false]]) {
    ghost.state = state;
    assert.equal(ghost.harmful, harmful, state);
  }
});

test('each ghost targets according to its personality', () => {
  const g = makeGame(0);
  const pac = g.pacman;
  pac.x = 5 * TILE_SIZE + TILE_SIZE / 2;
  pac.y = 4 * TILE_SIZE + TILE_SIZE / 2;
  pac.dir = DIRS.RIGHT;
  const [blinky, pinky, inky, clyde] = g.ghosts;
  assert.deepEqual(blinky.targetTile(1, 1), { x: 5, y: 4 });
  assert.deepEqual(pinky.targetTile(1, 1), { x: 9, y: 4 }, 'Pinky aims 4 tiles ahead');
  assert.deepEqual(inky.targetTile(1, 1), { x: 7, y: 4 }, 'Inky aims 2 tiles ahead');
  assert.deepEqual(clyde.targetTile(15, 15), { x: 5, y: 4 }, 'Clyde chases when far');
  assert.deepEqual(clyde.targetTile(6, 4), GHOST_DEFS[3].corner, 'Clyde flees to his corner when close');
  blinky.state = 'EATEN';
  assert.deepEqual(blinky.targetTile(1, 1), { x: SPAWN.ghostHouse.col, y: SPAWN.ghostHouse.row }, 'eaten ghosts head home');
});

test('ghosts slow down inside tunnels', () => {
  const g = makeGame(0);
  const ghost = g.ghosts[0];
  const row = PHASES[0].tunnels[0].row;
  ghost.state = 'CHASE';
  ghost.dir = DIRS.RIGHT;
  ghost.y = row * TILE_SIZE + TILE_SIZE / 2;
  ghost.x = 1 * TILE_SIZE + TILE_SIZE / 2; // column 1 is inside the tunnel
  const x0 = ghost.x;
  ghost.lastTurnCol = tileOf(ghost.x);
  ghost.lastTurnRow = row;
  ghost.step();
  const slow = ghost.x - x0;
  ghost.x = 8 * TILE_SIZE + TILE_SIZE / 2;
  const x1 = ghost.x;
  ghost.lastTurnCol = tileOf(ghost.x);
  ghost.step();
  const normal = ghost.x - x1;
  assert.ok(normal > 0);
  assert.ok(slow < normal, `tunnel step ${slow} should be shorter than ${normal}`);
});

test('interpolation blends between steps but never streaks across teleports or tunnel wraps', () => {
  assert.equal(interpolate(10, 12, 0), 10);
  assert.equal(interpolate(10, 12, 0.5), 11);
  assert.equal(interpolate(10, 12, 1), 12);
  assert.equal(interpolate(5, 375, 0.5), 375, 'a tunnel wrap is drawn at the new position');
  assert.equal(interpolate(30, 330, 0.25), 330, 'a portal jump is drawn at the new position');
});

for (const [index, phase] of PHASES.entries()) {
  test(`stage ${index + 1} (${phase.id}): movement is smooth, with no visible jumps between steps`, () => {
    const g = makeGame(index, { seed: 5 });
    const rand = rng(4242);
    const limit = g.params.pacmanSpeed + TURN_TOLERANCE + 1e-9;
    const ghostLimit = g.params.ghostSpeed * 1.8 + 1e-9; // eaten ghosts are the fastest
    let worstPac = 0;
    let worstGhost = 0;
    for (let i = 0; i < 4000; i++) {
      if (i % 5 === 0) g.pacman.setDirection(DIR_LIST[Math.floor(rand() * 4)]);
      g.pacman.step();
      worstPac = Math.max(worstPac, interpolateGap(g.pacman));
      g.ghosts.forEach((gh) => {
        gh.step();
        worstGhost = Math.max(worstGhost, interpolateGap(gh));
      });
    }
    assert.ok(worstPac <= limit, `Pac-Man jumped ${worstPac.toFixed(2)}px in one step (limit ${limit})`);
    assert.ok(worstGhost <= ghostLimit + 3, `a ghost jumped ${worstGhost.toFixed(2)}px in one step`);
  });
}

/** Distance moved in the last step, ignoring teleports/wraps (those are not interpolated). */
function interpolateGap(e) {
  const dx = Math.abs(e.x - e.prevX);
  const dy = Math.abs(e.y - e.prevY);
  if (dx > TILE_SIZE * 1.5 || dy > TILE_SIZE * 1.5) return 0;
  return Math.max(dx, dy);
}

test('Pac-Man cannot turn off the board while crossing a side tunnel', () => {
  for (let i = 0; i < PHASES.length; i++) {
    for (const tn of PHASES[i].tunnels) {
      for (const side of [DIRS.LEFT, DIRS.RIGHT]) {
        for (const turn of [DIRS.UP, DIRS.DOWN]) {
          const g = makeGame(i);
          const p = g.pacman;
          // Start on the edge tile of the tunnel, heading out of the board
          p.x = (side === DIRS.LEFT ? 0 : COLS - 1) * TILE_SIZE + TILE_SIZE / 2;
          p.y = tn.row * TILE_SIZE + TILE_SIZE / 2;
          p.dir = side;
          p.nextDir = side;
          // Out one side and back in on the other edge tile; past that, real junctions may turn
          let wrapped = false;
          for (let s = 0; s < 60; s++) {
            p.setDirection(turn); // player keeps pressing up/down the whole way through
            p.step();
            const col = tileOf(p.x);
            if (col < 0 || col >= COLS) wrapped = true;
            else if (wrapped && col !== 0 && col !== COLS - 1) break;
            assert.equal(tileOf(p.y), tn.row, `stage ${i + 1} row ${tn.row}: left the tunnel row at step ${s}`);
            assert.ok(p.x > -TILE_SIZE && p.x < (COLS + 1) * TILE_SIZE, `stage ${i + 1}: wandered off the board`);
          }
        }
      }
    }
  }
});
