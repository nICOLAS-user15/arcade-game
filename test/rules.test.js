import test from 'node:test';
import assert from 'node:assert/strict';
import { PHASES, ROWS, COLS, TILE, isPacmanWalkable } from '../src/config.js';
import { tunnelTiles } from '../src/game.js';
import { Cutscene, CUTSCENE_BONUS, MAX_BONUS_TAPS } from '../src/cutscene.js';
import { LOGICAL_W } from '../src/config.js';

const edgeRows = (map) => {
  const rows = new Set();
  for (let r = 0; r < ROWS; r++) if (isPacmanWalkable(map, 0, r) && map[r][0] !== TILE.WALL) rows.add(r);
  return rows;
};

test('tunnels are the walled-in corridor at each side edge, not the first junction of the row', () => {
  for (const phase of PHASES) {
    const tiles = tunnelTiles(phase.map, edgeRows(phase.map));
    assert.ok(tiles.size > 0, `${phase.id} has a tunnel`);
    for (const key of tiles) {
      const c = key % COLS;
      const r = Math.floor(key / COLS);
      assert.notEqual(phase.map[r][c], TILE.WALL, `${phase.id}: tunnel tile (${c},${r}) is walkable`);
      for (const rr of [r - 1, r + 1]) {
        assert.ok(rr < 0 || rr >= ROWS || phase.map[rr][c] === TILE.WALL, `${phase.id}: (${c},${r}) is walled in`);
      }
    }
  }
  // The classic side tunnels are four tiles long on each side
  const classic = tunnelTiles(PHASES[0].map, edgeRows(PHASES[0].map));
  assert.equal(classic.size, 8);
});

test('cutscene bonus is capped and the corner label skips it', () => {
  const hooks = { onBonus: () => {}, onChomp: () => {}, reduceMotion: true };
  const cs = new Cutscene(1, 2, hooks);
  for (let i = 0; i < 50; i++) cs.tap(100, 200);
  assert.equal(cs.taps, MAX_BONUS_TAPS);
  assert.equal(cs.bonus, CUTSCENE_BONUS, 'mashing cannot farm points');
  assert.equal(CUTSCENE_BONUS, 500);
  assert.equal(cs.done, false);
  cs.tap(LOGICAL_W - 20, 15);
  assert.equal(cs.done, true, 'tapping "SKIP >>" ends the cutscene');
});
