import test from 'node:test';
import assert from 'node:assert/strict';
import { Storage, MemoryBackend, defaultSettings, scoreKey } from '../src/storage.js';

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
  Object.assign(s, { lang: 'pt', difficulty: 'hard', mode: 'endless', leftHanded: true, dpad: 'off' });
  st.saveSettings(s);
  assert.deepEqual(st.loadSettings(), s);
});

test('hand-edited or corrupt settings are sanitized', () => {
  const backend = new MemoryBackend();
  backend.setItem('pacman_settings', JSON.stringify({ lang: 'xx', difficulty: 'nightmare', mode: 'zen', dpad: 'sideways', sfx: 'yes', leftHanded: true }));
  const s = new Storage(backend).loadSettings();
  assert.equal(s.lang, 'en');
  assert.equal(s.difficulty, 'normal');
  assert.equal(s.mode, 'campaign');
  assert.equal(s.dpad, 'auto');
  assert.equal(s.sfx, true, 'wrong type falls back to the default');
  assert.equal(s.leftHanded, true, 'valid values survive');

  backend.setItem('pacman_settings', '{not json');
  assert.deepEqual(new Storage(backend).loadSettings(), defaultSettings());
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
  st.markSeen('tutorial');
  st.incrementGamesPlayed();
  st.resetProgress();
  assert.equal(st.best('campaign', 'normal').score, 0);
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
