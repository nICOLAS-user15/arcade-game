/**
 * Input: keyboard, swipe/tap on the board, on-screen D-pad and gamepad.
 * Everything is translated into a handful of calls on the Game.
 */

import { DIRS } from './config.js';
import { HAPTICS } from './audio.js';
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
    this.bindKeyboard();
    this.bindBoard();
    this.bindDpad();
    window.addEventListener('gamepadconnected', () => this.app.toast(`🎮 ${t('toast.gamepad')}`));
  }

  get dialogOpen() {
    return !!document.querySelector('dialog[open]');
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
          g.togglePause();
          break;
        default:
      }
    });
  }

  boardCenter() {
    const r = this.game.canvas.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  }

  /** Keyboard behaviour while a pause/briefing/result modal is open: focus stays inside it. */
  overlayKeys(e) {
    const g = this.game;
    const modal = [...g.overlay.children].find((m) => !m.hidden);
    const buttons = modal ? [...modal.querySelectorAll('button:not([hidden])')] : [];

    if ((e.code === 'Escape' || e.code === 'KeyP') && g.state === 'PAUSED') {
      e.preventDefault();
      g.resume();
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
      this.app.haptics.play(HAPTICS.tap);
      this.game.steer(DIRS[btn.dataset.dir]);
    };
    this.game.$('dpad').querySelectorAll('[data-dir]').forEach((btn) => {
      // pointerdown (not click) removes the touch delay that matters in a game
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        steer(btn);
      });
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
    if (dir && dir !== this.padDir && g.screen === 'game' && !g.overlayOpen) g.steer(dir);
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
    if (g.screen !== 'game') return;
    if (start) g.togglePause();
    if (a) {
      // A / Cross: collect cutscene bonus, or press the focused modal button
      if (g.state === 'INTERMISSION') g.onBoardTap(...this.boardCenter());
      else if (g.overlayOpen) document.activeElement?.click?.();
    }
    if (b && g.state === 'PAUSED') g.resume();
  }
}
