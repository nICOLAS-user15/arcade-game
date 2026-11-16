// Generates the app icons (SVG source + PNG sizes) without any dependency.
// Run: npm run icons
//
// The PNG encoder rasterizes the same Pac-Man drawing used by icon.svg, with 3x3 supersampling.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'icons');
fs.mkdirSync(OUT, { recursive: true });

// ---- SVG --------------------------------------------------------------

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="45%" r="75%">
      <stop offset="0" stop-color="#14204a"/>
      <stop offset="1" stop-color="#060811"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="104" fill="url(#bg)"/>
  <path d="M205 256 L${205 + 144 * Math.cos(0.61)} ${256 - 144 * Math.sin(0.61)} A144 144 0 1 0 ${205 + 144 * Math.cos(0.61)} ${256 + 144 * Math.sin(0.61)} Z" fill="#ffe600"/>
  <circle cx="226" cy="180" r="15" fill="#060811"/>
  <circle cx="368" cy="256" r="18" fill="#ffdedb"/>
  <circle cx="436" cy="256" r="18" fill="#ffdedb"/>
</svg>
`;
fs.writeFileSync(path.join(OUT, 'icon.svg'), svg);

// ---- PNG rasterizer ----------------------------------------------------

const MOUTH = 0.61; // radians, half-opening of the mouth (~35 degrees)

/** Returns [r,g,b,a] for a point in unit coordinates. `rounded` leaves transparent corners. */
function shade(u, v, rounded) {
  if (rounded) {
    // rounded square, corner radius 0.2
    const cx = Math.min(Math.max(u, 0.2), 0.8);
    const cy = Math.min(Math.max(v, 0.2), 0.8);
    if ((u - cx) ** 2 + (v - cy) ** 2 > 0.2 ** 2) return [0, 0, 0, 0];
  }
  const d = Math.hypot(u - 0.5, v - 0.45) / 0.75;
  const t = Math.min(1, d);
  let color = [Math.round(20 + (6 - 20) * t), Math.round(32 + (8 - 32) * t), Math.round(74 + (17 - 74) * t), 255];

  const px = 0.4;
  const py = 0.5;
  const dx = u - px;
  const dy = v - py;
  const inBody = Math.hypot(dx, dy) < 0.28;
  const inMouth = dx > 0 && Math.abs(Math.atan2(dy, dx)) < MOUTH;
  if (inBody && !inMouth) color = [255, 230, 0, 255];
  if (Math.hypot(u - (px + 0.04), v - (py - 0.14)) < 0.03) color = [6, 8, 17, 255];
  if (Math.hypot(u - 0.72, v - 0.5) < 0.035 || Math.hypot(u - 0.85, v - 0.5) < 0.035) color = [255, 222, 219, 255];
  return color;
}

function renderPng(size, rounded) {
  const ss = 3;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const c = shade((x + (sx + 0.5) / ss) / size, (y + (sy + 0.5) / ss) / size, rounded);
          r += c[0] * c[3]; g += c[1] * c[3]; b += c[2] * c[3]; a += c[3];
        }
      }
      const o = y * (size * 4 + 1) + 1 + x * 4;
      const n = ss * ss;
      raw[o] = a ? Math.round(r / a) : 0;
      raw[o + 1] = a ? Math.round(g / a) : 0;
      raw[o + 2] = a ? Math.round(b / a) : 0;
      raw[o + 3] = Math.round(a / n);
    }
  }
  return encodePng(size, size, raw);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePng(w, h, raw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const targets = [
  ['icon-192.png', 192, true],
  ['icon-512.png', 512, true],
  ['icon-maskable-512.png', 512, false], // full bleed: the OS applies its own mask
  ['apple-touch-icon.png', 180, false]
];
for (const [name, size, rounded] of targets) {
  fs.writeFileSync(path.join(OUT, name), renderPng(size, rounded));
  console.log('wrote', name);
}
