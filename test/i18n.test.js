import test from 'node:test';
import assert from 'node:assert/strict';
import { DICT, LANGUAGES, DEFAULT_LANG, t, setLang, getLang, formatNumber, isSupported } from '../src/i18n.js';
import { PHASES } from '../src/config.js';

const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test('English is the default language', () => {
  assert.equal(DEFAULT_LANG, 'en');
  assert.equal(getLang(), 'en');
});

test('every language has exactly the same keys as English', () => {
  const base = Object.keys(DICT.en).sort();
  for (const lang of Object.keys(LANGUAGES)) {
    assert.ok(DICT[lang], `dictionary for ${lang} exists`);
    const keys = Object.keys(DICT[lang]).sort();
    assert.deepEqual(base.filter((k) => !keys.includes(k)), [], `${lang}: missing keys`);
    assert.deepEqual(keys.filter((k) => !base.includes(k)), [], `${lang}: extra keys`);
  }
});

test('translations are non-empty and keep the same {placeholders}', () => {
  for (const lang of Object.keys(LANGUAGES)) {
    for (const [key, value] of Object.entries(DICT[lang])) {
      assert.ok(typeof value === 'string' && value.trim().length > 0, `${lang}.${key} is empty`);
      assert.deepEqual(placeholders(value), placeholders(DICT.en[key]), `${lang}.${key}: placeholders differ from English`);
    }
  }
});

test('English strings contain no Portuguese leftovers', () => {
  const accents = /[ãõáéíóúâêôçÃÕÁÉÍÓÚÂÊÔÇ]/;
  const offenders = Object.entries(DICT.en).filter(([, v]) => accents.test(v));
  assert.deepEqual(offenders, []);
});

test('every stage has a translated name, feature and fruit in every language', () => {
  for (const lang of Object.keys(LANGUAGES)) {
    for (const p of PHASES) {
      for (const part of ['name', 'feature', 'fruit']) {
        assert.ok(DICT[lang][`phase.${p.id}.${part}`], `${lang}: phase.${p.id}.${part}`);
      }
    }
  }
});

test('t() interpolates, falls back and never throws on unknown keys', () => {
  setLang('en');
  assert.equal(t('hud.stage', { n: 2, max: 5 }), 'STAGE 2/5');
  assert.equal(t('hud.stage'), 'STAGE {n}/{max}'); // untouched without params
  assert.equal(t('does.not.exist'), 'does.not.exist');
  assert.equal(t('hud.stage', { n: 3 }), 'STAGE 3/{max}');
});

test('switching language changes output and unsupported codes fall back to English', () => {
  setLang('pt');
  assert.equal(getLang(), 'pt');
  assert.equal(t('menu.play'), 'JOGAR');
  assert.equal(t('hud.stage', { n: 1, max: 5 }), 'FASE 1/5');
  setLang('klingon');
  assert.equal(getLang(), 'en');
  assert.equal(t('menu.play'), 'PLAY');
  assert.ok(isSupported('pt') && !isSupported('klingon'));
});

test('numbers are formatted for the active locale', () => {
  setLang('en');
  assert.equal(formatNumber(12345), '12,345');
  setLang('pt');
  assert.equal(formatNumber(12345), '12.345');
  setLang('en');
});
