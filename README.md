# Pac-Man Arcade

A Pac-Man tribute built with HTML5 Canvas and vanilla JavaScript. Five neon stages, three difficulty levels, an endless mode, an interactive tutorial, and a full English / Portuguese interface. It runs on desktop and mobile, and installs as an offline-capable PWA.

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
- **Difficulty:** Easy / Normal / Hard change lives, ghost speed, power-up length and ghost-house release times. Personal bests are stored per mode and difficulty.
- **Onboarding:** a 5-step "How to play" tutorial opens on the first game, plus one-time contextual tips during play.
- **Languages:** English (default) and Portuguese, switchable from the menu or Settings. Adding a language means adding one dictionary in `src/i18n.js`; a test enforces matching keys and placeholders.
- **Controls:** keyboard (arrows / WASD), swipe, on-screen D-pad (auto on touch screens, optional left-handed layout), gamepad, haptic feedback on supported phones.
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
- **Audio:** effects are synthesized with the Web Audio API, so there are no audio files.
- **Server hardening:** allowlisted files only, safe path decoding and traversal checks, GET/HEAD only, strict CSP and security headers, localhost bind by default.

## Deploy

Pushes to `main` run the tests, build `dist/` and publish it with GitHub Pages (`.github/workflows/deploy.yml`). In the repository settings, set **Pages → Source** to **GitHub Actions**. The service worker cache is versioned with the commit SHA, so players get new releases automatically.

## License

Distributed under the MIT License. See [LICENSE](LICENSE).

This is a study project. The Pac-Man name and character are trademarks and intellectual property of their respective owners, and are not covered by this repository's license.
