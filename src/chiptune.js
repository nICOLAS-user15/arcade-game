/**
 * Chiptune music engine on the Web Audio API: songs are data (songs.js), synthesized live,
 * so the soundtrack weighs nothing and works offline.
 *
 * compileSong() is pure (unit-tested in Node); MusicPlayer needs a real AudioContext.
 * Scheduling uses the usual look-ahead pattern: a timer wakes up every 25 ms and queues
 * the notes of the next ~120 ms on the audio clock, so timing never depends on the frame rate.
 */

import { SONGS } from './songs.js';

export const STEPS_PER_BAR = 16;
const LOOKAHEAD = 0.12;
const TIMER_MS = 25;

const NOTE_INDEX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const CHORD_SHAPES = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  7: [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  dim: [0, 3, 6]
};
const BASS_DEGREE = { R: 0, 3: 1, 5: 2, O: 'octave' };
const DRUMS = new Set(['k', 's', 'h', 'o']);

/** "C#5" -> MIDI note number (C4 = 60). */
export function noteToMidi(name) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`bad note "${name}"`);
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return (Number(m[3]) + 1) * 12 + NOTE_INDEX[m[1]] + acc;
}

export const midiToFreq = (midi) => 440 * 2 ** ((midi - 69) / 12);

/** "F#m" -> { root: pitch class 0-11, tones: semitone offsets }. */
export function parseChord(name) {
  const m = /^([A-G])([#b]?)(maj7|m7|m|7|dim)?$/.exec(name);
  if (!m) throw new Error(`bad chord "${name}"`);
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return { root: (NOTE_INDEX[m[1]] + acc + 12) % 12, tones: CHORD_SHAPES[m[3] || ''] };
}

function checkBar(bar, steps, where) {
  if (steps !== STEPS_PER_BAR) throw new Error(`${where}: bar "${bar}" has ${steps} steps, expected ${STEPS_PER_BAR}`);
}

/** Lead line tokens -> one entry per step: { midi, len } at note starts, null elsewhere. */
function compileLead(bars, where) {
  const out = [];
  bars.forEach((bar) => {
    const start = out.length;
    for (const token of bar.trim().split(/\s+/)) {
      const [name, count = '1'] = token.split(':');
      const len = Number(count);
      if (!Number.isInteger(len) || len < 1) throw new Error(`${where}: bad length in "${token}"`);
      out.push(name === '.' ? null : { midi: noteToMidi(name), len });
      for (let i = 1; i < len; i++) out.push(null);
    }
    checkBar(bar, out.length - start, where);
  });
  return out;
}

/** Bass/arp chars, relative to the chord playing at each step. */
function compileRelative(bars, chordAt, octave, kind, where) {
  const out = [];
  let held = null; // note a "-" extends; a rest breaks the chain
  bars.forEach((bar) => {
    checkBar(bar, bar.length, where);
    for (const ch of bar) {
      const step = out.length;
      if (ch === '.') {
        held = null;
        out.push(null);
      } else if (ch === '-') {
        if (held) held.len++;
        out.push(null);
      } else {
        const chord = chordAt(step);
        const base = (octave + 1) * 12 + chord.root;
        let offset;
        if (kind === 'bass') {
          if (!(ch in BASS_DEGREE)) throw new Error(`${where}: bad bass step "${ch}"`);
          const d = BASS_DEGREE[ch];
          offset = d === 'octave' ? 12 : chord.tones[d];
        } else {
          const i = Number(ch);
          if (!(i >= 0 && i <= 3)) throw new Error(`${where}: bad arp step "${ch}"`);
          offset = i === 3 ? 12 : chord.tones[i % chord.tones.length];
        }
        held = { midi: base + offset, len: 1 };
        out.push(held);
      }
    }
  });
  return out;
}

function compileDrums(bars, where) {
  const out = [];
  for (const bar of bars) {
    checkBar(bar, bar.length, where);
    for (const ch of bar) {
      if (ch !== '.' && !DRUMS.has(ch)) throw new Error(`${where}: bad drum "${ch}"`);
      out.push(ch === '.' ? null : ch);
    }
  }
  return out;
}

/** Repeats a voice's pattern to fill the whole song. */
function fill(events, length) {
  if (!events.length) return new Array(length).fill(null);
  const out = [];
  for (let i = 0; i < length; i++) {
    const e = events[i % events.length];
    out.push(e && typeof e === 'object' ? { ...e } : e);
  }
  return out;
}

/** Turns a song definition into per-step events for every voice. */
export function compileSong(song, name = 'song') {
  const chordBars = song.chords.map((bar) => bar.trim().split(/\s+/).map(parseChord));
  const chordAt = (step) => {
    const bar = chordBars[Math.floor(step / STEPS_PER_BAR) % chordBars.length];
    const within = step % STEPS_PER_BAR;
    return bar[Math.floor((within * bar.length) / STEPS_PER_BAR)];
  };

  const barsOf = (v) => (v ? v.bars.length : 0);
  const bars = Math.max(song.chords.length, barsOf(song.lead), barsOf(song.bass), barsOf(song.arp), barsOf(song.drums));
  const length = bars * STEPS_PER_BAR;
  const voices = [];

  if (song.lead) voices.push({ ...song.lead, kind: 'tone', events: fill(compileLead(song.lead.bars, `${name}.lead`), length) });
  for (const key of ['bass', 'arp']) {
    const v = song[key];
    if (!v) continue;
    // Expand the pattern over the whole song first, so each bar follows its own chord
    const pattern = [];
    for (let b = 0; b < bars; b++) pattern.push(v.bars[b % v.bars.length]);
    voices.push({ ...v, kind: 'tone', events: compileRelative(pattern, chordAt, v.octave ?? 2, key, `${name}.${key}`) });
  }
  if (song.drums) voices.push({ kind: 'drums', vol: song.drums.vol, events: fill(compileDrums(song.drums.bars, `${name}.drums`), length) });

  return { name, bpm: song.bpm, loop: song.loop !== false, length, voices };
}

let compiled = null;
/** All songs, compiled once on first use. */
export function getSongs() {
  if (!compiled) compiled = Object.fromEntries(Object.entries(SONGS).map(([k, s]) => [k, compileSong(s, k)]));
  return compiled;
}

// ============================================================ playback (browser only)

/** Narrow pulse waves give the classic 8-bit timbre that plain square waves lack. */
function pulseWave(ctx, duty) {
  const n = 64;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let i = 1; i < n; i++) real[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
  return ctx.createPeriodicWave(real, imag);
}

export class MusicPlayer {
  /** `out` is the music bus; `noise` a buffer of white noise for the drums. */
  constructor(ctx, out, noise) {
    this.ctx = ctx;
    this.out = out;
    this.noise = noise;
    this.waves = { pulse12: pulseWave(ctx, 0.125), pulse25: pulseWave(ctx, 0.25) };
    this.current = null;
    this.tempo = 1;
    this.timer = null;
    /** Where each looping song was left when another one took over (e.g. the power-up music). */
    this.positions = {};
  }

  get playing() {
    return this.current?.name || null;
  }

  /** With `resume`, a looping song continues from where it was interrupted instead of bar 1. */
  play(name, { resume = false } = {}) {
    if (this.current?.name === name) return;
    const song = getSongs()[name];
    if (!song) return;
    const prev = this.current;
    if (prev?.song.loop) this.positions[prev.name] = prev.step;
    this.fadeOut();
    const gain = this.ctx.createGain();
    gain.connect(this.out);
    const step = resume ? (this.positions[name] || 0) % song.length : 0;
    this.current = { name, song, step, next: this.ctx.currentTime + 0.05, gain };
    if (!this.timer) this.timer = setInterval(() => this.schedule(), TIMER_MS);
    this.schedule();
  }

  /** Stops the music and forgets where every song was. */
  stop() {
    this.positions = {};
    this.fadeOut();
  }

  /** Fades the current song out quickly (notes already queued are silenced too). */
  fadeOut() {
    const cur = this.current;
    this.current = null;
    if (cur) {
      try {
        cur.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      } catch { /* closed context */ }
      setTimeout(() => cur.gain.disconnect(), 600);
    }
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Playback speed multiplier, e.g. 1.08 to raise tension near the end of a stage. */
  setTempo(mul) {
    this.tempo = mul;
  }

  stepDuration(song) {
    return 60 / (song.bpm * this.tempo) / 4;
  }

  schedule() {
    const cur = this.current;
    if (!cur || this.ctx.state !== 'running') return;
    const horizon = this.ctx.currentTime + LOOKAHEAD;
    // After a long stall (tab in background) jump ahead instead of playing a burst of old notes
    if (cur.next < this.ctx.currentTime - 0.2) cur.next = this.ctx.currentTime + 0.02;
    while (cur.next < horizon) {
      if (cur.step >= cur.song.length) {
        if (!cur.song.loop) {
          this.current = null; // queued notes finish on their own
          setTimeout(() => cur.gain.disconnect(), 4000);
          return;
        }
        cur.step = 0;
      }
      const dur = this.stepDuration(cur.song);
      for (const voice of cur.song.voices) {
        const e = voice.events[cur.step];
        if (!e) continue;
        if (voice.kind === 'drums') this.drum(e, cur.next, voice.vol, cur.gain);
        else this.note(voice, e.midi, cur.next, e.len * dur, cur.gain);
      }
      cur.next += dur;
      cur.step++;
    }
  }

  note(voice, midi, t, dur, dest) {
    const ctx = this.ctx;
    const freq = midiToFreq(midi);
    const osc = ctx.createOscillator();
    const wave = this.waves[voice.wave];
    if (wave) osc.setPeriodicWave(wave);
    else osc.type = voice.wave || 'square';
    osc.frequency.setValueAtTime(freq, t);

    const g = ctx.createGain();
    const vol = voice.vol ?? 0.1;
    const end = t + Math.max(0.03, dur - 0.02);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.setTargetAtTime(vol * 0.72, t + 0.01, 0.09); // decay to sustain
    g.gain.setTargetAtTime(0.0001, end, 0.018); // release

    if (voice.vibrato && dur > 0.28) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = 5.5;
      depth.gain.setValueAtTime(0, t);
      depth.gain.linearRampToValueAtTime(freq * 0.008, t + 0.25);
      lfo.connect(depth);
      depth.connect(osc.frequency);
      lfo.start(t);
      lfo.stop(end + 0.1);
    }
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(end + 0.1);
  }

  drum(kind, t, vol, dest) {
    const ctx = this.ctx;
    if (kind === 'k') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      g.gain.setValueAtTime(vol * 0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(g);
      g.connect(dest);
      osc.start(t);
      osc.stop(t + 0.18);
      return;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();
    let len;
    if (kind === 's') {
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      filter.Q.value = 0.8;
      len = 0.13;
      g.gain.setValueAtTime(vol * 0.45, t);
    } else {
      filter.type = 'highpass';
      filter.frequency.value = 7000;
      len = kind === 'o' ? 0.14 : 0.035;
      g.gain.setValueAtTime(vol * 0.18, t);
    }
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    src.connect(filter);
    filter.connect(g);
    g.connect(dest);
    src.start(t, Math.random() * 0.5);
    src.stop(t + len + 0.02);
  }
}
