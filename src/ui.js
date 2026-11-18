/**
 * Menu screen and dialogs: mode/difficulty pickers, the animated background,
 * the "How to play" tutorial, settings and the high-score table.
 */

import { DIFFICULTIES, GHOST_DEFS, PHASES, PHASE_COUNT, difficultyFor } from './config.js';
import { t, formatNumber, LANGUAGES } from './i18n.js';
import { BOARD_SIZE } from './storage.js';
import { Starfield, AttractLane } from './menu-fx.js';
import { drawPacman, drawGhost, drawPowerPellet, drawPellet, drawEmoji } from './sprites.js';
import { stageLook, shade } from './themes.js';

const LANE_STILL_MS = 1950;
const DIFF_IDS = ['easy', 'normal', 'hard', 'hardcore'];

/** Ghost speed multiplier -> 1..4 bars, so difficulties can be compared at a glance. */
function speedBars(ghostSpeed) {
  if (ghostSpeed < 0.95) return 1;
  if (ghostSpeed < 1.05) return 2;
  if (ghostSpeed < 1.15) return 3;
  return 4;
}

/** Sizes a canvas for the screen's pixel density and returns a context in CSS pixels. */
function hiDpiContext(cv, w, h) {
  const dpr = window.devicePixelRatio || 1;
  if (cv.width !== Math.round(w * dpr)) {
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
  }
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/** Accessible segmented control (role=radiogroup) with arrow-key navigation. */
function bindRadioGroup(group, onSelect) {
  const radios = () => [...group.querySelectorAll('[role="radio"]:not(:disabled)')];
  group.addEventListener('click', (e) => {
    const btn = e.target.closest('[role="radio"]');
    if (btn && !btn.disabled) onSelect(btn);
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
    this.boardDiff = DIFFICULTIES[app.settings.difficulty] ? app.settings.difficulty : 'normal';

    this.stars = new Starfield(this.$('menuBg'));
    this.lane = new AttractLane(this.$('menuLane'));

    this.buildDiffMeta();
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
    this.showView('home');
  }

  /** Switches the menu card between the home buttons and the game-mode setup. */
  showView(view, { focus = true } = {}) {
    const setup = view === 'setup';
    this.view = setup ? 'setup' : 'home';
    this.$('menuHome').hidden = setup;
    this.$('menuSetup').hidden = !setup;
    this.root.querySelector('.menu-card').dataset.view = this.view;
    if (setup) {
      this.refreshSetup();
      this.root.scrollTop = 0;
    }
    if (focus) setTimeout(() => this.$(setup ? 'btnPlay' : 'btnGameMode').focus({ preventScroll: true }), 30);
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
    const calm = this.app.reduceMotion;
    this.stars.draw(ts, calm, theme.menu);
    // Reduce motion: the chase scene stays frozen on one frame (Pac-Man mid-lane, ghosts behind)
    this.lane.draw(calm ? LANE_STILL_MS : ts, theme);
    if (this.view === 'setup') this.drawPreview(calm ? 0 : ts);
  }

  /** Lives (dots) and ghost speed (bars) under each difficulty name. Built once: the values never change. */
  buildDiffMeta() {
    for (const id of DIFF_IDS) {
      const d = DIFFICULTIES[id];
      const meta = this.$('diffPicker').querySelector(`[data-diff="${id}"] .diff-meta`);
      meta.textContent = '';
      const lives = document.createElement('span');
      lives.className = 'pips';
      for (let i = 0; i < d.lives; i++) lives.appendChild(document.createElement('i'));
      const bars = document.createElement('span');
      bars.className = 'bars';
      const on = speedBars(d.ghostSpeed);
      for (let i = 1; i <= 4; i++) {
        const b = document.createElement('i');
        if (i <= on) b.className = 'on';
        bars.appendChild(b);
      }
      meta.append(lives, bars);
    }
  }

  /** Mini maze in the selected theme with the selected character, shown above the theme picker. */
  drawPreview(ts) {
    const cv = this.$('themePreview');
    const w = cv.clientWidth || 360;
    const h = cv.clientHeight || 88;
    const ctx = hiDpiContext(cv, w, h);
    const theme = this.app.theme;
    const look = stageLook(theme, 0);
    const style = theme.walls.style;
    ctx.fillStyle = look.bg;
    ctx.fillRect(0, 0, w, h);

    const wall = (x, y, ww, hh) => {
      const r = style === 'block' || style === 'slab' ? 0 : Math.min(8, hh / 2);
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, ww, hh, r);
      else ctx.rect(x, y, ww, hh);
      if (style === 'outline') {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = look.wall;
        ctx.stroke();
      } else if (style === 'soft') {
        ctx.fillStyle = look.wall;
        ctx.fill();
        ctx.fillStyle = look.core || shade(look.wall, 0.5);
        ctx.fillRect(x + 6, y + hh / 2 - 1.5, ww - 12, 3);
      } else if (style === 'slab') {
        ctx.fillStyle = look.wall;
        ctx.fill();
        ctx.strokeStyle = look.bg;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, ww - 8, hh - 8);
      } else {
        ctx.fillStyle = look.wall;
        ctx.fill();
        ctx.fillStyle = shade(look.wall, 0.45);
        ctx.fillRect(x, y, ww, 2);
      }
    };
    const rail = 14;
    wall(4, 4, w - 8, rail);
    wall(4, h - 4 - rail, w - 8, rail);

    const y = h / 2;
    const span = w + 80;
    const pacX = ts ? ((ts * 0.06) % span) - 40 : w * 0.42;
    const powerX = Math.round(w * 0.78);
    for (let x = 20; x < w; x += 20) {
      if (x > pacX && Math.abs(x - powerX) > 10) drawPellet(ctx, x, y, 2.4);
    }
    if (powerX > pacX) drawPowerPellet(ctx, powerX, y, 5.5);
    const mouth = ts ? 0.12 + 0.16 * Math.abs(Math.sin(ts * 0.014)) : 0.22;
    const scared = pacX > powerX;
    GHOST_DEFS.slice(0, 2).forEach((g, i) => {
      const gx = pacX - 40 - i * 28;
      drawGhost(ctx, gx, y, 11, scared
        ? { color: '#fff', state: 'scared', dx: 1, wave: ts * 0.012 + i }
        : { color: theme.ghosts[g.name], dx: 1, wave: ts * 0.012 + i });
    });
    drawPacman(ctx, pacX, y, 12, { angle: 0, mouth, glow: scared });
  }

  /** Each character button shows that character in the current theme. */
  drawCharacters() {
    this.$('charPicker').querySelectorAll('[data-char]').forEach((btn) => {
      const cv = btn.querySelector('canvas');
      const ctx = hiDpiContext(cv, 34, 34);
      ctx.clearRect(0, 0, 34, 34);
      drawPacman(ctx, 17, 18, 12, { mouth: 0.22, as: btn.dataset.char });
    });
  }

  /** Small bounce on the option just picked (CSS turns it off with reduce motion). */
  pop(el) {
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  }

  /**
   * Changes the theme with a short, discreet effect in the style of the theme being picked
   * (Classic: a monitor-beam sweep, Retro: the same in 8-bit steps, Pastel: a soft dissolve,
   * Minimal: a hard cut). The effects live in style.css under html[data-vt]; they run through the
   * View Transitions API, with a plain short fade where it is missing. Reduced motion switches instantly.
   */
  switchTheme(id, origin) {
    const apply = () => {
      this.app.update({ theme: id });
      this.pop(origin);
    };
    if (id === this.app.settings.theme || this.app.reduceMotion) {
      apply();
      return;
    }
    const root = document.documentElement;
    if (typeof document.startViewTransition === 'function') {
      root.dataset.vt = id;
      const transition = document.startViewTransition(apply);
      transition.ready.catch(() => {});
      transition.finished.finally(() => delete root.dataset.vt).catch(() => {});
      return;
    }
    apply();
    for (const el of document.querySelectorAll('.menu-card, dialog[open]')) {
      el.animate?.([{ opacity: 0.6 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
    }
  }

  openCredits() {
    this.app.sound.init();
    const cv = this.$('creditsSprite');
    const ctx = hiDpiContext(cv, 56, 56);
    ctx.clearRect(0, 0, 56, 56);
    drawPacman(ctx, 28, 28, 22, { mouth: 0.22, as: this.app.settings.character });
    const dlg = this.$('creditsDialog');
    if (!dlg.open) dlg.showModal();
  }

  // ------------------------------------------------------------ dynamic text and state

  refresh() {
    const s = this.app.settings;
    setChecked(this.$('modePicker'), (r) => r.dataset.mode === s.mode);
    setChecked(this.$('diffPicker'), (r) => r.dataset.diff === s.difficulty);
    for (const id of ['themePicker', 'themePickerSettings']) {
      setChecked(this.$(id), (r) => r.dataset.themeId === this.app.theme.id);
    }
    setChecked(this.$('langPicker'), (r) => r.dataset.lang === s.lang);
    setChecked(this.$('dpadPicker'), (r) => r.dataset.dpad === s.dpad);
    // The collapsed "Languages" section shows the current one next to its title
    this.$('langCurrent').textContent = LANGUAGES[s.lang]?.label ?? '';

    this.refreshSetup();

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

  /** Everything on the game-mode screen that depends on the current choices. */
  refreshSetup() {
    const s = this.app.settings;
    const { storage } = this.app;
    const theme = this.app.theme;
    const d = difficultyFor(s);
    const modeName = t(`mode.${s.mode}`);
    const diffName = t(`diff.${d.id}`);

    // Mode cards show the record for the chosen difficulty
    this.$('modePicker').querySelectorAll('[data-best]').forEach((el) => {
      const best = d.custom ? 0 : storage.best(el.dataset.best, d.id).score;
      el.textContent = best ? t('mode.cardBest', { score: formatNumber(best) }) : t('mode.cardNoBest');
      el.classList.toggle('has-record', best > 0);
    });

    // Difficulty: hint, and the custom sliders when "Custom" is picked
    this.$('diffHint').textContent = d.custom
      ? t('diff.custom.hint', { lives: d.lives, speed: d.speedPct })
      : t(`diff.${d.id}.hint`, { lives: d.lives });
    this.$('customPanel').hidden = !d.custom;
    const custom = this.$('diffPicker').querySelector('[data-diff="custom"]');
    custom.title = t('diff.custom.hint', { lives: s.customLives, speed: s.customSpeed });
    for (const [id, value, text] of [
      ['customLives', s.customLives, String(s.customLives)],
      ['customSpeed', s.customSpeed, `${s.customSpeed}%`]
    ]) {
      const input = this.$(id);
      input.value = String(value);
      const pct = ((value - input.min) / (input.max - input.min)) * 100;
      input.style.setProperty('--fill', `${pct}%`);
      input.setAttribute('aria-valuetext', text);
      this.$(`${id}Val`).textContent = text;
    }

    // Start stage (Endless only): stages not reached yet stay locked
    const endless = s.mode === 'endless';
    const maxStage = storage.maxStage();
    const start = Math.min(s.startStage, maxStage);
    this.$('stageField').hidden = !endless;
    this.$('stagePicker').querySelectorAll('[data-stage]').forEach((btn) => {
      const n = Number(btn.dataset.stage);
      const locked = n > maxStage;
      btn.disabled = locked;
      btn.classList.toggle('locked', locked);
      btn.style.setProperty('--stage', stageLook(theme, n - 1).wall);
      const name = t(`phase.${PHASES[n - 1].id}.name`);
      btn.setAttribute('aria-label', locked ? t('menu.stageLocked', { n }) : `${n} · ${name}`);
      btn.title = btn.getAttribute('aria-label');
    });
    setChecked(this.$('stagePicker'), (r) => Number(r.dataset.stage) === start);
    const stageName = t(`phase.${PHASES[start - 1].id}.name`);
    this.$('stageHint').textContent = maxStage < PHASE_COUNT ? `${stageName} · ${t('menu.startStage.hint')}` : stageName;

    // Character (chosen in Settings) and theme previews
    setChecked(this.$('charPicker'), (r) => r.dataset.char === s.character);
    this.drawCharacters();
    this.$('themeHint').textContent = t(`theme.${theme.id}.hint`);
    this.$('themePreview').setAttribute('aria-label', t('menu.preview', { theme: t(`theme.${theme.id}`) }));
    if (this.view === 'setup') this.drawPreview(0);

    // Record line: trophy when there is one, an invitation when there is not
    const bestLine = this.$('bestLine');
    const best = d.custom ? 0 : storage.best(s.mode, d.id).score;
    bestLine.textContent = d.custom
      ? t('menu.bestCustom')
      : best
        ? `🏆 ${t('menu.best', { diff: diffName, mode: modeName, score: formatNumber(best) })}`
        : t('menu.bestNone');
    bestLine.classList.toggle('muted', !best);

    // One-line summary right above PLAY
    this.$('setupSummary').textContent = t('menu.summary', {
      mode: modeName,
      diff: diffName,
      lives: d.lives === 1 ? t('diff.life') : t('diff.lives', { n: d.lives }),
      char: t(`char.${s.character}`),
      theme: t(`theme.${theme.id}`)
    });

    // Home: "Play again" with the last setup, once at least one game was played
    const quick = this.$('btnQuickPlay');
    // Only after a game in this session: mode and difficulty reset when the game is reopened, so
    // "Play again" on a fresh launch would not repeat what was really played last
    quick.hidden = !this.game.sessionGames;
    this.$('quickPlayText').textContent = `${modeName} · ${diffName}`;
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
    $('btnGameMode').addEventListener('click', () => {
      sound.init();
      sound.click();
      this.showView('setup');
    });
    $('btnSetupBack').addEventListener('click', () => {
      sound.init();
      sound.click();
      this.showView('home');
    });
    $('btnHowTo').addEventListener('click', () => this.openHowTo());
    $('btnScores').addEventListener('click', () => this.openScores());
    $('btnSettings').addEventListener('click', () => this.openSettings());

    $('btnQuickPlay').addEventListener('click', () => {
      sound.init();
      sound.click();
      this.play();
    });

    // Game-mode pickers: each choice has its own sound and a small bounce
    const pick = (btn, patch, step, harsh = false) => {
      sound.init();
      sound.select(step, harsh);
      this.app.update(patch);
      this.pop(btn);
    };
    bindRadioGroup($('modePicker'), (btn) => pick(btn, { mode: btn.dataset.mode }, btn.dataset.mode === 'endless' ? 3 : 1));
    bindRadioGroup($('diffPicker'), (btn) => {
      const id = btn.dataset.diff;
      pick(btn, { difficulty: id }, id === 'custom' ? 2 : DIFF_IDS.indexOf(id), id === 'hardcore');
    });
    bindRadioGroup($('stagePicker'), (btn) => pick(btn, { startStage: Number(btn.dataset.stage) }, Number(btn.dataset.stage) - 1));
    bindRadioGroup($('charPicker'), (btn) => pick(btn, { character: btn.dataset.char }, [...btn.parentNode.children].indexOf(btn)));
    for (const id of ['customLives', 'customSpeed']) {
      $(id).addEventListener('input', () => {
        sound.init();
        sound.select(id === 'customLives' ? Number($(id).value) - 1 : (Number($(id).value) - 70) / 20);
        this.app.update({ [id]: Number($(id).value) });
      });
    }
    for (const id of ['themePicker', 'themePickerSettings']) {
      bindRadioGroup($(id), (btn) => {
        sound.init();
        sound.select([...btn.parentNode.children].indexOf(btn));
        this.switchTheme(btn.dataset.themeId, btn);
      });
    }
    bindRadioGroup($('langPicker'), (btn) => this.setLanguage(btn.dataset.lang));
    bindRadioGroup($('dpadPicker'), (btn) => this.app.update({ dpad: btn.dataset.dpad }));
    // Collapsible "Languages" section: soft cue when it opens or closes
    $('langGroup').addEventListener('toggle', () => {
      sound.init();
      if ($('langGroup').open) sound.open();
      else sound.close();
    });

    document.querySelectorAll('input[data-setting]').forEach((input) => {
      input.addEventListener('change', () => {
        this.app.update({ [input.dataset.setting]: input.checked });
        if (input.dataset.setting === 'music' && input.checked) sound.init();
        if (input.dataset.setting === 'sfx' && input.checked) {
          sound.init();
          sound.click();
        }
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
    $('btnCredits').addEventListener('click', () => this.openCredits());

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
      if (this.step >= this.stepCount - 1) {
        this.howtoCompleted = true;
        this.$('howtoDialog').close();
      }
      else this.goToStep(this.step + 1);
    });
    $('howtoDialog').addEventListener('close', () => this.onHowToClosed());
    $('howtoDialog').addEventListener('keydown', (e) => {
      if (e.code === 'ArrowRight') this.goToStep(this.step + 1);
      if (e.code === 'ArrowLeft') this.goToStep(this.step - 1);
    });

    // Keyboard navigation between menu rows (Up/Down); Left/Right stays inside each row
    this.root.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.view === 'setup') {
        e.preventDefault();
        this.showView('home');
        return;
      }
      if (e.code !== 'ArrowDown' && e.code !== 'ArrowUp') return;
      const rows = (this.view === 'setup'
        ? [
            $('btnSetupBack'),
            $('modePicker').querySelector('[aria-checked="true"]'),
            $('diffPicker').querySelector('[aria-checked="true"]'),
            $('customLives'),
            $('customSpeed'),
            $('stagePicker').querySelector('[aria-checked="true"]'),
            $('themePicker').querySelector('[aria-checked="true"]'),
            $('btnPlay')
          ]
        : [$('btnGameMode'), $('btnQuickPlay'), $('btnHowTo'), $('btnScores'), $('btnSettings'), $('btnInstall')]
      ).filter((el) => el && !el.closest('[hidden]'));
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
    // Only the tutorial's last button ("Play") starts the game; Esc, X or a backdrop click just close it
    const start = this.startAfterHowTo && this.howtoCompleted;
    this.startAfterHowTo = false;
    this.howtoCompleted = false;
    if (start) this.game.startNewGame();
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
    // Custom games have no table: open on Normal instead
    this.boardDiff = DIFFICULTIES[this.app.settings.difficulty] ? this.app.settings.difficulty : 'normal';
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

  /**
   * Two presses: the first turns the button into "Confirm?" for 3 s. The feedback lives in the
   * Settings dialog itself (toasts sit under the dialog's backdrop) and is read out by screen readers.
   */
  resetProgress() {
    const btn = this.$('btnReset');
    const hint = btn.closest('.setting').querySelector('small');
    const disarm = () => {
      clearTimeout(this.resetArmed);
      this.resetArmed = null;
      btn.classList.remove('armed');
      btn.textContent = t('settings.reset.btn');
    };
    if (!this.resetArmed) {
      btn.classList.add('armed');
      btn.textContent = t('settings.reset.confirm');
      this.app.announce(t('toast.resetConfirm'));
      this.resetArmed = setTimeout(disarm, 3000);
      return;
    }
    disarm();
    this.app.storage.resetProgress();
    this.game.seenHints.clear();
    hint.textContent = `✓ ${t('toast.reset')}`;
    setTimeout(() => (hint.textContent = t(hint.dataset.i18n)), 3000);
    this.app.announce(t('toast.reset'));
    this.refresh();
  }
}
