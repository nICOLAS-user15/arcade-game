/**
 * Sound effects synthesized with the Web Audio API (no audio files) and
 * haptic feedback through the Vibration API where available.
 */

export class SoundController {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.lastWaka = 0;
    this.wakaHigh = false;
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
      } catch {
        this.ctx = null;
        return;
      }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  setEnabled(on) {
    this.enabled = on;
  }

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
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    } catch {
      /* audio is best-effort */
    }
  }

  arpeggio(notes, { type = 'triangle', gap = 0.06, dur = 0.12, vol = 0.18 } = {}) {
    notes.forEach((freq, i) => this.tone({ type, freq, start: i * gap, dur, vol }));
  }

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
  }

  eatGhost() {
    this.arpeggio([350, 520, 720, 960], { type: 'square', gap: 0.05, dur: 0.07, vol: 0.14 });
  }

  fruit() {
    this.arpeggio([523.25, 659.25, 783.99, 1046.5], { gap: 0.06, dur: 0.12, vol: 0.2 });
  }

  teleport() {
    this.tone({ type: 'sine', freq: 800, freqEnd: 200, dur: 0.18, vol: 0.18 });
    this.tone({ type: 'sine', freq: 200, freqEnd: 900, start: 0.18, dur: 0.14, vol: 0.18 });
  }

  death() {
    this.tone({ type: 'sawtooth', freq: 620, freqEnd: 40, dur: 0.7, vol: 0.2 });
  }

  stageClear() {
    this.arpeggio([261.6, 329.6, 392, 523.3, 659.3, 784, 1046.5], { gap: 0.11, dur: 0.22, vol: 0.2 });
  }

  bigChomp() {
    this.tone({ type: 'sawtooth', freq: 160, freqEnd: 50, dur: 0.18, vol: 0.25 });
  }

  bonusCoin() {
    this.tone({ type: 'sine', freq: 987.77, dur: 0.05, vol: 0.18 });
    this.tone({ type: 'sine', freq: 1318.51, start: 0.05, dur: 0.14, vol: 0.18 });
  }

  gameStart() {
    this.arpeggio([493.88, 987.77, 739.99, 622.25, 987.77, 739.99, 622.25], { gap: 0.08, dur: 0.11, vol: 0.16 });
  }

  extraLife() {
    this.arpeggio([659.25, 783.99, 1318.5, 1046.5, 1318.5, 1568], { gap: 0.07, dur: 0.14, vol: 0.18 });
  }

  /** Small UI tick for menu interaction. */
  click() {
    this.tone({ type: 'square', freq: 740, freqEnd: 520, dur: 0.05, vol: 0.06 });
  }

  /** Slightly higher tick for hover/focus changes in the menu. */
  hover() {
    this.tone({ type: 'sine', freq: 880, dur: 0.03, vol: 0.035 });
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
