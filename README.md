# Pac-Man Arcade

A Pac-Man tribute built with HTML5 Canvas and vanilla JavaScript. Five stages, four visual themes, four difficulty levels (including a one-life Hardcore mode), an endless mode, an interactive tutorial, and a full English / Portuguese interface. It runs on desktop and mobile, and installs as an offline-capable PWA.

<strong><a href="https://nicolas-user15.github.io/arcade-game/" target="_blank" rel="noopener noreferrer">Play online</a></strong>

No dependencies and no build step to play: just ES modules.

## Run locally

Requires Node.js 18+. ES modules do not load from `file://`, so use the bundled server:

```bash
npm start            # http://localhost:8080 (this machine only)
npm run start:lan    # also reachable from your phone on the same Wi-Fi
```

Options: `PORT=3000`, `HOST=0.0.0.0`, `--no-open`.

```bash
npm test             # unit + integration tests (node:test, no dependencies)
npm run build        # copies the shippable files to dist/ (used by the Pages deploy)
```

## Features

- **Modes:** Campaign (5 stages, then a victory screen) and Endless (stages loop, ghosts get faster each lap, with capped speed so it stays playable).
- **Difficulty:** Easy / Normal / Hard / Hardcore change lives, ghost speed, power-up length and ghost-house release times. Hardcore gives a single life and no extra life. Each mode and difficulty has its own arcade-style top-10 table: when a run makes the table you enter three initials (letters or digits). Tables live in the browser (`localStorage`), so they are per device; there is no online leaderboard.
- **Themes:** Classic (arcade blue outlines, the default), Retro (8-bit blocks rendered at half resolution with CRT scanlines), Pastel (a light candy "handheld" menu with floating bubbles and the game on dark rounded screens) and Minimal (brutalist black and white: a white Pac-Man, square slabs with a different texture on each stage, monospace type). Each theme restyles all 5 stages, the sprites, menu, cutscenes and interface, and has its own type pairing: Press Start 2P + Rajdhani (Classic), Silkscreen + VT323 (Retro), Fredoka + Nunito (Pastel), Space Mono + Space Grotesk (Minimal). All fonts are self-hosted, so they work offline.
- **Soundtrack:** original chiptune music for the menu, each of the 5 stages, the power-up, the cutscenes, plus jingles for ready, stage clear, victory, game over and new record. The stage music speeds up for the last quarter of the pellets and is muffled while paused. Music and sound effects have separate switches in Settings.
- **Opening animation:** on launch Pac-Man chomps across the screen chased by the ghosts, revealing the logo letter by letter, eats a power pellet, and the logo flies into the menu as it cascades in. Any key or tap skips it; it is off with reduced motion.
- **Onboarding:** a 5-step "How to play" tutorial opens on the first game, plus one-time contextual tips during play.
- **Languages:** English (default) and Portuguese, switchable from the menu or Settings. Adding a language means adding one dictionary in `src/i18n.js`; a test enforces matching keys and placeholders.
- **Controls:** keyboard (arrows / WASD), swipe, centered on-screen D-pad (shown automatically on touch screens and phone-sized windows), gamepad, haptic feedback on supported phones.
- **Accessibility:** zoom allowed, focus management in dialogs and modals, keyboard-navigable menu, screen-reader announcements, reduced-motion option (defaults to the OS setting), labelled controls, touch targets of 44px or more.

## Controls

| Action | Keyboard | Touch | Gamepad |
|---|---|---|---|
| Move | Arrows / WASD | Swipe or D-pad | D-pad / left stick |
| Pause | Space / P / Esc | Pause button | Start |
| Fullscreen | F | Fullscreen button | |
| Mute | M | Sound button | |

## Project structure

```
index.html            Page markup (no inline scripts or styles, so a strict CSP works)
style.css             Design tokens, menu, responsive game layout, dialogs
manifest.webmanifest  PWA manifest
sw.js                 Service worker (offline support)
server.js             Hardened dependency-free dev server
src/
  config.js           Stages, tiles, difficulties and the pure level-parameter rules
  entities.js         Pac-Man and ghost movement/AI (fixed-step, DOM-free)
  game.js             State machine, scoring, rendering, HUD
  themes.js           Visual themes: wall style and per-stage palettes, sprite colors
  cutscene.js         Intermission animations
  ui.js, menu-fx.js   Menu, tutorial, settings, scores, animated background
  input.js            Keyboard, swipe, D-pad, gamepad
  i18n.js, storage.js, audio.js, sprites.js, app.js, main.js
test/                 node:test suites
scripts/              build and icon generation
.github/workflows/    CI and GitHub Pages deploy
```

## How it works

- **Fixed timestep:** the simulation advances in exact 1/60 s steps, so game speed is identical on 60, 120 and 144 Hz displays. Rendering happens once per animation frame.
- **Responsive layout:** the board size is computed in CSS from fixed HUD/control heights and the viewport (`100dvh`, safe-area insets), with dedicated portrait, landscape and desktop modes. The canvas backing store follows `devicePixelRatio`, and the static maze is cached in an offscreen canvas.
- **Maze:** each stage is a 19 × 21 matrix of tile types. Tests verify frame integrity, ghost house, tunnels, portals and that every pellet is reachable.
- **Ghosts:** each targets a tile based on its personality (Blinky chases, Pinky aims 4 tiles ahead, Inky 2 tiles ahead, Clyde retreats when close). They never reverse unless forced, and slow down in tunnels.
- **Install button:** `src/install.js` shows "Install app" in the menu. Chrome, Edge and Android use the browser's install prompt; iPhone and iPad have none, so the button opens "Add to Home Screen" instructions. It hides itself once the game runs as an installed app.
- **Volume:** music and effects have separate on/off switches and 0-100% sliders in Settings (squared curve, so the low end is usable).
- **Audio:** effects and music are synthesized with the Web Audio API, so there are no audio files. Songs are written as data in `src/songs.js` (notes, chord-relative bass and arpeggios, drum patterns) and played by a look-ahead scheduler in `src/chiptune.js`. Note: some antivirus web shields (e.g. Avast) block any script named `music*.js`, hence the file name.
- **Server hardening:** allowlisted files only, safe path decoding and traversal checks, GET/HEAD only, strict CSP and security headers, localhost bind by default.

## Deploy

Pushes to `main` run the tests, build `dist/` and publish it with GitHub Pages (`.github/workflows/deploy.yml`). In the repository settings, set **Pages → Source** to **GitHub Actions**. The service worker cache is versioned with the commit SHA, so players get new releases automatically.

## License

Distributed under the MIT License. See [LICENSE](LICENSE).

This is a study project. The Pac-Man name and character are trademarks and intellectual property of their respective owners, and are not covered by this repository's license.
