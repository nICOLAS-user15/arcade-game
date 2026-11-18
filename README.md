# Pac-Man Arcade

A Pac-Man tribute built with HTML5 Canvas and vanilla JavaScript. Five stages, four visual themes, four difficulty levels (including a one-life Hardcore mode) plus a tunable Custom one, four playable characters, an endless mode, an interactive tutorial, and a full interface in five languages (English, Portuguese, French, Spanish and Japanese). It runs on desktop and mobile, and installs as an offline-capable PWA.

<strong><a href="https://nicolas-user15.github.io/arcade-game/" target="_blank" rel="noopener noreferrer">Play online</a></strong>

No dependencies and no build step to play: just ES modules.

## Run locally

Requires Node.js 20+ (the CI tests on 22 and 24). ES modules do not load from `file://`, so use the bundled server:

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

- **Menu:** the home screen only has the main entry points (Game mode, Play again once you have played, How to play, High scores, Settings, Install app). **Game mode** opens a second screen with the mode, difficulty, start stage (Endless) and theme, a live preview of the theme, your record for the current choice, a one-line summary and the PLAY button. Every launch starts on Campaign + Normal; another choice lasts until the game is closed, while the theme, character, language and sound settings are remembered. Every pick has its own sound. The theme can also be changed in Settings, and the character is chosen there. Changing the theme plays a short, discreet transition in the style of the new theme: Classic is drawn top to bottom like a monitor beam, Retro does the same in 8-bit steps, Pastel dissolves softly and Minimal cuts in from the left (View Transitions API, with a plain fade where it is not supported).
- **Countdown:** every start shows "READY!" with a 3-2-1 countdown and a "GO!": a full second per digit when a stage starts, quicker after losing a life, and quickest between Endless levels, just long enough to read the new maze. You can already choose a direction during the countdown.
- **Modes:** Campaign (5 stages, then a victory screen) and Endless (stages loop; from the second lap the ghosts keep at least the pressure of the final stage and get faster each lap, with capped speed so it stays playable). Endless never stops between levels: no cutscene or briefing, the next maze loads as soon as one is cleared after a quick countdown, and the run only ends when the lives run out. Endless can start from any stage you have already reached.
- **Difficulty:** Easy / Normal / Hard / Hardcore change lives, ghost speed, power-up length and ghost-house release times. Hardcore gives a single life and no extra life. **Custom** lets you pick the lives (1-5) and the ghost speed (70-140%); custom games are not ranked. Each mode and difficulty has its own top-10 table: when a run makes the table you type your name (up to 12 characters, accents allowed). Tables live in the browser (`localStorage`), so they are per device; there is no online leaderboard.
- **Characters:** Pac-Man, Ms. Pac (with her bow), Cherry (pink) and Mint (green), picked in Settings. They only change the look, never the rules, and work with every theme.
- **Themes:** Classic (arcade blue outlines, the default), Retro (8-bit blocks rendered at half resolution with CRT scanlines), Pastel (a light candy "handheld" menu with floating bubbles and the game on dark rounded screens) and Minimal (brutalist black and white: a white Pac-Man, square slabs with a different texture on each stage, monospace type). Each theme restyles all 5 stages, the sprites, menu, cutscenes and interface, and has its own type pairing: Press Start 2P + Rajdhani (Classic), Silkscreen + VT323 (Retro), Fredoka + Nunito (Pastel), Space Mono + Space Grotesk (Minimal). All fonts are self-hosted, so they work offline.
- **Soundtrack:** original chiptune music for the menu, each of the 5 stages, the power-up, the cutscenes, plus jingles for ready, stage clear, victory, game over and new record. The stage music speeds up for the last quarter of the pellets and is muffled while paused. Music and sound effects have separate switches in Settings.
- **Opening animation:** on launch Pac-Man chomps across the screen chased by the ghosts, revealing the logo letter by letter, eats a power pellet, and the logo flies into the menu as it cascades in. Any key or tap skips it; it is off with reduced motion.
- **Onboarding:** a 5-step "How to play" tutorial opens on the first game, plus one-time contextual tips during play.
- **Languages:** English (default), Portuguese, French, Spanish and Japanese, chosen in Settings under the collapsible **Languages** section (the arrow next to the title opens it; the current language is shown beside it). Numbers follow each language's format. The game's fonts are Latin-only, so Japanese text uses the system's Japanese fonts (nothing is downloaded). Adding a language means adding one dictionary in `src/i18n.js`; a test enforces matching keys and placeholders.
- **Settings:** organised in collapsible sections (Languages, Display, Audio, Controls, About). The pause menu shows the score and stage, has quick music / effects switches, and resuming starts a short 3-2-1.
- **Polish:** no flash of the wrong theme or language on load (a tiny `src/boot.js` applies the saved settings before the first paint); fruits and interface icons are drawn by the game (canvas and an SVG sprite) instead of emoji, so they look the same on every device; a social preview image (`assets/icons/og-image.png`, generated by `npm run icons`) and a themed 404 page; when a new version is published, an open game offers "Update" instead of switching silently, and the version is shown in the Credits.
- **Credits:** Settings → Credits tells who made the game, that it is an academic study project, and how AI was used along the way.
- **Controls:** keyboard (arrows / WASD), swipe, centered on-screen D-pad with slightly spaced arrows for thumbs (on by default, can be turned off in Settings), gamepad.
- **Accessibility:** zoom allowed, focus management in dialogs and modals, keyboard-navigable menu, screen-reader announcements, labelled controls, touch targets of 44px or more. **Reduce motion** (defaults to the OS setting) freezes the menu animation, skips the opening and the cutscenes between stages, drops particle bursts and screen flashes.

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
404.html              Themed "page not found" for GitHub Pages
style.css             Design tokens, menu, responsive game layout, dialogs
manifest.webmanifest  PWA manifest
sw.js                 Service worker (offline support, network first with a 4 s fallback to the cache)
server.js             Hardened dependency-free dev server
src/
  config.js           Stages, tiles, difficulties (incl. Custom) and the pure level-parameter rules
  entities.js         Pac-Man and ghost movement/AI (fixed-step, DOM-free)
  game.js             State machine, scoring, rendering, HUD
  themes.js           Visual themes (wall style, per-stage palettes, sprite colors) and the playable characters
  cutscene.js         Intermission animations
  ui.js, menu-fx.js   Menu and game-mode screen, tutorial, settings, scores, animated background
  boot.js             Applies the saved theme/language before the first paint
  version.js          Build id shown in the Credits (stamped by the build)
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
- **Ghosts:** each targets a tile based on its personality, as in the arcade: Blinky chases, Pinky aims 4 tiles ahead, Inky doubles the vector from Blinky to the tile 2 ahead of Pac-Man (so the two close in from both sides), Clyde retreats when close. They alternate **scatter** waves (each backs off to its own corner) and **chase** waves, reversing at every switch; the breaks get shorter on harder difficulties and Endless laps, and the clock pauses during power-ups. For the last 10% of the pellets Blinky turns "Cruise Elroy": he matches Pac-Man's speed and stops scattering. They never reverse unless forced, and slow down in tunnels.
- **Fairness rules:** ghosts never outrun Pac-Man (their speed bends smoothly towards 95% of his, so harder settings stay harder without becoming impossible to escape); ghosts still in the house turn blue too when a power pellet is eaten and come out frightened; and the hitbox is asymmetric: a dangerous ghost must really overlap Pac-Man (0.6 tile) while a blue one is eaten from 0.75 tile. Distances are measured across the tunnels too, so a head-on meeting right at the screen edge always counts.
- **Extra lives:** one at 10,000 points; in Endless another every 25,000 points after that, up to 6 (with full lives the reward becomes 5,000 points). Hardcore never grants any.
- **Between stages:** each cutscene is worth a 500-point bonus. Tapping (or Space / gamepad A) collects it early, and players who skip it ("SKIP >>" corner, P, Esc, gamepad B) or play with reduced motion get the same, so the shared high-score table stays fair.
- **Controls feel:** a turn pressed before an opening is remembered for 0.6 s (longer while the key, arrow or finger is still held), so a quick tap never causes a surprise turn several tiles later. The stage music resumes where it left off after a power-up.
- **Install button:** `src/install.js` shows "Install app" in the menu. Chrome, Edge and Android use the browser's install prompt; iPhone and iPad have none, so the button opens "Add to Home Screen" instructions. It hides itself once the game runs as an installed app.
- **Volume:** music and effects have separate on/off switches and 0-100% sliders in Settings (squared curve, so the low end is usable).
- **Audio:** effects and music are synthesized with the Web Audio API, so there are no audio files. Songs are written as data in `src/songs.js` (notes, chord-relative bass and arpeggios, drum patterns) and played by a look-ahead scheduler in `src/chiptune.js`. Note: some antivirus web shields (e.g. Avast) block any script named `music*.js`, hence the file name.
- **Server hardening:** allowlisted files only, safe path decoding and traversal checks, GET/HEAD only, strict CSP and security headers, localhost bind by default.
- **Security:** the same Content Security Policy also ships as a `<meta>` tag, because GitHub Pages cannot send headers (a test keeps both copies identical). It requires Trusted Types, and since Pages cannot send anti-framing headers, the game refuses to start inside another site's frame. The service worker caches only the game's own files. The `__pacman` debug handle exists only on the local dev server. GitHub Actions are pinned to commit SHAs with least-privilege permissions and kept current by Dependabot; the deploy is split so the job that runs the repository's code cannot publish, and only the publishing job holds the Pages rights. See [SECURITY.md](SECURITY.md) for how to report a problem.

## Deploy

Pushes to `main` run the tests, build `dist/` and publish it with GitHub Pages (`.github/workflows/deploy.yml`). In the repository settings, set **Pages → Source** to **GitHub Actions**. The service worker cache is versioned with the commit SHA, and the worker is network-first (the cache is only the offline fallback), so players always get a consistent, current set of files when online and the game still works offline.

## License

Distributed under the MIT License. See [LICENSE](LICENSE).

This is a study project. The Pac-Man name and character are trademarks and intellectual property of their respective owners, and are not covered by this repository's license.
