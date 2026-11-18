// Static checks that keep the HTML, the scripts, the service worker and the manifest in sync.
// They exist because a mismatch (e.g. JS looking for an element id that is not in the HTML)
// only shows up at runtime, in the browser.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DICT } from '../src/i18n.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const html = read('index.html');
const srcFiles = fs.readdirSync(path.join(root, 'src')).filter((f) => f.endsWith('.js'));

// Real id attributes only: `\bid=` would also match data-*-id attributes such as data-theme-id
const ID_ATTR = /(?<![\w-])id="([^"]+)"/g;
const ids = new Set([...html.matchAll(ID_ATTR)].map((m) => m[1]));

test('HTML ids are unique', () => {
  const all = [...html.matchAll(ID_ATTR)].map((m) => m[1]);
  const dupes = all.filter((id, i) => all.indexOf(id) !== i);
  assert.deepEqual(dupes, []);
});

test('every element id the scripts look up exists in index.html', () => {
  const missing = [];
  for (const file of srcFiles) {
    const code = read(`src/${file}`);
    const used = [
      ...code.matchAll(/\$\('([A-Za-z][\w-]*)'\)/g),
      ...code.matchAll(/getElementById\('([A-Za-z][\w-]*)'\)/g),
      ...code.matchAll(/\bpress\('([A-Za-z][\w-]*)'/g)
    ].map((m) => m[1]);
    for (const id of used) if (!ids.has(id)) missing.push(`${file}: #${id}`);
  }
  assert.deepEqual(missing, []);
});

test('every data-i18n key used in the HTML exists in the dictionary', () => {
  const keys = [...html.matchAll(/data-i18n(?:-aria|-title)?="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(keys.length > 40);
  assert.deepEqual(keys.filter((k) => !(k in DICT.en)), []);
});

test('every t("key") call in the scripts uses an existing key', () => {
  const missing = [];
  for (const file of srcFiles) {
    const code = read(`src/${file}`);
    for (const m of code.matchAll(/\bt\('([\w.]+)'/g)) if (!(m[1] in DICT.en)) missing.push(`${file}: ${m[1]}`);
  }
  assert.deepEqual(missing, []);
});

test('every dictionary key is used somewhere (no dead translations)', () => {
  const sources = srcFiles.map((f) => read(`src/${f}`)).join('\n') + html;
  const dynamicPrefixes = ['phase.', 'diff.', 'mode.', 'dir.', 'ghost.', 'theme.'];
  const unused = Object.keys(DICT.en).filter((key) => {
    if (dynamicPrefixes.some((p) => key.startsWith(p))) return false; // built at runtime
    return !sources.includes(`'${key}'`) && !sources.includes(`"${key}"`);
  });
  assert.deepEqual(unused, []);
});

test('the page is CSP-friendly: no inline scripts, styles or event handlers', () => {
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i, 'inline <script>');
  assert.doesNotMatch(html, /<style[\s>]/i, 'inline <style>');
  assert.doesNotMatch(html, /\sstyle="/i, 'style attribute');
  assert.doesNotMatch(html, /\son[a-z]+="/i, 'inline event handler');
  for (const file of srcFiles) {
    const code = read(`src/${file}`);
    assert.doesNotMatch(code, /setAttribute\(\s*['"]style['"]/, `${file} sets a style attribute`);
    assert.doesNotMatch(code, /\.cssText\b/, `${file} uses cssText`);
    assert.doesNotMatch(code, /\beval\(|new Function\(/, `${file} uses eval`);
    assert.doesNotMatch(code, /\.innerHTML\s*=/, `${file} writes innerHTML`);
    // Other HTML sinks: everything reaches the page through textContent (Trusted Types enforce it too)
    assert.doesNotMatch(code, /\.outerHTML\s*=|insertAdjacentHTML|document\.write|\.srcdoc\s*=|DOMParser/, `${file} uses an HTML sink`);
    assert.doesNotMatch(code, /set(Timeout|Interval)\(\s*['"`]/, `${file} passes a string to a timer`);
  }
});

test('Trusted Types: the CSP requires them and the only policy is the one in main.js', () => {
  const csp = read('index.html').match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/)[1];
  assert.match(csp, /require-trusted-types-for 'script'/);
  assert.match(csp, /trusted-types pacman(;|$)/);
  const policies = srcFiles.flatMap((f) => [...read(`src/${f}`).matchAll(/createPolicy\(\s*'([^']+)'/g)].map((m) => `${f}:${m[1]}`));
  assert.deepEqual(policies, ['main.js:pacman']);
});

test('the page allows zooming and declares its language and viewport', () => {
  assert.match(html, /<html lang="en"/);
  const viewport = /<meta name="viewport" content="([^"]+)"/.exec(html)[1];
  assert.doesNotMatch(viewport, /user-scalable\s*=\s*no/);
  assert.doesNotMatch(viewport, /maximum-scale/);
  assert.match(viewport, /viewport-fit=cover/);
});

test('every button and interactive control has an accessible name', () => {
  // These three get their label from game.js at runtime (result / briefing screens)
  const labelledAtRuntime = ['btnStartPhase', 'btnPrimary', 'btnSecondary'];
  const unnamed = [];
  for (const m of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    const attrs = m[1];
    if (labelledAtRuntime.some((id) => attrs.includes(`id="${id}"`))) continue;
    const text = m[2].replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').trim();
    const named = /aria-label=|data-i18n-aria=|data-i18n=/.test(attrs) || /data-i18n=/.test(m[2]) || text.length > 0
      || /<span[^>]*data-i18n=/.test(m[2]);
    if (!named) unnamed.push(attrs.trim().slice(0, 60));
  }
  assert.deepEqual(unnamed, []);
});

test('the service worker precaches every shipped file and nothing that is missing', () => {
  const sw = read('sw.js');
  const listed = [...sw.slice(sw.indexOf('APP_SHELL'), sw.indexOf('];', sw.indexOf('APP_SHELL'))).matchAll(/'([^']+)'/g)].map((m) => m[1]).filter((p) => p !== './');
  for (const p of listed) assert.ok(fs.existsSync(path.join(root, p)), `precached file missing: ${p}`);
  for (const f of srcFiles) assert.ok(listed.includes(`src/${f}`), `src/${f} is not precached`);
  for (const f of fs.readdirSync(path.join(root, 'assets/fonts')).filter((n) => n.endsWith('.woff2') || n.endsWith('.css'))) {
    assert.ok(listed.includes(`assets/fonts/${f}`), `assets/fonts/${f} is not precached`);
  }
  assert.ok(listed.includes('index.html') && listed.includes('style.css') && listed.includes('manifest.webmanifest'));
  assert.match(sw, /__BUILD__/, 'build id placeholder present for scripts/build.mjs');
});

test('manifest is valid and its icons exist', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.ok(manifest.name && manifest.short_name && manifest.start_url === './');
  assert.ok(manifest.icons.some((i) => i.sizes === '192x192') && manifest.icons.some((i) => i.sizes === '512x512'));
  assert.ok(manifest.icons.some((i) => i.purpose === 'maskable'));
  for (const icon of manifest.icons) assert.ok(fs.existsSync(path.join(root, icon.src)), icon.src);
});

test('local font files referenced by CSS exist', () => {
  const css = read('assets/fonts/fonts.css');
  const urls = [...css.matchAll(/url\(\.\/([^)]+)\)/g)].map((m) => m[1]);
  assert.ok(urls.length >= 6);
  for (const u of urls) assert.ok(fs.existsSync(path.join(root, 'assets/fonts', u)), u);
  assert.doesNotMatch(css, /https?:\/\//, 'no remote font URLs left');
});

test('the project no longer depends on remote hosts at runtime', () => {
  // Plain links the player can follow (the Credits) are fine: they load nothing by themselves.
  // They must open in a new tab without giving it access to this page.
  const links = /<a\s[^>]*href="https:\/\/github\.com\/[\w./-]+"[^>]*>/g;
  const html = read('index.html');
  for (const a of html.match(links) || []) {
    assert.match(a, /target="_blank"/, a);
    assert.match(a, /rel="noopener noreferrer"/, a);
  }
  for (const file of ['index.html', 'style.css', ...srcFiles.map((f) => `src/${f}`)]) {
    // Social preview tags and the canonical link name the site's own public address; nothing loads them
    const ownSite = /<(?:meta property="og:[a-z:]+"|link rel="canonical")[^>]*"https:\/\/nicolas-user15\.github\.io\/arcade-game\/[^"]*"[^>]*>/g;
    const text = file === 'index.html' ? html.replace(links, '').replace(ownSite, '') : read(file);
    assert.doesNotMatch(text, /https?:\/\/(?!www\.w3\.org)/, `${file} references a remote URL`);
  }
});
