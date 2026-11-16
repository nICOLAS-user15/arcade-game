/**
 * Sound effects and music, synthesized with the Web Audio API (no audio files), and
 * haptic feedback through the Vibration API where available.
 *
 * Routing: effects -> sfx bus ------------------------\
 *          music   -> music bus -> pause filter --------> master -> speakers
 * The music bus is quieter so effects always read clearly over the soundtrack.
 */

import { MusicPlayer } from './chiptune.js';

const MUSIC_LEVEL = 0.4;

export class SoundController {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicEnabled = true;
    this.wantedMusic = null;
    this.lastWaka = 0;
    this.wakaHigh = false;

    // Silence everything while the app is in the background (phones keep tabs alive)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!this.ctx) return;
        if (document.hidden) this.ctx.suspend().catch(() => {});
        else this.ctx.resume().catch(() => {});
      });
    }
  }

  /** Must be called from a user gesture the first time (browser autoplay policy). */
  init() {
    if (!this.ctx) {
      const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioCtx) return;
      try {
        this.ctx = new AudioCtx();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.9;
        this.master.connect(this.ctx.destination);

        this.sfx = this.ctx.createGain();
        this.sfx.connect(this.master);

        this.musicFilter = this.ctx.createBiquadFilter();
        this.musicFilter.type = 'lowpass';
        this.musicFilter.frequency.value = 20000;
        this.musicFilter.connect(this.master);
        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = MUSIC_LEVEL;
        this.musicBus.connect(this.musicFilter);

        this.noise = this.makeNoise();
        this.music = new MusicPlayer(this.ctx, this.musicBus, this.noise);
      } catch {
        this.ctx = null;
        return;
      }
    }
    // iOS Safari reports 'interrupted' after a call or app switch, not 'suspended'
    if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
    if (this.wantedMusic && this.musicEnabled && !this.music.playing) this.music.play(this.wantedMusic);
  }

  makeNoise() {
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  setEnabled(on) {
    this.enabled = on;
  }

  // ------------------------------------------------------------------ music

  setMusicEnabled(on) {
    if (this.musicEnabled === on) return;
    this.musicEnabled = on;
    if (!this.music) return;
    if (on && this.wantedMusic) this.music.play(this.wantedMusic);
    else if (!on) this.music.stop();
  }

  /**
   * Switches the soundtrack. Looping songs are remembered, so they come back when music is
   * re-enabled or audio is unlocked; jingles play once and are not.
   */
  playMusic(name, { loop = true } = {}) {
    this.wantedMusic = loop ? name : null;
    if (!this.music || !this.musicEnabled) return;
    if (!loop && this.music.playing === name) this.music.stop(); // replay a jingle from the top
    this.music.play(name);
  }

  playJingle(name) {
    this.playMusic(name, { loop: false });
  }

  stopMusic() {
    this.wantedMusic = null;
    this.music?.stop();
  }

  /** 1 = normal speed; the game speeds the stage music up a little as the last pellets go. */
  setMusicTempo(mul) {
    this.music?.setTempo(mul);
  }

  /** Muffled and quieter while paused, like hearing the game through a door. */
  duckMusic(on) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.musicFilter.frequency.setTargetAtTime(on ? 650 : 20000, t, 0.08);
    this.musicBus.gain.setTargetAtTime(on ? MUSIC_LEVEL * 0.6 : MUSIC_LEVEL, t, 0.08);
  }

  // ------------------------------------------------------------------ building blocks

  /** One enveloped oscillator note. `freqEnd` adds an exponential pitch glide. */
  tone({ type = 'triangle', freq, freqEnd, start = 0, dur = 0.1, vol = 0.15 }) {
    if (!this.enabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime + start;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(this.sfx);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    } catch {
      /* audio is best-effort */
    }
  }

  /** Filtered noise with a sweeping cutoff: wind, whooshes, sparkle. */
  noiseSweep({ from, to, start = 0, dur = 0.2, vol = 0.12, type = 'bandpass', q = 1.2 }) {
    if (!this.enabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime + start;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noise;
      const filter = this.ctx.createBiquadFilter();
      filter.type = type;
      filter.Q.value = q;
      filter.frequency.setValueAtTime(from, t);
      filter.frequency.exponentialRampToValueAtTime(to, t + dur);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(vol, t + dur * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfx);
      src.start(t, Math.random() * 0.5);
      src.stop(t + dur + 0.02);
    } catch {
      /* audio is best-effort */
    }
  }

  arpeggio(notes, { type = 'triangle', gap = 0.06, dur = 0.12, vol = 0.18, start = 0 } = {}) {
    notes.forEach((freq, i) => this.tone({ type, freq, start: start + i * gap, dur, vol }));
  }

  // ------------------------------------------------------------------ gameplay

  waka() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastWaka < 0.11) return;
    this.lastWaka = now;
    this.wakaHigh = !this.wakaHigh;
    const f = this.wakaHigh ? 620 : 420;
    this.tone({ freq: f, freqEnd: f * 0.7, dur: 0.08, vol: 0.12 });
  }

  power() {
    this.tone({ type: 'sine', freq: 260, freqEnd: 820, dur: 0.25, vol: 0.18 });
    this.tone({ type: 'square', freq: 130, freqEnd: 410, dur: 0.25, vol: 0.05 });
  }

  /** Each ghost eaten in the same power-up sounds a step higher than the last. */
  eatGhost(combo = 1) {
    const k = 2 ** (((Math.min(combo, 4) - 1) * 3) / 12); // up a minor third per ghost
    this.arpeggio([350, 520, 720, 960].map((f) => f * k), { type: 'square', gap: 0.05, dur: 0.07, vol: 0.14 });
  }

  /** The eyes of an eaten ghost racing home: a quick rising chirp, repeated by the game. */
  retreat() {
    this.tone({ type: 'square', freq: 900, freqEnd: 1500, dur: 0.06, vol: 0.035 });
  }

  /** Warns that the power-up is about to run out. */
  powerWarning() {
    this.tone({ type: 'square', freq: 1046.5, dur: 0.05, vol: 0.05 });
    this.tone({ type: 'square', freq: 784, start: 0.07, dur: 0.05, vol: 0.05 });
  }

  fruit() {
    this.arpeggio([523.25, 659.25, 783.99, 1046.5], { gap: 0.06, dur: 0.12, vol: 0.2 });
  }

  /** A bonus fruit appeared on the board. */
  fruitSpawn() {
    this.arpeggio([1318.5, 1568, 2093], { type: 'sine', gap: 0.05, dur: 0.1, vol: 0.08 });
    this.noiseSweep({ from: 6000, to: 12000, dur: 0.2, vol: 0.03, type: 'highpass' });
  }

  teleport() {
    this.tone({ type: 'sine', freq: 800, freqEnd: 200, dur: 0.18, vol: 0.18 });
    this.tone({ type: 'sine', freq: 200, freqEnd: 900, start: 0.18, dur: 0.14, vol: 0.18 });
    this.noiseSweep({ from: 400, to: 4000, dur: 0.3, vol: 0.06 });
  }

  /** Passing through a side tunnel. */
  whoosh() {
    this.noiseSweep({ from: 300, to: 2500, dur: 0.22, vol: 0.09 });
  }

  /** A falling, wobbling run of notes, then a low thud. */
  death() {
    const notes = [784, 740, 698, 659, 622, 587, 554, 523, 494, 466];
    notes.forEach((f, i) => this.tone({ type: 'square', freq: f, freqEnd: f * 0.82, start: i * 0.07, dur: 0.07, vol: 0.09 }));
    this.tone({ type: 'sawtooth', freq: 330, freqEnd: 40, start: 0.72, dur: 0.45, vol: 0.14 });
    this.noiseSweep({ from: 3000, to: 200, start: 0.72, dur: 0.4, vol: 0.06, type: 'lowpass', q: 0.7 });
  }

  bigChomp() {
    this.tone({ type: 'sawtooth', freq: 160, freqEnd: 50, dur: 0.18, vol: 0.25 });
  }

  bonusCoin() {
    this.tone({ type: 'sine', freq: 987.77, dur: 0.05, vol: 0.18 });
    this.tone({ type: 'sine', freq: 1318.51, start: 0.05, dur: 0.14, vol: 0.18 });
  }

  extraLife() {
    this.arpeggio([659.25, 783.99, 1318.5, 1046.5, 1318.5, 1568], { gap: 0.07, dur: 0.14, vol: 0.18 });
  }

  // ------------------------------------------------------------------ interface

  pauseIn() {
    this.tone({ type: 'square', freq: 660, dur: 0.06, vol: 0.06 });
    this.tone({ type: 'square', freq: 440, start: 0.07, dur: 0.09, vol: 0.06 });
  }

  pauseOut() {
    this.tone({ type: 'square', freq: 440, dur: 0.06, vol: 0.06 });
    this.tone({ type: 'square', freq: 660, start: 0.07, dur: 0.09, vol: 0.06 });
  }

  /** Small UI tick for menu interaction. */
  click() {
    this.tone({ type: 'square', freq: 740, freqEnd: 520, dur: 0.05, vol: 0.06 });
  }

  /** Slightly higher tick for hover/focus changes in the menu. */
  hover() {
    this.tone({ type: 'sine', freq: 880, dur: 0.03, vol: 0.035 });
  }

  /** A dialog or panel opening. */
  open() {
    this.tone({ type: 'triangle', freq: 520, freqEnd: 880, dur: 0.09, vol: 0.08 });
  }

  close() {
    this.tone({ type: 'triangle', freq: 880, freqEnd: 520, dur: 0.09, vol: 0.06 });
  }
}

/** Vibration patterns, in milliseconds. */
export const HAPTICS = Object.freeze({
  tap: 8,
  power: 20,
  ghost: [25, 20, 35],
  fruit: 15,
  death: [90, 50, 160],
  stageClear: [30, 40, 30, 40, 70],
  extraLife: [20, 30, 20, 30, 60]
});

export class Haptics {
  constructor() {
    this.enabled = true;
  }

  get supported() {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  }

  setEnabled(on) {
    this.enabled = on;
  }

  play(pattern) {
    if (!this.enabled || !this.supported) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
}
