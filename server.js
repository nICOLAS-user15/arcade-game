// Dependency-free static server for local development.
//
//   npm start            -> http://localhost:8080 (this machine only)
//   npm run start:lan    -> also reachable from phones on your Wi-Fi
//
// Options: PORT=3000, HOST=0.0.0.0, --lan, --no-open
//
// Hardening notes:
//  - Only an explicit allowlist of game files is served (not .git, tests, backups, dotfiles...).
//  - Paths are decoded safely, rejected if they contain NUL or backslashes, and re-checked
//    against the root with path.relative (a plain startsWith check is bypassable).
//  - Only GET and HEAD are accepted.
//  - Strict CSP and other security headers on every response.

import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.dirname(fileURLToPath(import.meta.url));

const PUBLIC_PATH = /^\/(?:index\.html|style\.css|manifest\.webmanifest|sw\.js|src\/[\w.-]+\.js|assets\/(?:fonts|icons)\/[\w.-]+\.(?:css|woff2|png|svg|ico))$/;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

export const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "require-trusted-types-for 'script'",
    'trusted-types pacman',
    "frame-ancestors 'none'"
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
};

function send(res, status, body, extra = {}) {
  res.writeHead(status, {
    ...SECURITY_HEADERS,
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...extra
  });
  res.end(body);
}

/** Maps a request URL to an allowlisted public path, or returns an error status. */
export function resolvePublicPath(rawUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(rawUrl, 'http://localhost').pathname);
  } catch {
    return { status: 400 }; // malformed URL or percent-encoding
  }
  if (pathname.includes('\0') || pathname.includes('\\')) return { status: 400 };
  pathname = path.posix.normalize(pathname);
  if (pathname === '/') pathname = '/index.html';
  if (!PUBLIC_PATH.test(pathname)) return { status: 404 };
  return { pathname };
}

export function createServer({ root = ROOT } = {}) {
  const server = http.createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      send(res, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
      return;
    }

    const resolved = resolvePublicPath(req.url || '/');
    if (resolved.status) {
      send(res, resolved.status, resolved.status === 400 ? 'Bad Request' : 'Not Found');
      return;
    }

    const file = path.resolve(root, `.${resolved.pathname}`);
    const rel = path.relative(root, file);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      send(res, 403, 'Forbidden');
      return;
    }

    fs.stat(file, (err, stats) => {
      if (err || !stats.isFile()) {
        send(res, 404, 'Not Found');
        return;
      }
      const etag = `W/"${stats.size.toString(16)}-${Math.floor(stats.mtimeMs).toString(16)}"`;
      const ext = path.extname(file).toLowerCase();
      const longLived = ext === '.woff2' || ext === '.png' || ext === '.svg';
      const headers = {
        ...SECURITY_HEADERS,
        'Content-Type': TYPES[ext] || 'application/octet-stream',
        'Content-Length': stats.size,
        ETag: etag,
        // Code is revalidated on every load (cheap 304s) so edits show up immediately
        'Cache-Control': longLived ? 'public, max-age=86400' : 'no-cache'
      };

      if (req.headers['if-none-match'] === etag) {
        res.writeHead(304, { ...SECURITY_HEADERS, ETag: etag, 'Cache-Control': headers['Cache-Control'] });
        res.end();
        return;
      }

      res.writeHead(200, headers);
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      const stream = fs.createReadStream(file);
      stream.on('error', () => res.destroy());
      res.on('close', () => stream.destroy());
      stream.pipe(res);
    });
  });

  // Defaults are generous; tighten them so slow or stalled clients cannot hold sockets open
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.keepAliveTimeout = 5000;
  return server;
}

function lanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);
}

function openBrowser(url) {
  const [cmd, args] =
    process.platform === 'win32' ? ['cmd', ['/c', 'start', '""', url]]
      : process.platform === 'darwin' ? ['open', [url]]
        : ['xdg-open', [url]];
  try {
    spawn(cmd, args, { detached: true, stdio: 'ignore', windowsHide: true }).on('error', () => {}).unref();
  } catch {
    /* the URL is printed anyway */
  }
}

function parsePort(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 && n < 65536 ? n : 8080;
}

function main() {
  const args = new Set(process.argv.slice(2));
  const lan = args.has('--lan');
  const port = parsePort(process.env.PORT);
  const host = process.env.HOST || (lan ? '0.0.0.0' : '127.0.0.1');
  const server = createServer();

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') console.error(`Port ${port} is already in use. Try: PORT=${port + 1} npm start`);
    else console.error(`Server error: ${err.message}`);
    process.exit(1);
  });

  server.listen(port, host, () => {
    const url = `http://localhost:${port}/`;
    console.log(`Game running at ${url}`);
    if (host === '0.0.0.0' || host === '::') {
      for (const ip of lanAddresses()) console.log(`On your phone (same Wi-Fi): http://${ip}:${port}/`);
    }
    console.log('Press Ctrl+C to stop.');
    if (!args.has('--no-open') && !process.env.NO_OPEN) openBrowser(url);
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
