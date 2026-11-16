import test from 'node:test';
import assert from 'node:assert/strict';
import { SONGS, STAGE_TRACK } from '../src/songs.js';
import { compileSong, getSongs, noteToMidi, midiToFreq, parseChord, MusicPlayer, STEPS_PER_BAR } from '../src/chiptune.js';
import { PHASES } from '../src/config.js';

test('note names map to the right MIDI numbers and pitches', () => {
  assert.equal(noteToMidi('C4'), 60);
  assert.equal(noteToMidi('A4'), 69);
  assert.equal(noteToMidi('C#5'), 73);
  assert.equal(noteToMidi('Bb3'), 58);
  assert.equal(midiToFreq(69), 440);
  assert.throws(() => noteToMidi('H4'));
});

test('chords parse into a root and a shape', () => {
  assert.deepEqual(parseChord('Am'), { root: 9, tones: [0, 3, 7] });
  assert.deepEqual(parseChord('F#m'), { root: 6, tones: [0, 3, 7] });
  assert.deepEqual(parseChord('Bb'), { root: 10, tones: [0, 4, 7] });
  assert.throws(() => parseChord('Xsus'));
});

for (const [name, song] of Object.entries(SONGS)) {
  test(`song "${name}" compiles into whole bars with notes in a sensible range`, () => {
    const c = compileSong(song, name);
    assert.ok(c.length > 0 && c.length % STEPS_PER_BAR === 0);
    for (const v of c.voices) {
      assert.equal(v.events.length, c.length, `${name}: every voice spans the whole song`);
      for (const e of v.events) {
        if (!e || v.kind === 'drums') continue;
        assert.ok(e.midi >= 28 && e.midi <= 108, `${name}: note ${e.midi} out of range`);
        assert.ok(e.len >= 1);
      }
    }
    assert.ok(c.voices.some((v) => v.events.some(Boolean)), `${name}: not silent`);
  });
}

test('a bar with the wrong number of steps is rejected', () => {
  assert.throws(() => compileSong({ bpm: 120, chords: ['C'], lead: { bars: ['C5:4 D5:4'] } }), /expected 16/);
  assert.throws(() => compileSong({ bpm: 120, chords: ['C'], drums: { bars: ['k.h.'] } }), /expected 16/);
});

test('a hold extends the bass note before it, but not across a rest', () => {
  const c = compileSong({ bpm: 120, chords: ['C'], bass: { octave: 2, bars: ['R---.-5.........'] } });
  const bass = c.voices[0].events;
  assert.equal(bass[0].len, 4);
  assert.equal(bass[0].midi, 36); // C2
  assert.equal(bass[6].midi, 43); // G2, the fifth
  assert.equal(bass[6].len, 1);
});

test('every stage has its own track, plus menu, power-up, cutscene and jingles', () => {
  for (const phase of PHASES) assert.ok(SONGS[STAGE_TRACK[phase.id]], `no track for ${phase.id}`);
  for (const name of ['menu', 'power', 'intermission']) assert.equal(getSongs()[name].loop, true);
  for (const name of ['ready', 'stageClear', 'gameOver', 'victory', 'record']) assert.equal(getSongs()[name].loop, false);
});

// ------------------------------------------------------------ playback against a fake AudioContext

function fakeAudioContext() {
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} });
  const node = (extra = {}) => ({ connect() {}, disconnect() {}, start() {}, stop() {}, ...extra });
  const ctx = {
    currentTime: 0,
    state: 'running',
    created: 0,
    createOscillator: () => (ctx.created++, node({ frequency: param(), type: 'sine', setPeriodicWave() {} })),
    createGain: () => node({ gain: param() }),
    createBiquadFilter: () => node({ frequency: param(), Q: param(), type: 'lowpass' }),
    createBufferSource: () => node({ buffer: null }),
    createPeriodicWave: () => ({})
  };
  return ctx;
}

test('every song plays through and loops without throwing', (t) => {
  t.mock.timers.enable({ apis: ['setInterval', 'setTimeout'] });
  const ctx = fakeAudioContext();
  const player = new MusicPlayer(ctx, { connect() {} }, {});
  for (const name of Object.keys(SONGS)) {
    player.play(name);
    assert.equal(player.playing, name);
    const song = getSongs()[name];
    const seconds = (song.length * 60) / song.bpm / 4;
    for (let s = 0; s < seconds * 2 + 1; s += 0.05) {
      ctx.currentTime += 0.05;
      player.schedule();
    }
    if (song.loop) assert.equal(player.playing, name, `${name} keeps looping`);
    else assert.equal(player.playing, null, `${name} ends by itself`);
  }
  player.stop();
  assert.ok(ctx.created > 100, 'notes were scheduled');
});

test('switching to the song already playing does not restart it', (t) => {
  t.mock.timers.enable({ apis: ['setInterval', 'setTimeout'] });
  const ctx = fakeAudioContext();
  const player = new MusicPlayer(ctx, { connect() {} }, {});
  player.play('classic');
  ctx.currentTime = 1;
  player.schedule();
  const step = player.current.step;
  player.play('classic');
  assert.equal(player.current.step, step);
  player.stop();
});
