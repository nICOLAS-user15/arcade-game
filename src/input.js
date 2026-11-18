/**
 * Input: keyboard, swipe/tap on the board, on-screen D-pad and gamepad.
 * Everything is translated into a handful of calls on the Game.
 */

import { DIRS } from './config.js';
import { t } from './i18n.js';

const KEY_DIRS = {
  ArrowUp: DIRS.UP, KeyW: DIRS.UP,
  ArrowDown: DIRS.DOWN, KeyS: DIRS.DOWN,
  ArrowLeft: DIRS.LEFT, KeyA: DIRS.LEFT,
  ArrowRight: DIRS.RIGHT, KeyD: DIRS.RIGHT
};

export class Input {
  constructor(game) {
    this.game = game;
    this.app = game.app;
    this.swipe = null;
    this.padPrev = {};
    this.padDir = null;
    this.keysDown = new Set(); // direction keys currently held
    this.dpadHeld = null; // D-pad arrow currently pressed
    this.bindKeyboard();
    this.bindKeyRelease();
    this.bindBoard();
    this.bindDpad();
    window.addEventListener('gamepadconnected', () => this.app.toast(`🎮 ${t('toast.gamepad')}`));
  }

  get dialogOpen() {
    return !!document.querySelector('dialog[open]');
  }

  /** True while `dir` is held on the keyboard, the on-screen D-pad or the gamepad. */
  isHeld(dir) {
    if (this.dpadHeld === dir || this.padDir === dir || this.swipe?.dir === dir) return true;
    for (const code of this.keysDown) if (KEY_DIRS[code] === dir) return true;
    return false;
  }

  // ------------------------------------------------------------ keyboard

  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const g = this.game;
      this.app.sound.init();
      // Typing a name must not trigger shortcuts (M, F, WASD, Space); Tab still reaches the modal trap
      if (e.target?.matches?.('input, textarea') && e.code !== 'Tab') return;

      if (e.code === 'KeyF' && !this.dialogOpen) {
        e.preventDefault();
        g.toggleFullscreen();
        return;
      }
      if (e.code === 'KeyM' && !this.dialogOpen) {
        g.toggleSound();
        return;
      }
      if (g.screen !== 'game' || this.dialogOpen) return;

      const onButton = e.target && e.target.tagName === 'BUTTON';

      if (g.overlayOpen) {
        this.overlayKeys(e);
        return;
      }

      const dir = KEY_DIRS[e.code];
      if (dir) {
        e.preventDefault();
        this.keysDown.add(e.code);
        g.steer(dir);
        return;
      }

      switch (e.code) {
        case 'Space':
          if (onButton) return; // let a focused button receive its click
          e.preventDefault();
          if (e.repeat) return;
          if (g.state === 'INTERMISSION') g.onBoardTap(...this.boardCenter());
          else g.togglePause();
          break;
        case 'Enter':
        case 'NumpadEnter':
          if (onButton) return;
          if (g.state === 'INTERMISSION') g.skipCutscene();
          break;
        case 'KeyP':
          if (e.repeat) return;
          if (g.state === 'INTERMISSION') g.skipCutscene();
          else g.togglePause();
          break;
        case 'Escape':
          if (e.repeat) return; // holding Esc must not flicker between paused and playing
          if (g.state === 'INTERMISSION') g.skipCutscene();
          else g.togglePause();
          break;
        default:
      }
    });
  }

  /** Releases held direction keys (and everything when the window loses focus). */
  bindKeyRelease() {
    window.addEventListener('keyup', (e) => this.keysDown.delete(e.code));
    window.addEventListener('blur', () => {
      this.keysDown.clear();
      this.dpadHeld = null;
    });
  }

  boardCenter() {
    const r = this.game.canvas.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  }

  /** Focusable controls of the modal open over the board (pause, briefing, result, name). */
  overlayControls() {
    const modal = [...this.game.overlay.children].find((m) => !m.hidden);
    return modal ? [...modal.querySelectorAll('input:not([hidden]), button:not([hidden])')] : [];
  }

  /** Moves focus to the next/previous control of the open modal (keyboard arrows, gamepad). */
  moveOverlayFocus(step) {
    const list = this.overlayControls();
    if (!list.length) return false;
    const i = list.indexOf(document.activeElement);
    list[(i + step + list.length) % list.length].focus();
    return true;
  }

  /** Keyboard behaviour while a pause/briefing/result modal is open: focus stays inside it. */
  overlayKeys(e) {
    const g = this.game;
    const buttons = this.overlayControls();

    if ((e.code === 'Escape' || e.code === 'KeyP') && g.state === 'PAUSED') {
      e.preventDefault();
      if (!e.repeat) g.resume(); // the key that paused, held down, must not resume
      return;
    }
    if (!buttons.length) return;

    const i = buttons.indexOf(document.activeElement);
    const focus = (index) => {
      e.preventDefault();
      buttons[(index + buttons.length) % buttons.length].focus();
    };
    switch (e.code) {
      case 'ArrowDown':
      case 'ArrowRight':
        focus(i + 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        focus(i - 1);
        break;
      case 'Tab':
        // Keep Tab inside the modal instead of reaching the toolbar behind it
        if (!e.shiftKey && i === buttons.length - 1) focus(0);
        else if (e.shiftKey && i <= 0) focus(buttons.length - 1);
        break;
      default:
    }
  }

  // ------------------------------------------------------------ swipe and taps on the board

  bindBoard() {
    const el = this.game.$('canvasContainer');
    el.addEventListener('contextmenu', (e) => e.preventDefault());

    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest && e.target.closest('.overlay')) return;
      this.app.sound.init();
      if (this.game.state === 'INTERMISSION') {
        this.game.onBoardTap(e.clientX, e.clientY);
        return;
      }
      this.swipe = { x: e.clientX, y: e.clientY, id: e.pointerId };
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* not critical */
      }
    });

    el.addEventListener('pointermove', (e) => {
      const s = this.swipe;
      if (!s || s.id !== e.pointerId) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      const threshold = Math.max(16, Math.min(30, el.clientWidth * 0.07));
      if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? DIRS.RIGHT : DIRS.LEFT) : (dy > 0 ? DIRS.DOWN : DIRS.UP);
      this.game.steer(dir);
      s.dir = dir; // counts as held until the finger lifts
      // Re-anchor so several turns can be chained in one gesture
      s.x = e.clientX;
      s.y = e.clientY;
    });

    const end = (e) => {
      if (this.swipe && this.swipe.id === e.pointerId) this.swipe = null;
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  // ------------------------------------------------------------ on-screen D-pad

  bindDpad() {
    const steer = (btn) => {
      this.app.sound.init();
      this.game.steer(DIRS[btn.dataset.dir]);
    };
    this.game.$('dpad').querySelectorAll('[data-dir]').forEach((btn) => {
      // pointerdown (not click) removes the touch delay that matters in a game
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.dpadHeld = DIRS[btn.dataset.dir];
        steer(btn);
      });
      const release = () => {
        if (this.dpadHeld === DIRS[btn.dataset.dir]) this.dpadHeld = null;
      };
      for (const type of ['pointerup', 'pointercancel', 'pointerleave']) btn.addEventListener(type, release);
      // Keyboard / assistive-tech activation arrives as a click without a pointer
      btn.addEventListener('click', (e) => {
        if (e.detail === 0) steer(btn);
      });
    });
  }

  // ------------------------------------------------------------ gamepad

  pollGamepad() {
    if (!navigator.getGamepads) return;
    let pad = null;
    try {
      pad = [...navigator.getGamepads()].find((p) => p && p.connected);
    } catch {
      return;
    }
    if (!pad) return;
    const g = this.game;
    const btn = (i) => !!(pad.buttons[i] && pad.buttons[i].pressed);
    const ax = pad.axes[0] || 0;
    const ay = pad.axes[1] || 0;

    let dir = null;
    if (btn(12) || ay < -0.5) dir = DIRS.UP;
    else if (btn(13) || ay > 0.5) dir = DIRS.DOWN;
    else if (btn(14) || ax < -0.5) dir = DIRS.LEFT;
    else if (btn(15) || ax > 0.5) dir = DIRS.RIGHT;
    const newDir = dir && dir !== this.padDir;
    this.padDir = dir;

    const pressed = (i) => {
      const now = btn(i);
      const was = this.padPrev[i];
      this.padPrev[i] = now;
      return now && !was;
    };
    const start = pressed(9);
    const a = pressed(0);
    const b = pressed(1);
    // Settings (or any dialog) opened from the pause menu owns the input: nothing reaches the game
    if (g.screen !== 'game' || this.dialogOpen) return;

    if (g.overlayOpen) {
      // Modals: the pad moves between their buttons, A presses, B backs out
      if (newDir) this.moveOverlayFocus(dir === DIRS.UP || dir === DIRS.LEFT ? -1 : 1);
      const naming = !g.$('initialsModal').hidden;
      if (g.overlayLocked) return; // the button that ended the run must not also skip its result
      if (a) {
        if (naming && document.activeElement?.tagName === 'INPUT') g.initialsActions?.save();
        else document.activeElement?.click?.();
      }
      if (b) {
        if (naming) g.initialsActions?.skip();
        else if (g.state === 'PAUSED') g.resume();
      }
      if (start && g.state === 'PAUSED') g.resume();
      return;
    }

    if (g.state === 'INTERMISSION') {
      // A / Cross collects the bonus; B or Start skips the cutscene
      if (a) g.onBoardTap(...this.boardCenter());
      if (b || start) g.skipCutscene();
      return;
    }
    if (newDir) g.steer(dir);
    if (start) g.togglePause();
  }
}
