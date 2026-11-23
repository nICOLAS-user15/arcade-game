# Pac-Man Arcade

A Pac-Man tribute built with HTML5 Canvas and vanilla JavaScript. It runs on desktop and mobile and installs as an offline-capable PWA.

<strong><a href="https://nicolas-user15.github.io/arcade-game/" target="_blank" rel="noopener noreferrer">Play online</a></strong>

## Features

- **Modes:** Campaign (5 stages) and Endless (stages loop and get harder each lap).
- **Difficulty:** Easy, Normal, Hard, Hardcore (one life) and Custom (unranked). Each mode and difficulty has its own top-10 table, stored in the browser.
- **Themes:** Classic, Retro, Pastel and Minimal, each restyling the mazes, sprites, menus and fonts.
- **Characters:** four playable looks (cosmetic only).
- **Sound:** original chiptune soundtrack and effects, synthesized with the Web Audio API.
- **Languages:** English, Portuguese, French, Spanish and Japanese.
- **Accessibility:** keyboard-navigable menus, screen-reader announcements, large touch targets and a Reduce motion option.

## Controls

| Action | Keyboard | Touch | Gamepad |
|---|---|---|---|
| Move | Arrows / WASD | Swipe or D-pad | D-pad / left stick |
| Pause | Space / P / Esc | Pause button | Start |
| Fullscreen | F | Fullscreen button | |
| Mute | M | Sound button | |

## Run locally

Requires Node.js 20+. No dependencies.

```bash
npm start            # http://localhost:8080
npm run start:lan    # also reachable from other devices on the same network
npm test             # run the tests
npm run build        # build to dist/
```

## Project structure

```
index.html, style.css   Page and styles
src/                    Game code (ES modules)
test/                   node:test suites
scripts/                Build and icon generation
server.js               Dev server
sw.js                   Service worker (offline support)
```

## Deploy

Pushes to `main` run the tests, build `dist/` and publish it to GitHub Pages via GitHub Actions. See [SECURITY.md](SECURITY.md) for how to report a security problem.

## License

MIT, see [LICENSE](LICENSE). This is a study project; the Pac-Man name and character belong to their respective owners and are not covered by this license.
