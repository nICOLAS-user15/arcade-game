import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PHASES, PHASE_COUNT, COLS, ROWS, TILE, SPAWN, DIFFICULTIES, GHOST_DEFS,
  levelParams, phaseForLevel, loopForLevel, countPellets, isPacmanWalkable, portalDestination
} from '../src/config.js';

const VALID_TILES = new Set(Object.values(TILE));

test('there are five stages with unique ids', () => {
  assert.equal(PHASE_COUNT, 5);
  assert.equal(new Set(PHASES.map((p) => p.id)).size, 5);
});

for (const [i, phase] of PHASES.entries()) {
  test(`stage ${i + 1} (${phase.id}): map shape and tile values`, () => {
    assert.equal(phase.map.length, ROWS);
    for (const row of phase.map) {
      assert.equal(row.length, COLS);
      for (const tile of row) assert.ok(VALID_TILES.has(tile), `unexpected tile ${tile}`);
    }
  });

  test(`stage ${i + 1} (${phase.id}): outer frame is closed except tunnels`, () => {
    const { map } = phase;
    assert.ok(map[0].every((t) => t === TILE.WALL), 'top row must be walls');
    assert.ok(map[ROWS - 1].every((t) => t === TILE.WALL), 'bottom row must be walls');
    for (let r = 1; r < ROWS - 1; r++) {
      const left = map[r][0];
      const right = map[r][COLS - 1];
      const tunnel = left === TILE.EMPTY && right === TILE.EMPTY;
      const closed = (left === TILE.WALL || left === TILE.VOID) && (right === TILE.WALL || right === TILE.VOID);
      assert.ok(tunnel || closed, `row ${r}: tunnel ends must match (left=${left}, right=${right})`);
    }
  });

  test(`stage ${i + 1} (${phase.id}): declared tunnels match the map`, () => {
    for (const tn of phase.tunnels) {
      assert.equal(phase.map[tn.row][tn.leftCol], TILE.EMPTY);
      assert.equal(phase.map[tn.row][tn.rightCol], TILE.EMPTY);
    }
    const tunnelRows = phase.map.map((row, r) => (row[0] === TILE.EMPTY ? r : -1)).filter((r) => r >= 0);
    assert.deepEqual(tunnelRows, phase.tunnels.map((t) => t.row).sort((a, b) => a - b));
  });

  test(`stage ${i + 1} (${phase.id}): ghost house is intact`, () => {
    const { map } = phase;
    assert.equal(map[SPAWN.ghostHouse.row][SPAWN.ghostHouse.col], TILE.DOOR);
    for (const c of [8, 9, 10]) assert.equal(map[10][c], TILE.HOUSE);
    assert.ok(isPacmanWalkable(map, SPAWN.ghostExit.col, SPAWN.ghostExit.row), 'corridor above the door must be open');
    for (const g of GHOST_DEFS) {
      const t = map[g.startRow][g.startCol];
      assert.ok(t === TILE.HOUSE || t === TILE.EMPTY, `${g.name} starts on a valid tile`);
    }
  });

  test(`stage ${i + 1} (${phase.id}): portals are paired and consistent`, () => {
    const portalTiles = [];
    phase.map.forEach((row, r) => row.forEach((t, c) => t === TILE.PORTAL && portalTiles.push([c, r])));
    assert.equal(portalTiles.length, phase.portals.length * 2);
    for (const p of phase.portals) {
      assert.equal(phase.map[p.r1][p.c1], TILE.PORTAL);
      assert.equal(phase.map[p.r2][p.c2], TILE.PORTAL);
      assert.deepEqual(portalDestination(phase.portals, p.c1, p.r1), { col: p.c2, row: p.r2 });
      assert.deepEqual(portalDestination(phase.portals, p.c2, p.r2), { col: p.c1, row: p.r1 });
    }
  });

  test(`stage ${i + 1} (${phase.id}): every pellet is reachable from Pac-Man's spawn`, () => {
    const { map, portals } = phase;
    const key = (c, r) => r * COLS + c;
    const seen = new Set();
    const queue = [[SPAWN.pacman.col, SPAWN.pacman.row]];
    assert.ok(isPacmanWalkable(map, SPAWN.pacman.col, SPAWN.pacman.row), 'spawn must be walkable');
    seen.add(key(...queue[0]));
    while (queue.length) {
      const [c, r] = queue.shift();
      const next = [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]];
      const portal = map[r][c] === TILE.PORTAL ? portalDestination(portals, c, r) : null;
      if (portal) next.push([portal.col, portal.row]);
      for (let [nc, nr] of next) {
        if (nr < 0 || nr >= ROWS) continue;
        if (nc < 0) nc = COLS - 1; // side tunnels wrap
        else if (nc >= COLS) nc = 0;
        if (!isPacmanWalkable(map, nc, nr) || seen.has(key(nc, nr))) continue;
        seen.add(key(nc, nr));
        queue.push([nc, nr]);
      }
    }
    const unreachable = [];
    map.forEach((row, r) => row.forEach((t, c) => {
      if ((t === TILE.PELLET || t === TILE.POWER) && !seen.has(key(c, r))) unreachable.push(`(${c},${r})`);
    }));
    assert.deepEqual(unreachable, [], `unreachable pellets: ${unreachable.join(' ')}`);
  });

  test(`stage ${i + 1} (${phase.id}): has pellets, power pellets and sane timings`, () => {
    assert.ok(countPellets(phase.map) > 100);
    assert.ok(phase.map.flat().includes(TILE.POWER));
    assert.equal(phase.ghostReleases.length, GHOST_DEFS.length);
    assert.equal(phase.ghostReleases[0], 0);
    assert.deepEqual([...phase.ghostReleases].sort((a, b) => a - b), phase.ghostReleases);
  });
}

test('stages get progressively harder', () => {
  for (let i = 1; i < PHASES.length; i++) {
    assert.ok(PHASES[i].ghostSpeed > PHASES[i - 1].ghostSpeed, 'ghosts speed up');
    assert.ok(PHASES[i].frightenedDuration < PHASES[i - 1].frightenedDuration, 'power-ups get shorter');
    assert.ok(PHASES[i].fruit.points > PHASES[i - 1].fruit.points, 'fruit is worth more');
  }
});

test('level numbers map onto stages and loops', () => {
  assert.equal(phaseForLevel(1).id, PHASES[0].id);
  assert.equal(phaseForLevel(5).id, PHASES[4].id);
  assert.equal(phaseForLevel(6).id, PHASES[0].id);
  assert.equal(phaseForLevel(11).id, PHASES[0].id);
  assert.equal(loopForLevel(5), 0);
  assert.equal(loopForLevel(6), 1);
  assert.equal(loopForLevel(16), 3);
});

test('difficulty scales lives and speed in the expected direction', () => {
  const order = ['easy', 'normal', 'hard', 'hardcore'].map((id) => DIFFICULTIES[id]);
  assert.deepEqual(Object.keys(DIFFICULTIES), order.map((d) => d.id));
  const speed = (d) => levelParams(3, d).ghostSpeed;
  const fright = (d) => levelParams(3, d).frightenedDuration;
  const release = (d) => levelParams(3, d).ghostReleases[1];
  for (let i = 1; i < order.length; i++) {
    const [easier, harder] = [order[i - 1], order[i]];
    assert.ok(easier.lives > harder.lives, `${harder.id}: fewer lives`);
    assert.ok(speed(easier) < speed(harder), `${harder.id}: faster ghosts`);
    assert.ok(fright(easier) > fright(harder), `${harder.id}: shorter power-ups`);
    assert.ok(release(easier) > release(harder), `${harder.id}: ghosts leave the house sooner`);
  }
});

test('Hardcore: a single life and no extra life', () => {
  assert.equal(DIFFICULTIES.hardcore.lives, 1);
  assert.equal(DIFFICULTIES.hardcore.extraLife, false);
  for (const id of ['easy', 'normal', 'hard']) assert.equal(DIFFICULTIES[id].extraLife, true);
});

test('level 1 on Normal reproduces the stage values untouched', () => {
  const p = levelParams(1, DIFFICULTIES.normal);
  assert.equal(p.ghostSpeed, PHASES[0].ghostSpeed);
  assert.equal(p.pacmanSpeed, PHASES[0].pacmanSpeed);
  assert.equal(p.frightenedDuration, PHASES[0].frightenedDuration);
  assert.deepEqual(p.ghostReleases, PHASES[0].ghostReleases);
  assert.equal(p.fruitPoints, PHASES[0].fruit.points);
});

test('Endless: every lap is harder but stays bounded and playable', () => {
  const rampMax = 1.2;
  for (const d of Object.values(DIFFICULTIES)) {
    let prev = levelParams(1, d);
    for (let level = 2; level <= 80; level++) {
      const cur = levelParams(level, d);
      const same = (level - 1) % PHASE_COUNT === 0 ? null : prev; // compare within a lap only
      if (same) assert.ok(cur.ghostSpeed >= same.ghostSpeed, `level ${level}: ghosts never slow down within a lap`);
      assert.ok(cur.frightenedDuration >= 1.5, 'power-ups never shorter than 1.5s');
      assert.ok(cur.ghostSpeed <= PHASES[4].ghostSpeed * d.ghostSpeed * rampMax + 0.01, 'ghost speed is capped');
      assert.ok(cur.ghostReleases.every((t) => t >= 0 && Number.isFinite(t)));
      prev = cur;
    }
    // Same stage, later lap: strictly tougher
    assert.ok(levelParams(11, d).ghostSpeed > levelParams(1, d).ghostSpeed);
    assert.ok(levelParams(11, d).frightenedDuration < levelParams(1, d).frightenedDuration);
    assert.equal(levelParams(6, d).fruitPoints, PHASES[0].fruit.points * 2);
  }
});

test('difficultyFor: presets pass through, custom is built from the sliders and clamped', async () => {
  const { difficultyFor, CUSTOM_LIMITS } = await import('../src/config.js');
  assert.equal(difficultyFor({ difficulty: 'hard' }), DIFFICULTIES.hard);
  assert.equal(difficultyFor({ difficulty: 'bogus' }), DIFFICULTIES.normal);
  const c = difficultyFor({ difficulty: 'custom', customLives: 4, customSpeed: 120 });
  assert.deepEqual([c.id, c.custom, c.lives, c.ghostSpeed], ['custom', true, 4, 1.2]);
  const low = difficultyFor({ difficulty: 'custom', customLives: 0, customSpeed: 5 });
  assert.equal(low.lives, CUSTOM_LIMITS.lives.min);
  assert.equal(low.speedPct, CUSTOM_LIMITS.speed.min);
});
