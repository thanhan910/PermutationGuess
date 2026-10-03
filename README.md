# Permutation Guess

Drag the fruit into an order and submit a guess to learn how many positions are
correct. This static HTML/CSS/JavaScript implementation preserves the Angular
game's UI, colors, rules and URLs, with no browser runtime dependencies.

- Netlify: https://pggame.netlify.app/
- GitHub Pages: https://thanhan910.github.io/PermutationGuess/

## Browser compatibility

The compatibility targets are Safari/iOS 13, Chrome 77, Firefox 69 and Edge 18
(EdgeHTML), plus current browsers. These are the browser generations around the
iPhone 11's September 2019 launch. Internet Explorer is not a tested target.

Browser scripts are shipped as classic, ordered `defer` scripts and checked with
an ES5 parser. There are no JavaScript modules, framework bootstrapping, fetch,
Promise, storage or newer runtime API requirements. Mouse and touch events handle
dragging without pointer capture. Arrow keys reorder a focused fruit.

CSS uses margins in place of flex `gap`; a small resize handler preserves the
original font-size formula without `clamp()` or CSS variables. All five pages
contain the initial UI before JavaScript runs, with a message if scripting is
disabled. Gameplay still requires JavaScript.

Validation includes current Chromium, Firefox and WebKit, iPhone 11 dimensions,
and a WebKit scenario with newer APIs removed. The optional legacy test runs
against an **actual Chromium 77 binary**, using native browser touch input on
every route for both hosts. Safari 13 on a real iPhone, Firefox 69 and Edge 18
still require device/browser testing before claiming verified support. Changing
a user-agent string or viewport alone does not test an old browser engine.

## Development

Use Node.js 24 LTS, at least 24.21.0. Node is only a development/build tool; the
deployed site needs only static hosting.

```sh
npm ci
npm start
```

Open http://127.0.0.1:4200/. Edit `src/`, then restart `npm start` to rebuild.
The preview also supports `/5/`, `/6/`, `/7/` and `/8/`.

```sh
npm run test:ci
npx playwright install chromium firefox webkit
npm run test:browser
npm run audit:dependencies
```

`test:ci` checks the game rules, exhaustive small shuffle choices and compatibility
constraints. `test:browser` builds both hosts and tests navigation, all puzzle
sizes, wins/losses, reset, mouse/touch/keyboard reordering and narrow layouts in
all configured browsers. On Linux, install browsers with `--with-deps`.

For the optional real legacy-engine check, set `CHROMIUM_LEGACY_BIN` to a
Chromium 77 executable, then run `npm run test:legacy`. The validation used
Chromium 77.0.3844.0 from Google's official Chromium snapshot archive
(`Win_x64/674921`). The test downloads nothing, creates an isolated temporary
profile, disables background networking and only serves the local build. Do not
use the archived browser for normal browsing.

## Puzzle sizes

| Items | Path | Guesses allowed |
| --- | --- | --- |
| 5 | `/` and `/5/` | 6 |
| 6 | `/6/` | 7 |
| 7 | `/7/` | 8 |
| 8 | `/8/` | 10 |

Sizes 5-7 use the proven optimum. Size 8 uses the shortest strategy found, with
a proven lower bound of 9. `src/game.js` is the single source of truth for sizes,
fruit, colors and budgets, shared by the browser, build and tests.

## Build and deployment

| Host | Build command | Publish directory | Base URL |
| --- | --- | --- | --- |
| Netlify | `npm run build:netlify` | `dist/netlify` | `/` |
| GitHub Pages | `npm run build:github` | `dist/github` | `/PermutationGuess/` |

Both commands run from the repository root. `npm run build` builds both. Each
output contains an index page and a real page for every puzzle size, so deep
links need no SPA rewrite. Assets have content hashes to avoid stale JS/CSS after
updates. Preview either output with `node scripts/serve.mjs dist/github` (or
`dist/netlify`). Build outputs and dependencies are ignored by Git.

GitHub Pages should use **GitHub Actions** as its source. The workflow in
`.github/workflows/deploy-site.yml` audits, tests and builds on pull requests and
pushes to `main`; only `main` deploys. Scheduled runs check dependencies daily.

`netlify.toml` sets the repository root as the base and publishes `dist/netlify`
after a clean dependency audit. Netlify's production branch should be `main`.
If the dashboard has a package directory pointing at `angular-client`, clear it.
The remake must be merged and deployed before either live site changes.

The previous Angular implementation, including the Safari startup fix, remains
in Git history at `acf1767`. It is removed from this branch to keep one maintained
implementation and one dependency lockfile. `game.ipynb` is the original Python
experiment and is not deployed.
