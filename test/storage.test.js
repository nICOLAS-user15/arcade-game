import test from 'node:test';
import assert from 'node:assert/strict';
import { Storage, MemoryBackend, defaultSettings, scoreKey, cleanName, typingName } from '../src/storage.js';

const fresh = (opts) => new Storage(new MemoryBackend(), opts);

test('defaults: English, everything on, reduced motion follows the OS', () => {
  const s = fresh().loadSettings();
  assert.equal(s.lang, 'en');
  assert.equal(s.mode, 'campaign');
  assert.equal(s.difficulty, 'normal');
  assert.equal(s.sfx, true);
  assert.equal(s.reduceMotion, false);
  assert.equal(fresh({ prefersReducedMotion: true }).loadSettings().reduceMotion, true);
  assert.deepEqual(Object.keys(s).sort(), Object.keys(defaultSettings()).sort());
});

test('settings round-trip', () => {
  const st = fresh();
  const s = st.loadSettings();
  Object.assign(s, { lang: 'pt', difficulty: 'hard', mode: 'endless', theme: 'retro', dpad: 'off' });
  st.saveSettings(s);
  assert.deepEqual(st.loadSettings(), s);
});

test('hand-edited or corrupt settings are sanitized', () => {
  const backend = new MemoryBackend();
  backend.setItem('pacman_settings', JSON.stringify({ lang: 'xx', difficulty: 'nightmare', mode: 'zen', dpad: 'sideways', sfx: 'yes', theme: 'toString', music: false, leftHanded: true, haptics: true }));
  const s = new Storage(backend).loadSettings();
  assert.equal(s.lang, 'en');
  assert.equal(s.difficulty, 'normal');
  assert.equal(s.mode, 'campaign');
  assert.equal(s.dpad, 'on');
  assert.equal(s.theme, 'classic', 'unknown theme falls back to the default');
  assert.equal(s.sfx, true, 'wrong type falls back to the default');
  assert.equal(s.music, false, 'valid values survive');
  assert.equal('haptics' in s, false, 'the removed vibration setting is dropped');
  assert.equal('leftHanded' in s, false, 'removed settings are dropped');

  backend.setItem('pacman_settings', '{not json');
  assert.deepEqual(new Storage(backend).loadSettings(), defaultSettings());
});

test('the D-pad is on by default and older saves get it back on once', () => {
  assert.equal(defaultSettings().dpad, 'on');
  const backend = new MemoryBackend();
  backend.setItem('pacman_settings', JSON.stringify({ dpad: 'off', theme: 'modern', lang: 'pt' }));
  const st = new Storage(backend);
  const s = st.loadSettings();
  assert.equal(s.dpad, 'on', 'saves from before v2 are reset once');
  assert.equal(s.theme, 'classic', 'the removed Modern theme falls back to the default');
  assert.equal(s.lang, 'pt', 'other choices are kept');
  st.saveSettings({ ...s, dpad: 'off' });
  assert.equal(st.loadSettings().dpad, 'off', 'a choice made after the reset sticks');

  backend.setItem('pacman_settings', JSON.stringify({ version: 2, dpad: 'auto' }));
  assert.equal(new Storage(backend).loadSettings().dpad, 'on', '"auto" no longer exists');
  backend.setItem('pacman_settings', JSON.stringify({ version: 3, dpad: 'off' }));
  assert.equal(new Storage(backend).loadSettings().dpad, 'on', 'v4 switches it back on once for everyone');
  backend.setItem('pacman_settings', JSON.stringify({ version: 4, dpad: 'off' }));
  assert.equal(new Storage(backend).loadSettings().dpad, 'off', 'an "Off" chosen after that is respected');
});

test('personal bests are tracked per mode and difficulty', () => {
  const st = fresh();
  assert.deepEqual(st.best('campaign', 'normal'), { score: 0, level: 0 });
  assert.equal(st.submitScore('campaign', 'normal', 1200, 2), true);
  assert.equal(st.submitScore('campaign', 'normal', 800, 4), false, 'lower score is not a record');
  assert.deepEqual(st.best('campaign', 'normal'), { score: 1200, level: 4 }, 'furthest level is still kept');
  assert.equal(st.submitScore('campaign', 'normal', 3000, 3), true);
  assert.deepEqual(st.best('campaign', 'normal'), { score: 3000, level: 4 });
  assert.deepEqual(st.best('endless', 'normal'), { score: 0, level: 0 });
  assert.deepEqual(st.best('campaign', 'hard'), { score: 0, level: 0 });
  assert.equal(scoreKey('endless', 'hard'), 'endless:hard');
});

test('garbage in the score table cannot break reads', () => {
  const backend = new MemoryBackend();
  backend.setItem('pacman_scores', JSON.stringify({ 'campaign:normal': { score: 'lots', level: -3 }, junk: 5 }));
  const st = new Storage(backend);
  assert.deepEqual(st.best('campaign', 'normal'), { score: 0, level: 0 });
  backend.setItem('pacman_scores', JSON.stringify([1, 2, 3]));
  assert.deepEqual(st.allScores(), {});
});

test('the old single high score is migrated once', () => {
  const backend = new MemoryBackend();
  backend.setItem('pacman_high_score', '4560');
  const st = new Storage(backend);
  assert.deepEqual(st.best('campaign', 'normal'), { score: 4560, level: 1 });
  assert.equal(backend.getItem('pacman_high_score'), null, 'legacy key removed');
});

test('player names: any alphabet, single spaces, a few symbols, 12 characters at most', () => {
  assert.equal(cleanName('  João   da Silva  '), 'João da Silva'.slice(0, 12));
  assert.equal(cleanName('Ana-Clara'), 'Ana-Clara');
  assert.equal(cleanName("D'Ávila_99"), "D'Ávila_99");
  assert.equal(cleanName('<img src=x onerror=alert(1)>'), 'img srcx one', 'markup characters are dropped');
  assert.equal(cleanName('😀Zoë😀'), 'Zoë', 'emoji are dropped');
  assert.equal(cleanName('ABCDEFGHIJKLMNOP'), 'ABCDEFGHIJKL');
  assert.equal(cleanName('Ána'), 'Ána', 'combining accents are normalized');
  assert.equal(cleanName(null), '');
  assert.equal(typingName('Maria '), 'Maria ', 'a trailing space survives while typing');
  assert.equal(typingName('  Maria'), 'Maria');
});

test('top-10 table: sorted, capped at ten, ties go below, names sanitized', () => {
  const st = fresh();
  assert.deepEqual(st.board('campaign', 'normal'), []);
  assert.equal(st.qualifies('campaign', 'normal', 0), false, 'a zero score never qualifies');
  assert.equal(st.addToBoard('campaign', 'normal', { name: 'abc', score: 500, level: 2 }), 0);
  assert.equal(st.addToBoard('campaign', 'normal', { name: 'x<y>!z9', score: 900, level: 3 }), 0);
  assert.equal(st.addToBoard('campaign', 'normal', { name: '', score: 500, level: 1 }), 2, 'a tie ranks below the older entry');
  assert.deepEqual(st.board('campaign', 'normal').map((e) => [e.name, e.score]), [['xyz9', 900], ['abc', 500], ['---', 500]]);
  assert.equal(st.lastName(), '', 'a blank name is not remembered as dashes');
  st.addToBoard('campaign', 'normal', { name: ' Nicolas ', score: 950, level: 3 });
  assert.equal(st.lastName(), 'Nicolas', 'the last name is offered again');
  assert.deepEqual(st.board('endless', 'normal'), [], 'every mode and difficulty has its own table');

  for (let i = 1; i <= 12; i++) st.addToBoard('campaign', 'hard', { name: 'P' + i, score: i * 100, level: 1 });
  const hard = st.board('campaign', 'hard');
  assert.equal(hard.length, 10);
  assert.equal(hard[0].score, 1200);
  assert.equal(hard[9].score, 300, 'the two lowest scores dropped off');
  assert.equal(st.qualifies('campaign', 'hard', 300), false, 'equal to the last place does not qualify');
  assert.equal(st.qualifies('campaign', 'hard', 301), true);
  assert.equal(st.addToBoard('campaign', 'hard', { name: 'LOW', score: 100, level: 1 }), -1);
});

test('a continued run replaces its own table entry instead of adding a second one', () => {
  const st = fresh();
  st.addToBoard('campaign', 'normal', { name: 'Ana', score: 800, level: 2 });
  const rank = st.addToBoard('campaign', 'normal', { name: 'Bia', score: 500, level: 5 });
  const { date } = st.board('campaign', 'normal')[rank];
  st.removeFromBoard('campaign', 'normal', { date, name: 'Bia' });
  st.addToBoard('campaign', 'normal', { name: 'Bia', score: 1200, level: 8 });
  assert.deepEqual(st.board('campaign', 'normal').map((e) => [e.name, e.score]), [['Bia', 1200], ['Ana', 800]]);
  st.removeFromBoard('campaign', 'normal', { date: 0, name: 'Ana' });
  assert.equal(st.board('campaign', 'normal').length, 2, 'entries without a date stamp are never removed');
});

test('old personal bests become the first table entries once; corrupt data is survivable', () => {
  const old = new MemoryBackend();
  new Storage(old).submitScore('campaign', 'normal', 4000, 3);
  assert.equal(old.getItem('pacman_board'), null, 'recording a best alone does not touch the table');
  const st = new Storage(old);
  assert.deepEqual(st.board('campaign', 'normal').map((e) => [e.name, e.score, e.level]), [['---', 4000, 3]]);
  assert.equal(st.addToBoard('campaign', 'normal', { name: 'ZED', score: 1000, level: 1 }), 1);
  assert.deepEqual(new Storage(old).board('campaign', 'normal').map((e) => e.name), ['---', 'ZED'], 'migration does not run twice');

  const backend = new MemoryBackend();
  backend.setItem('pacman_board', JSON.stringify({ 'campaign:normal': [{ name: 'OK', score: 50, level: 1 }, { score: 'lots' }, null, 7] }));
  const bad = new Storage(backend);
  assert.deepEqual(bad.board('campaign', 'normal').map((e) => e.name), ['OK']);
  backend.setItem('pacman_board', '[1,2]');
  assert.deepEqual(bad.board('campaign', 'normal'), []);
  assert.equal(bad.addToBoard('campaign', 'normal', { name: 'NEW', score: 10, level: 1 }), 0);
});

test('volume settings default to full, are clamped and round-trip', () => {
  const st = fresh();
  const s = st.loadSettings();
  assert.equal(s.musicVolume, 100);
  assert.equal(s.sfxVolume, 100);
  st.saveSettings({ ...s, musicVolume: 35, sfxVolume: 0 });
  assert.deepEqual([st.loadSettings().musicVolume, st.loadSettings().sfxVolume], [35, 0]);
  st.saveSettings({ ...s, musicVolume: 900, sfxVolume: -20 });
  assert.deepEqual([st.loadSettings().musicVolume, st.loadSettings().sfxVolume], [100, 0]);
  st.saveSettings({ ...s, musicVolume: 'loud', sfxVolume: 42.6 });
  assert.deepEqual([st.loadSettings().musicVolume, st.loadSettings().sfxVolume], [100, 43]);
});

test('onboarding flags and stats', () => {
  const st = fresh();
  assert.equal(st.seen('tutorial'), false);
  st.markSeen('tutorial');
  st.markSeen('hint:move');
  assert.equal(st.seen('tutorial'), true);
  assert.equal(st.seen('hint:move'), true);
  assert.equal(st.seen('hint:fruit'), false);
  assert.equal(st.incrementGamesPlayed(), 1);
  assert.equal(st.incrementGamesPlayed(), 2);
  assert.equal(st.stats().gamesPlayed, 2);
});

test('resetProgress clears scores and onboarding but keeps settings', () => {
  const st = fresh();
  st.saveSettings({ ...st.loadSettings(), lang: 'pt' });
  st.submitScore('campaign', 'normal', 500, 1);
  st.addToBoard('campaign', 'normal', { name: 'AAA', score: 500, level: 1 });
  st.markSeen('tutorial');
  st.incrementGamesPlayed();
  st.resetProgress();
  assert.equal(st.best('campaign', 'normal').score, 0);
  assert.deepEqual(st.board('campaign', 'normal'), []);
  assert.equal(st.lastName(), '');
  assert.equal(st.seen('tutorial'), false);
  assert.equal(st.stats().gamesPlayed, 0);
  assert.equal(st.loadSettings().lang, 'pt');
});

test('a backend that throws never crashes the game', () => {
  const broken = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('quota'); },
    removeItem() { throw new Error('blocked'); }
  };
  const st = new Storage(broken);
  assert.deepEqual(st.loadSettings(), defaultSettings());
  assert.doesNotThrow(() => st.saveSettings(defaultSettings()));
  assert.doesNotThrow(() => st.submitScore('campaign', 'normal', 10, 1));
  assert.doesNotThrow(() => st.markSeen('x'));
  assert.doesNotThrow(() => st.resetProgress());
  assert.equal(st.best('campaign', 'normal').score, 0);
});

test('custom difficulty: saved values are clamped and custom games are a valid choice', () => {
  const backend = new MemoryBackend();
  backend.setItem('pacman_settings', JSON.stringify({ version: 2, difficulty: 'custom', customLives: 99, customSpeed: 10, startStage: 9, character: 'nope' }));
  const s = new Storage(backend).loadSettings();
  assert.equal(s.difficulty, 'custom');
  assert.equal(s.customLives, 5);
  assert.equal(s.customSpeed, 70);
  assert.equal(s.startStage, 5);
  assert.equal(s.character, 'pac');
});

test('start stages unlock as stages are reached, and older bests count', () => {
  const storage = new Storage(new MemoryBackend());
  assert.equal(storage.maxStage(), 1);
  storage.reachStage(3);
  assert.equal(storage.maxStage(), 3);
  storage.reachStage(2); // never goes down
  assert.equal(storage.maxStage(), 3);
  storage.reachStage(12); // endless levels past the last stage cap at 5
  assert.equal(storage.maxStage(), 5);
  storage.resetProgress();
  assert.equal(storage.maxStage(), 1);
  storage.submitScore('endless', 'normal', 5000, 4);
  assert.equal(storage.maxStage(), 4);
});
