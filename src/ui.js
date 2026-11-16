/**
 * Menu screen and dialogs: mode/difficulty pickers, the animated background,
 * the "How to play" tutorial, settings and the high-score table.
 */

import { DIFFICULTIES, GHOST_DEFS, PHASES, PHASE_COUNT } from './config.js';
import { t, formatNumber } from './i18n.js';
import { BOARD_SIZE } from './storage.js';
import { Starfield, AttractLane } from './menu-fx.js';
import { drawPacman, drawGhost, drawPowerPellet, drawPellet, drawEmoji } from './sprites.js';

/** Accessible segmented control (role=radiogroup) with arrow-key navigation. */
function bindRadioGroup(group, onSelect) {
  const radios = () => [...group.querySelectorAll('[role="radio"]')];
  group.addEventListener('click', (e) => {
    const btn = e.target.closest('[role="radio"]');
    if (btn) onSelect(btn);
  });
  group.addEventListener('keydown', (e) => {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.code in keys) || (e.code === 'ArrowUp' || e.code === 'ArrowDown') && group.dataset.vertical !== 'true') return;
    const list = radios();
    const i = list.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    e.stopPropagation();
    const next = list[(i + keys[e.code] + list.length) % list.length];
    next.focus();
    onSelect(next);
  });
}

function setChecked(group, isOn) {
  group.querySelectorAll('[role="radio"]').forEach((r) => {
    const on = isOn(r);
    r.setAttribute('aria-checked', String(on));
    r.tabIndex = on ? 0 : -1;
  });
}

export class MenuUI {
  constructor(app, game) {
    this.app = app;
    this.game = game;
    this.$ = app.$;
    this.root = this.$('menu');
    this.step = 0;
    this.startAfterHowTo = false;
    this.resetArmed = null;
    this.raf = 0;
    this.lastPreview = 0;
    this.boardMode = app.settings.mode;
    this.boardDiff = app.settings.difficulty;

    this.stars = new Starfield(this.$('menuBg'));
    this.lane = new AttractLane(this.$('menuLane'));

    this.bind();
    app.onChange(() => this.refresh());
    this.refresh();
  }

  // ------------------------------------------------------------ visibility and animation

  show() {
    this.root.hidden = false;
    this.app.sound.playMusic('menu');
    this.refresh();
    this.stars.resize();
    this.startFx();
    setTimeout(() => this.$('btnPlay').focus({ preventScroll: true }), 30);
  }

  hide() {
    this.root.hidden = true;
    this.stopFx();
  }

  startFx() {
    this.stopFx();
    const loop = (ts) => {
      this.raf = requestAnimationFrame(loop);
      if (!document.hidden) this.drawFx(ts);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stopFx() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  drawFx(ts) {
    const theme = this.app.theme;
    this.stars.draw(ts, this.app.reduceMotion, theme.menu);
    this.lane.draw(ts, theme);
  }

  // ------------------------------------------------------------ dynamic text and state

  refresh() {
    const s = this.app.settings;
    setChecked(this.$('modePicker'), (r) => r.dataset.mode === s.mode);
    setChecked(this.$('diffPicker'), (r) => r.dataset.diff === s.difficulty);
    setChecked(this.$('themePicker'), (r) => r.dataset.themeId === this.app.theme.id);
    setChecked(this.$('langPicker'), (r) => r.dataset.lang === s.lang);
    setChecked(this.$('dpadPicker'), (r) => r.dataset.dpad === s.dpad);
    this.root.querySelectorAll('.lang-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === s.lang)));

    const hint = this.$('modeHint');
    hint.dataset.i18n = `mode.${s.mode}.hint`;
    hint.textContent = t(hint.dataset.i18n);
    const d = DIFFICULTIES[s.difficulty];
    this.$('diffHint').textContent = t(`diff.${d.id}.hint`, { lives: d.lives });
    this.$('themeHint').textContent = t(`theme.${this.app.theme.id}.hint`);

    const best = this.app.storage.best(s.mode, s.difficulty).score;
    this.$('bestLine').textContent = t('menu.best', {
      diff: t(`diff.${s.difficulty}`),
      mode: t(`mode.${s.mode}`),
      score: formatNumber(best)
    });

    document.querySelectorAll('input[data-setting]').forEach((input) => {
      input.checked = !!s[input.dataset.setting];
    });
    document.querySelectorAll('input[data-volume]').forEach((input) => {
      const v = s[input.dataset.volume];
      input.value = String(v);
      input.style.setProperty('--fill', `${v}%`);
      input.setAttribute('aria-valuetext', `${v}%`);
      const out = document.querySelector(`output[data-for="${input.dataset.volume}"]`);
      if (out) out.textContent = `${v}%`;
    });
    if (this.$('howtoDialog').open) this.goToStep(this.step);
    if (this.$('scoresDialog').open) this.renderScores();
    this.updateStartButton();
  }

  updateStartButton() {
    // Nothing dynamic yet; kept as a single place to add e.g. a "Continue" option later.
  }

  // ------------------------------------------------------------ wiring

  bind() {
    const $ = this.$;
    const sound = this.app.sound;

    $('btnPlay').addEventListener('click', () => {
      sound.init();
      sound.click();
      this.play();
    });
    $('btnHowTo').addEventListener('click', () => this.openHowTo());
    $('btnScores').addEventListener('click', () => this.openScores());
    $('btnSettings').addEventListener('click', () => this.openSettings());

    bindRadioGroup($('modePicker'), (btn) => {
      sound.init();
      sound.click();
      this.app.update({ mode: btn.dataset.mode });
    });
    bindRadioGroup($('diffPicker'), (btn) => {
      sound.init();
      sound.click();
      this.app.update({ difficulty: btn.dataset.diff });
    });
    bindRadioGroup($('themePicker'), (btn) => {
      sound.init();
      sound.click();
      this.app.update({ theme: btn.dataset.themeId });
    });
    bindRadioGroup($('langPicker'), (btn) => this.setLanguage(btn.dataset.lang));
    bindRadioGroup($('dpadPicker'), (btn) => this.app.update({ dpad: btn.dataset.dpad }));
    this.root.querySelectorAll('.lang-btn').forEach((b) => b.addEventListener('click', () => this.setLanguage(b.dataset.lang)));

    document.querySelectorAll('input[data-setting]').forEach((input) => {
      input.addEventListener('change', () => {
        this.app.update({ [input.dataset.setting]: input.checked });
        if (input.dataset.setting === 'music' && input.checked) sound.init();
        if (input.dataset.setting === 'sfx' && input.checked) {
          sound.init();
          sound.click();
        }
        if (input.dataset.setting === 'haptics' && input.checked) this.app.haptics.play(30);
        if (input.dataset.setting === 'reduceMotion' && !this.root.hidden) this.startFx();
      });
    });

    document.querySelectorAll('input[data-volume]').forEach((input) => {
      input.addEventListener('input', () => {
        const key = input.dataset.volume;
        const flag = key === 'musicVolume' ? 'music' : 'sfx';
        const volume = Number(input.value);
        sound.init();
        // Moving a slider of a muted channel switches that channel back on
        this.app.update({ [key]: volume, ...(volume > 0 ? { [flag]: true } : {}) });
        const now = performance.now();
        if (flag === 'sfx' && now - this.lastPreview > 120) {
          this.lastPreview = now;
          sound.click();
        }
      });
    });

    bindRadioGroup($('scoresMode'), (btn) => {
      sound.init();
      sound.click();
      this.boardMode = btn.dataset.mode;
      this.renderScores();
    });
    bindRadioGroup($('scoresDiff'), (btn) => {
      sound.init();
      sound.click();
      this.boardDiff = btn.dataset.diff;
      this.renderScores();
    });

    $('btnReset').addEventListener('click', () => this.resetProgress());

    // Dialogs: close buttons, backdrop click, tutorial navigation
    document.querySelectorAll('dialog').forEach((dlg) => {
      // Soft cue whenever a panel opens or closes, however it was triggered
      new MutationObserver(() => (dlg.open ? sound.open() : sound.close())).observe(dlg, { attributes: true, attributeFilter: ['open'] });
      dlg.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => dlg.close()));
      dlg.addEventListener('click', (e) => {
        if (e.target !== dlg) return;
        const r = dlg.getBoundingClientRect();
        const outside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
        if (outside) dlg.close();
      });
    });
    $('howtoPrev').addEventListener('click', () => this.goToStep(this.step - 1));
    $('howtoNext').addEventListener('click', () => {
      if (this.step >= this.stepCount - 1) this.$('howtoDialog').close();
      else this.goToStep(this.step + 1);
    });
    $('howtoDialog').addEventListener('close', () => this.onHowToClosed());
    $('howtoDialog').addEventListener('keydown', (e) => {
      if (e.code === 'ArrowRight') this.goToStep(this.step + 1);
      if (e.code === 'ArrowLeft') this.goToStep(this.step - 1);
    });

    // Keyboard navigation between menu rows (Up/Down); Left/Right stays inside each row
    this.root.addEventListener('keydown', (e) => {
      if (e.code !== 'ArrowDown' && e.code !== 'ArrowUp') return;
      const rows = [
        $('btnPlay'),
        $('modePicker').querySelector('[aria-checked="true"]'),
        $('diffPicker').querySelector('[aria-checked="true"]'),
        $('themePicker').querySelector('[aria-checked="true"]'),
        $('btnHowTo'),
        $('btnScores'),
        $('btnSettings'),
        $('btnInstall')
      ].filter((el) => el && !el.hidden);
      const i = rows.findIndex((el) => el === document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      rows[(i + (e.code === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length].focus();
    });

    // Soft UI ticks for mouse hover and keyboard focus (silent until audio is unlocked)
    this.root.addEventListener('pointerover', (e) => {
      if (e.pointerType !== 'mouse') return;
      const b = e.target.closest('button');
      if (b && b !== this.hovered) sound.hover();
      this.hovered = b;
    });
    this.root.addEventListener('focusin', (e) => {
      if (e.target.matches('button') && e.relatedTarget) sound.hover();
    });

    // Starfield reacts slightly to the pointer
    window.addEventListener('pointermove', (e) => {
      if (this.root.hidden) return;
      this.stars.setPointer(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
    });
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (this.root.hidden) return;
        this.stars.resize();
      }, 120);
    });
  }

  setLanguage(code) {
    this.app.setLanguage(code); // listeners (menu + game) refresh themselves
  }

  play() {
    if (!this.app.storage.seen('tutorial')) {
      this.openHowTo({ thenPlay: true });
      return;
    }
    this.game.startNewGame();
  }

  // ------------------------------------------------------------ tutorial

  get stepCount() {
    return this.$('howtoSteps').querySelectorAll('.step').length;
  }

  openHowTo({ thenPlay = false } = {}) {
    this.startAfterHowTo = thenPlay;
    this.step = 0;
    this.buildDots();
    this.goToStep(0);
    this.$('howtoDialog').showModal();
    this.drawSprites();
  }

  buildDots() {
    const box = this.$('howtoDots');
    box.textContent = '';
    for (let i = 0; i < this.stepCount; i++) box.appendChild(document.createElement('i'));
  }

  goToStep(n) {
    this.step = Math.max(0, Math.min(this.stepCount - 1, n));
    this.$('howtoSteps').querySelectorAll('.step').forEach((el, i) => (el.hidden = i !== this.step));
    this.$('howtoDots').querySelectorAll('i').forEach((el, i) => el.classList.toggle('on', i === this.step));
    this.$('howtoPrev').disabled = this.step === 0;
    const last = this.step === this.stepCount - 1;
    this.$('howtoNext').textContent = t(last && this.startAfterHowTo ? 'howto.done' : last ? 'btn.close' : 'howto.next');
    this.drawSprites();
  }

  onHowToClosed() {
    this.app.storage.markSeen('tutorial');
    if (this.startAfterHowTo) {
      this.startAfterHowTo = false;
      this.game.startNewGame();
    }
  }

  /** Paints the little canvases in the tutorial steps with the real game sprites. */
  drawSprites() {
    const dpr = window.devicePixelRatio || 1;
    this.$('howtoDialog').querySelectorAll('canvas.sprite').forEach((cv) => {
      if (!cv.dataset.size) cv.dataset.size = String(cv.width);
      const size = Number(cv.dataset.size);
      if (cv.width !== size * dpr) {
        cv.width = size * dpr;
        cv.height = size * dpr;
        cv.style.width = `${size}px`;
        cv.style.height = `${size}px`;
      }
      const ctx = cv.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const c = size / 2;
      const kind = cv.dataset.sprite;
      const ghost = GHOST_DEFS.find((g) => g.name === kind);
      if (kind === 'pellet') {
        drawPacman(ctx, c - 12, c, size * 0.26, { mouth: 0.25 });
        drawPellet(ctx, c + 8, c, 2.6);
        drawPellet(ctx, c + 18, c, 2.6);
      } else if (kind === 'power') {
        drawPowerPellet(ctx, c, c, size * 0.2);
      } else if (kind === 'fruit') {
        drawEmoji(ctx, PHASES[0].fruit.icon, c, c, size * 0.55);
      } else if (kind === 'scared') {
        drawGhost(ctx, c, c, size * 0.34, { color: '#fff', state: 'scared', wave: 0 });
      } else if (ghost) {
        drawGhost(ctx, c, c, size * 0.36, { color: this.app.theme.ghosts[ghost.name], dx: 1, wave: 0 });
      }
    });
  }

  // ------------------------------------------------------------ settings and scores

  openSettings() {
    this.refresh();
    const dlg = this.$('settingsDialog');
    if (!dlg.open) dlg.showModal();
  }

  /** The table opens on the mode and difficulty currently selected in the menu. */
  openScores() {
    this.boardMode = this.app.settings.mode;
    this.boardDiff = this.app.settings.difficulty;
    this.renderScores();
    this.$('scoresDialog').showModal();
  }

  renderScores() {
    const body = this.$('scoresBody');
    body.textContent = '';
    const { boardMode: mode, boardDiff: diff } = this;
    setChecked(this.$('scoresMode'), (r) => r.dataset.mode === mode);
    setChecked(this.$('scoresDiff'), (r) => r.dataset.diff === diff);
    const list = this.app.storage.board(mode, diff);

    const table = document.createElement('table');
    table.className = 'scores-table';
    const head = table.createTHead().insertRow();
    for (const key of ['scores.rank', 'scores.name', 'scores.score', 'scores.reached']) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = t(key);
      head.appendChild(th);
    }
    const tbody = table.createTBody();
    // Always ten rows, like an arcade cabinet: unclaimed places show as dashes
    for (let i = 0; i < BOARD_SIZE; i++) {
      const entry = list[i];
      const row = tbody.insertRow();
      row.insertCell().textContent = String(i + 1);
      row.insertCell().textContent = entry ? entry.name : '---';
      row.insertCell().textContent = entry ? formatNumber(entry.score) : '–';
      row.insertCell().textContent = entry ? t(entry.level > PHASE_COUNT || mode === 'endless' ? 'scores.level' : 'scores.stage', { n: entry.level }) : '–';
      if (!entry) row.classList.add('empty');
    }
    body.appendChild(table);

    const played = document.createElement('p');
    played.className = 'scores-foot';
    played.textContent = t('scores.played', { n: formatNumber(this.app.storage.stats().gamesPlayed) });
    body.appendChild(played);
  }

  resetProgress() {
    const btn = this.$('btnReset');
    if (!this.resetArmed) {
      this.app.toast(t('toast.resetConfirm'));
      btn.classList.add('armed');
      this.resetArmed = setTimeout(() => {
        this.resetArmed = null;
        btn.classList.remove('armed');
      }, 3000);
      return;
    }
    clearTimeout(this.resetArmed);
    this.resetArmed = null;
    btn.classList.remove('armed');
    this.app.storage.resetProgress();
    this.game.seenHints.clear();
    this.app.toast(t('toast.reset'));
    this.refresh();
  }
}
