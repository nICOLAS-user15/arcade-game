import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEMES, THEME_IDS, DEFAULT_THEME, getTheme, stageLook, canvasFont, shade, rgba } from '../src/themes.js';
import { PHASE_COUNT, GHOST_DEFS } from '../src/config.js';
import { DICT } from '../src/i18n.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const HEX = /^#[0-9a-f]{6}$/i;
const WALL_STYLES = ['outline', 'block', 'neon', 'soft', 'line'];

test('the theme list and the theme table agree, and the default exists', () => {
  assert.deepEqual(Object.keys(THEMES), THEME_IDS);
  assert.ok(THEMES[DEFAULT_THEME]);
  assert.equal(getTheme('nope').id, DEFAULT_THEME);
  assert.equal(getTheme('__proto__').id, DEFAULT_THEME);
});

for (const theme of Object.values(THEMES)) {
  test(`theme ${theme.id}: one complete palette per stage`, () => {
    assert.equal(theme.stages.length, PHASE_COUNT);
    assert.ok(WALL_STYLES.includes(theme.walls.style), `unknown wall style ${theme.walls.style}`);
    for (const s of theme.stages) {
      assert.match(s.wall, HEX);
      assert.match(s.bg, HEX);
      if (theme.walls.style === 'soft') assert.match(s.core, HEX, 'soft walls need a core color');
      if (theme.walls.style === 'neon' || theme.walls.style === 'line') assert.match(s.fill, HEX, `${theme.walls.style} walls need a fill`);
    }
    assert.equal(new Set(theme.stages.map((s) => s.wall)).size, PHASE_COUNT, 'every stage looks different');
  });

  test(`theme ${theme.id}: sprites, ghosts, menu and cutscene colors`, () => {
    for (const key of ['pacman', 'pellet', 'power', 'scared', 'scaredFace', 'flash', 'flashFace', 'pupil', 'door']) {
      assert.match(theme.skin[key], HEX, `skin.${key}`);
    }
    assert.ok(theme.skin.pelletSize > 0);
    for (const g of GHOST_DEFS) assert.match(theme.ghosts[g.name], HEX, g.name);
    assert.ok(theme.menu.grid && theme.menu.star);
    for (const key of ['bg', 'floor', 'title', 'accent']) assert.match(theme.cutscene[key], HEX, `cutscene.${key}`);
    assert.match(theme.chrome, HEX);
    assert.ok(theme.pixel >= 1);
  });

  test(`theme ${theme.id}: wired into the menu, the CSS and both languages`, () => {
    assert.match(read('index.html'), new RegExp(`data-theme-id="${theme.id}"`));
    assert.match(read('style.css'), new RegExp(`\\.swatch\\[data-sw='${theme.id}'\\]`));
    if (theme.id !== DEFAULT_THEME) assert.match(read('style.css'), new RegExp(`html\\[data-theme='${theme.id}'\\] \\{`));
    for (const lang of Object.keys(DICT)) {
      assert.ok(DICT[lang][`theme.${theme.id}`], `${lang}: theme.${theme.id}`);
      assert.ok(DICT[lang][`theme.${theme.id}.hint`], `${lang}: theme.${theme.id}.hint`);
    }
  });
}

test('stage looks wrap around in Endless and derive a glow color', () => {
  const t = THEMES.classic;
  assert.equal(stageLook(t, 0).wall, t.stages[0].wall);
  assert.equal(stageLook(t, PHASE_COUNT).wall, t.stages[0].wall);
  assert.equal(stageLook(t, 0).glow, 'rgba(33, 33, 222, 0.5)');
});

test('color helpers', () => {
  assert.equal(rgba('#ff8000', 0.25), 'rgba(255, 128, 0, 0.25)');
  assert.equal(shade('#808080', 0), '#808080');
  assert.equal(shade('#000000', 1), '#ffffff');
  assert.equal(shade('#ffffff', -1), '#000000');
  assert.equal(canvasFont(THEMES.modern, 8), '8px "Press Start 2P", monospace');
  assert.equal(canvasFont(THEMES.minimal, 8), '700 12px Rajdhani, system-ui, sans-serif');
});
