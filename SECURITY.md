# Security policy

## Reporting a vulnerability

Please do not open a public issue for security problems. Use GitHub's private reporting instead:
**Security → Report a vulnerability** on this repository. You should get an answer within a few days.

## Supported versions

Only the latest version on `main` (the one published on GitHub Pages) receives fixes.

## Scope and design notes

- The game is a static site: no backend, no accounts, no data leaves the browser.
- High scores, settings and progress live in the browser's `localStorage`, per device. They are not
  tamper-proof and do not need to be: there is no shared leaderboard to cheat. An online leaderboard
  would require server-side validation of scores.
- A Content Security Policy blocks inline and third-party scripts, styles and fonts. It is sent as an
  HTTP header by the local server and as a `<meta>` tag for GitHub Pages; a test keeps both identical.
- Player input (the high-score name) is filtered to letters, digits, single spaces and `. ' - _`
  (12 characters at most), and every text reaches the page through `textContent`, never as HTML.
- The only external links (in the Credits) open in a new tab with `rel="noopener noreferrer"`; a test
  fails if any other remote URL appears in the page, the styles or the scripts.
- The local dev server (`server.js`) only serves an allowlist of game files, rejects path traversal,
  accepts GET/HEAD only and binds to `localhost` unless `--lan` is used.
- The service worker only caches the game's own files (an explicit list), never arbitrary URLs.
- GitHub Actions are pinned to full commit SHAs with least-privilege permissions, and Dependabot
  keeps them up to date. The game has no npm dependencies.
