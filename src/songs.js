/**
 * Original chiptune soundtrack, written as data and compiled by chiptune.js.
 *
 * Every voice is a list of bars of 16 steps (sixteenth notes):
 *   lead   note tokens: "E5:4" = E5 held for 4 steps, ".:2" = 2 steps of rest, "C#6" = 1 step
 *   bass   one char per step relative to the bar's chord: R root, 3 third, 5 fifth, O octave, - hold, . rest
 *   arp    one char per step: 0-3 = chord tone index (3 is the octave), - hold, . rest
 *   drums  one char per step: k kick, s snare, h closed hat, o open hat, . rest
 * `chords` gives one chord per bar ("Dm G" splits the bar in two).
 * Voices loop independently over their own length; jingles (loop: false) play once.
 */

export const SONGS = {
  // ------------------------------------------------------------- menu: calm synthwave in A minor
  menu: {
    bpm: 96,
    loop: true,
    chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'E'],
    lead: {
      wave: 'pulse25', vol: 0.11, vibrato: true,
      bars: [
        'E5:4 A5:2 B5:2 C6:4 B5:2 A5:2', 'A5:6 G5:2 F5:4 E5:4', 'E5:4 G5:2 E5:2 C5:4 D5:2 E5:2', 'D5:8 .:4 B4:2 C5:2',
        'E5:4 A5:2 B5:2 C6:4 D6:2 E6:2', 'C6:6 B5:2 A5:4 C6:4', 'B5:4 A5:2 G5:2 B5:4 D6:4', 'B5:2 G#5:2 E5:4 .:8'
      ]
    },
    bass: { wave: 'triangle', vol: 0.22, octave: 2, bars: ['R-----R-5---R---'] },
    arp: { wave: 'pulse12', vol: 0.045, octave: 4, bars: ['0.1.2.1.0.1.2.3.'] },
    drums: { vol: 0.5, bars: ['k...h...s...h...', 'k...h.k.s...h.h.'] }
  },

  // ------------------------------------------------------------- stage 1: bright and bouncy, C major
  classic: {
    bpm: 128,
    loop: true,
    chords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm G', 'C'],
    lead: {
      wave: 'pulse25', vol: 0.1, vibrato: true,
      bars: [
        'C5:2 E5:2 G5:2 E5:2 C6:4 G5:4', 'A5:2 G5:2 E5:2 C5:2 E5:4 .:4', 'F5:2 A5:2 C6:2 A5:2 F5:2 G5:2 A5:4', 'G5:4 B5:2 D6:2 B5:4 .:2 G5:2',
        'C6:2 B5:2 C6:2 G5:2 E5:2 G5:2 C6:4', 'E6:4 D6:2 C6:2 A5:4 C6:4', 'D6:2 C6:2 A5:2 F5:2 G5:2 B5:2 D6:4', 'C6:8 .:8'
      ]
    },
    bass: { wave: 'triangle', vol: 0.24, octave: 2, bars: ['R.R.5.R.O.R.5.R.'] },
    arp: { wave: 'pulse12', vol: 0.04, octave: 4, bars: ['0120012001200123'] },
    drums: { vol: 0.55, bars: ['k.h.s.h.k.khs.h.'] }
  },

  // ------------------------------------------------------------- stage 2: swinging forest groove, D dorian
  emerald: {
    bpm: 136,
    loop: true,
    chords: ['Dm', 'G', 'Dm', 'C', 'Bb', 'C', 'Dm', 'A'],
    lead: {
      wave: 'square', vol: 0.075, vibrato: true,
      bars: [
        'D5:3 F5:3 A5:2 G5:2 F5:2 E5:2 D5:2', 'B4:3 D5:3 G5:2 F5:2 E5:2 D5:4', 'D5:3 F5:3 A5:2 C6:4 A5:4', 'G5:3 E5:3 C5:2 E5:4 G5:4',
        'F5:3 D5:3 Bb4:2 D5:2 F5:2 Bb5:4', 'G5:3 E5:3 C5:2 E5:2 G5:2 C6:4', 'A5:4 F5:2 D5:2 F5:2 A5:2 D6:4', 'C#6:4 A5:4 E5:4 .:4'
      ]
    },
    bass: { wave: 'triangle', vol: 0.25, octave: 2, bars: ['R..R..R.5..5..O.'] },
    arp: { wave: 'pulse12', vol: 0.04, octave: 4, bars: ['0.2.1.2.0.2.1.3.'] },
    drums: { vol: 0.55, bars: ['k..hs.h.k.khs..h'] }
  },

  // ------------------------------------------------------------- stage 3: tense and driving, E phrygian
  crimson: {
    bpm: 144,
    loop: true,
    chords: ['Em', 'F', 'Em', 'D', 'C', 'D', 'Em', 'B'],
    lead: {
      wave: 'sawtooth', vol: 0.05, vibrato: true,
      bars: [
        'E5:2 .:2 E5:2 F5:2 G5:4 F5:2 E5:2', 'F5:2 .:2 F5:2 G5:2 A5:4 G5:2 F5:2', 'E5:2 G5:2 B5:2 E6:2 D6:2 B5:2 G5:4', 'F#5:4 A5:4 D6:4 C6:2 A5:2',
        'G5:2 E5:2 C5:2 E5:2 G5:4 C6:4', 'A5:2 F#5:2 D5:2 F#5:2 A5:4 D6:4', 'B5:4 G5:2 E5:2 F5:4 G5:4', 'F#5:4 D#5:4 B4:4 .:4'
      ]
    },
    bass: { wave: 'square', vol: 0.09, octave: 2, bars: ['R.R.R.R.R.R.5.O.'] },
    arp: { wave: 'pulse12', vol: 0.035, octave: 4, bars: ['0101212101012123'] },
    drums: { vol: 0.6, bars: ['k.hkskh.k.hkskhh'] }
  },

  // ------------------------------------------------------------- stage 4: heroic castle march, Bb major
  golden: {
    bpm: 140,
    loop: true,
    chords: ['Bb', 'F', 'Gm', 'Eb', 'Bb', 'F', 'Eb F', 'Bb'],
    lead: {
      wave: 'pulse25', vol: 0.1, vibrato: true,
      bars: [
        'F5:4 Bb5:2 C6:2 D6:6 C6:2', 'C6:4 A5:2 F5:2 A5:4 C6:4', 'D6:4 Bb5:2 G5:2 Bb5:2 D6:2 G6:4', 'G6:4 F6:2 Eb6:2 Bb5:8',
        'D6:2 C6:2 Bb5:2 F5:2 Bb5:4 D6:4', 'C6:2 A5:2 F5:2 A5:2 C6:4 F6:4', 'Eb6:4 D6:2 C6:2 C6:4 A5:4', 'Bb5:8 .:8'
      ]
    },
    bass: { wave: 'triangle', vol: 0.26, octave: 2, bars: ['R---5---R---O---'] },
    arp: { wave: 'pulse12', vol: 0.04, octave: 4, bars: ['0-1-2-1-0-1-2-3-'] },
    drums: { vol: 0.55, bars: ['k.h.s.hhk.k.s.hs'] }
  },

  // ------------------------------------------------------------- stage 5: fast arpeggios, F# minor
  quantum: {
    bpm: 152,
    loop: true,
    chords: ['F#m', 'D', 'A', 'E', 'F#m', 'D', 'E', 'C#'],
    lead: {
      wave: 'pulse25', vol: 0.095, vibrato: true,
      bars: [
        'F#5:2 A5:2 C#6:2 F#6:2 E6:2 C#6:2 A5:4', 'F#5:2 A5:2 D6:2 F#6:2 E6:2 D6:2 A5:4', 'E6:4 C#6:2 A5:2 E5:4 A5:4', 'G#5:4 B5:2 E6:2 D#6:4 B5:4',
        'C#6:2 B5:2 A5:2 F#5:2 A5:2 C#6:2 F#6:4', 'F#6:4 E6:2 D6:2 A5:4 D6:4', 'E6:2 D#6:2 E6:2 B5:2 G#5:4 B5:4', 'C#6:4 G#5:4 F5:4 .:4'
      ]
    },
    bass: { wave: 'triangle', vol: 0.26, octave: 2, bars: ['RR.RO.RR5.5RO.R.'] },
    arp: { wave: 'pulse12', vol: 0.04, octave: 4, bars: ['0123012301230123'] },
    drums: { vol: 0.6, bars: ['kkh.s.hkk.hks.hh'] }
  },

  // ------------------------------------------------------------- ghosts frightened: frantic and playful
  power: {
    bpm: 168,
    loop: true,
    chords: ['Gm', 'Gm', 'Eb', 'D'],
    lead: {
      wave: 'square', vol: 0.07,
      bars: [
        'G5 A5 Bb5 A5 G5:2 D5:2 G5 A5 Bb5 C6 D6:4', 'D6 C6 Bb5 A5 G5:2 D5:2 F#5:2 G5:2 .:4',
        'Eb6:2 D6:2 C6:2 Bb5:2 G5:2 Bb5:2 Eb6:4', 'D6:2 C6:2 Bb5:2 A5:2 F#5:4 D5:4'
      ]
    },
    bass: { wave: 'square', vol: 0.085, octave: 2, bars: ['R.O.R.O.R.O.R.O.'] },
    arp: { wave: 'pulse12', vol: 0.035, octave: 5, bars: ['0213021302130213'] },
    drums: { vol: 0.55, bars: ['khkhskhkkhkhskhs'] }
  },

  // ------------------------------------------------------------- cutscenes between stages
  intermission: {
    bpm: 116,
    loop: true,
    chords: ['F', 'Dm', 'Bb', 'C'],
    lead: {
      wave: 'pulse25', vol: 0.1, vibrato: true,
      bars: ['C5:2 F5:2 A5:2 F5:2 C6:4 A5:4', 'D5:2 F5:2 A5:2 D6:2 C6:4 A5:4', 'Bb5:4 A5:2 G5:2 F5:2 G5:2 A5:4', 'G5:4 E5:2 C5:2 E5:4 .:4']
    },
    bass: { wave: 'triangle', vol: 0.24, octave: 2, bars: ['R...5...R...5...'] },
    arp: { wave: 'pulse12', vol: 0.035, octave: 4, bars: ['..0...1...2...1.'] },
    drums: { vol: 0.45, bars: ['k...s.h.k.k.s.h.'] }
  },

  // ------------------------------------------------------------- jingles (play once)
  ready: {
    bpm: 152,
    loop: false,
    chords: ['C'],
    lead: { wave: 'pulse25', vol: 0.12, bars: ['C5 E5 G5 C6 .:2 G5 C6 E6:4 .:4'] },
    bass: { wave: 'triangle', vol: 0.25, octave: 2, bars: ['R...R...O-------'] },
    drums: { vol: 0.5, bars: ['k...k...s.s.s...'] }
  },

  stageClear: {
    bpm: 160,
    loop: false,
    chords: ['C'],
    lead: { wave: 'pulse25', vol: 0.12, bars: ['C5 E5 G5 C6 E6 G6 E6:2 F6:2 D6:2 C6:4'] },
    bass: { wave: 'triangle', vol: 0.25, octave: 2, bars: ['R.5.O.5.R...O---'] },
    drums: { vol: 0.5, bars: ['k.h.k.h.s.s.k...'] }
  },

  gameOver: {
    bpm: 100,
    loop: false,
    chords: ['C', 'Am'],
    lead: { wave: 'pulse25', vol: 0.11, vibrato: true, bars: ['G5:2 .:2 F#5:2 .:2 F5:2 .:2 E5:4', 'D#5:2 E5:2 C5:12'] },
    bass: { wave: 'triangle', vol: 0.24, octave: 2, bars: ['R...R...R...R...', 'R-----------....'] },
    drums: { vol: 0.4, bars: ['k...............', 'k...............'] }
  },

  victory: {
    bpm: 140,
    loop: false,
    chords: ['C', 'F', 'G', 'C'],
    lead: { wave: 'pulse25', vol: 0.12, vibrato: true, bars: ['G5:2 C6:2 E6:2 G6:6 E6:2 G6:2', 'A6:6 G6:2 F6:4 A6:4', 'G6:4 F6:2 E6:2 D6:4 B5:4', 'C6:16'] },
    bass: { wave: 'triangle', vol: 0.26, octave: 2, bars: ['R.R.5.R.O.R.5.R.', 'R.R.5.R.O.R.5.R.', 'R.R.5.R.O.R.5.R.', 'R---------------'] },
    arp: { wave: 'pulse12', vol: 0.04, octave: 4, bars: ['0123012301230123', '0123012301230123', '0123012301230123', '0...............'] },
    drums: { vol: 0.55, bars: ['k.h.s.h.k.h.s.h.', 'k.h.s.h.k.h.s.h.', 'k.h.s.h.k.khs.ss', 'k...............'] }
  },

  record: {
    bpm: 170,
    loop: false,
    chords: ['C', 'G C'],
    lead: { wave: 'pulse25', vol: 0.12, bars: ['E6 G6 C7:2 E6 G6 C7:2 G6:8', 'F6:2 E6:2 D6:2 B5:2 C6:8'] },
    bass: { wave: 'triangle', vol: 0.25, octave: 2, bars: ['R.5.O.5.R...R...', 'R...5...R-------'] },
    drums: { vol: 0.5, bars: ['k.h.k.h.s.s.ssss', 'k...s...k.......'] }
  }
};

/** Background track for each stage, by phase id (see PHASES in config.js). */
export const STAGE_TRACK = Object.freeze({
  classic: 'classic',
  emerald: 'emerald',
  crimson: 'crimson',
  golden: 'golden',
  quantum: 'quantum'
});
