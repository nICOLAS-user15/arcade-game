// Copies only the files the game needs into dist/ (what GitHub Pages publishes)
// and stamps the service worker with a build id so clients pick up new releases.
// Run: npm run build

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const entry of ['index.html', 'style.css', 'manifest.webmanifest']) {
  fs.copyFileSync(path.join(root, entry), path.join(dist, entry));
}
for (const dir of ['src', 'assets']) {
  fs.cpSync(path.join(root, dir), path.join(dist, dir), { recursive: true });
}

const buildId = (process.env.GITHUB_SHA || Date.now().toString(36)).slice(0, 10);
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8').replaceAll('__BUILD__', buildId);
fs.writeFileSync(path.join(dist, 'sw.js'), sw);

// Pages should serve the files as they are (no Jekyll processing)
fs.writeFileSync(path.join(dist, '.nojekyll'), '');

console.log(`Built dist/ (build id ${buildId})`);
