import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createServer, resolvePublicPath, SECURITY_HEADERS } from '../server.js';

let server;
let port;

before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = server.address().port;
});

after(() => new Promise((resolve) => { server.closeAllConnections?.(); server.close(resolve); }));

/** Raw request, so paths are sent exactly as written (fetch would normalize "../"). */
function request(path, { method = 'GET', headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path, method, headers }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('serves the game page with security headers', async () => {
  const res = await request('/');
  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /text\/html/);
  assert.match(res.body, /<title>Pac-Man Arcade<\/title>/);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    assert.equal(res.headers[name.toLowerCase()], value, `${name} header`);
  }
  assert.match(res.headers['content-security-policy'], /default-src 'self'/);
  assert.match(res.headers['content-security-policy'], /object-src 'none'/);
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
});

test('the page carries the same CSP as the server, for hosts that cannot send headers (GitHub Pages)', async () => {
  const fs = await import('node:fs');
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const meta = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
  assert.ok(meta, 'CSP meta tag present');
  assert.ok(html.indexOf(meta[0]) < html.indexOf('<link'), 'CSP meta comes before any resource');
  // frame-ancestors is ignored in a meta tag (header only), so it is the one expected difference
  const fromServer = SECURITY_HEADERS['Content-Security-Policy'].split('; ').filter((d) => !d.startsWith('frame-ancestors'));
  assert.deepEqual(meta[1].split('; '), fromServer);
});

test('serves modules, styles, fonts, icons and the manifest with the right types', async () => {
  const cases = [
    ['/src/main.js', /javascript/],
    ['/style.css', /text\/css/],
    ['/manifest.webmanifest', /manifest\+json/],
    ['/sw.js', /javascript/],
    ['/assets/fonts/fonts.css', /text\/css/],
    ['/assets/fonts/press-start-2p-400-latin.woff2', /font\/woff2/],
    ['/assets/icons/icon.svg', /image\/svg\+xml/],
    ['/assets/icons/icon-192.png', /image\/png/]
  ];
  for (const [path, type] of cases) {
    const res = await request(path);
    assert.equal(res.status, 200, path);
    assert.match(res.headers['content-type'], type, path);
  }
});

test('does not expose anything outside the allowlist', async () => {
  const blocked = [
    '/server.js', '/package.json', '/package-lock.json', '/README.md', '/LICENSE', '/sw.js.map',
    '/.git/config', '/.git/HEAD', '/.gitignore', '/.claude/settings.local.json', '/.vscode/settings.json',
    '/test/server.test.js', '/scripts/build.mjs', '/backup-original/index.html', '/node_modules/x.js',
    '/src/', '/src', '/assets/', '/src/nested/../../server.js'
  ];
  for (const path of blocked) {
    const res = await request(path);
    assert.equal(res.status, 404, `${path} should be 404, got ${res.status}`);
  }
});

test('path traversal attempts never reach files outside the root', async () => {
  const attempts = [
    '/../server.js', '/../../etc/passwd', '/src/../../server.js', '/%2e%2e/server.js', '/%2e%2e%2fserver.js',
    '/src/%2e%2e/%2e%2e/server.js', '/..%2fserver.js', '/....//server.js', '/assets/fonts/../../../server.js'
  ];
  for (const path of attempts) {
    const res = await request(path);
    assert.ok([400, 403, 404].includes(res.status), `${path} -> ${res.status}`);
    assert.doesNotMatch(res.body, /createServer|node:http/, `${path} leaked server source`);
  }
});

test('malformed or hostile URLs get a clean 400, not a crash', async () => {
  for (const path of ['/%', '/%E0%A4%A', '/%00', '/index.html%00.png', '/..%5cserver.js', '/src%5cmain.js']) {
    const res = await request(path);
    assert.equal(res.status, 400, path);
  }
  // The server is still alive afterwards
  assert.equal((await request('/')).status, 200);
});

test('only GET and HEAD are allowed', async () => {
  for (const method of ['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']) {
    const res = await request('/', { method });
    assert.equal(res.status, 405, method);
    assert.equal(res.headers.allow, 'GET, HEAD');
  }
  const head = await request('/', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(head.body, '');
  assert.ok(Number(head.headers['content-length']) > 0);
});

test('ETag revalidation returns 304 and code is not cached blindly', async () => {
  const first = await request('/style.css');
  assert.ok(first.headers.etag);
  assert.equal(first.headers['cache-control'], 'no-cache');
  const again = await request('/style.css', { headers: { 'If-None-Match': first.headers.etag } });
  assert.equal(again.status, 304);
  assert.equal(again.body, '');
  assert.equal((await request('/style.css', { headers: { 'If-None-Match': 'W/"nope"' } })).status, 200);
});

test('fonts are cached long-term', async () => {
  const res = await request('/assets/fonts/rajdhani-600-latin.woff2');
  assert.match(res.headers['cache-control'], /max-age=\d+/);
});

test('resolvePublicPath is a pure allowlist', () => {
  assert.deepEqual(resolvePublicPath('/'), { pathname: '/index.html' });
  assert.deepEqual(resolvePublicPath('/index.html?x=1#y'), { pathname: '/index.html' });
  assert.deepEqual(resolvePublicPath('/src/game.js'), { pathname: '/src/game.js' });
  assert.equal(resolvePublicPath('/server.js').status, 404);
  assert.equal(resolvePublicPath('/%zz').status, 400);
});
