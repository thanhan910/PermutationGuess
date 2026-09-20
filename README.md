# PermutationGuess

A permutation guessing game: drag the items into an order and the game reports
how many sit in the correct position. Both hosted sites build the same Angular
application in `angular-client/`:

- GitHub Pages: https://thanhan910.github.io/PermutationGuess/
- Netlify: https://pggame.netlify.app/

## Puzzle sizes

Each size is served from its own path, and the deployment root serves five items.
So https://pggame.netlify.app/ and https://pggame.netlify.app/5/ are the same
board, and /6/, /7/ and /8/ are the larger ones. A size-n board uses the first n
items of `ITEM_COLORS`, so every board contains the one below it.

| Items | Path | Guesses allowed | Why |
| --- | --- | --- | --- |
| 5 | `/` and `/5/` | 6 | the long-standing budget for this board |
| 6 | `/6/` | 7 | proven optimum |
| 7 | `/7/` | 8 | proven optimum |
| 8 | `/8/` | 10 | shortest strategy found; the proven lower bound is 9 |

Sizes, items, and guess budgets live in `angular-client/src/app/puzzle.ts`. The
size list is repeated in `angular-client/scripts/build-size-pages.mjs`, which
writes one page per size after each build; keep the two lists in step.

## Development

Use the latest Node.js 24 LTS patch (at least 24.21.0) and the project's local
Angular CLI. `angular-client/.nvmrc` selects Node 24; unsupported Node versions
are rejected during dependency installation.

```sh
cd angular-client
npm ci
npm start
```

Open http://localhost:4200/ for the five-item board, or http://localhost:4200/6/
and so on for the larger ones. Edit `src/app/game/` for the game logic, template,
styles, and regression tests, and `src/app/puzzle.ts` for the sizes, items, and
guess budgets.

```sh
npm run test:ci
npm run test:browser
npm run audit:dependencies
npm run build:github
npm run build:netlify
```

`test:ci` runs Vitest in a simulated DOM. `test:browser` runs the same tests in
headless Chromium through Playwright. Set `CHROME_BIN` to your installed Chrome
executable, or install Playwright's Chromium with `npx playwright install chromium`.
Each build writes to `angular-client/dist/angular/browser/` and replaces the
previous build. Every build also copies `index.html` into a `5/`, `6/`, `7/` and
`8/` directory, so each size is a real static page on both hosts and needs no
rewrite rules. The pages share one bundle: the built `index.html` carries an
absolute `<base href>`, and the app reads its size from the URL. Build output and dependencies are ignored by Git.

## Deployment

Both services should use the `main` branch. They build the same source separately
because their URL prefixes differ:

| Service | Build command (inside `angular-client`) | Base URL path |
| --- | --- | --- |
| GitHub Pages | `npm run build:github` | `/PermutationGuess/` |
| Netlify | `npm run build:netlify` | `/` |

### GitHub Pages

Keep **Settings > Pages > Source** set to **GitHub Actions**. The workflow in
`.github/workflows/deploy-angular.yml` builds and deploys on pushes to `main`.
It can also be started manually from the Actions tab. Pull requests and daily
scheduled runs audit dependencies, run tests, and build both deployment variants
without publishing a site.

### Netlify: one-time migration

The existing `pggame` site was configured to publish `gh-pages-angular`. Switch
its **production branch** to `main` in **Project configuration > Build & deploy >
Continuous deployment > Branches and deploy contexts** after this cleanup is
committed and pushed.

The root `netlify.toml` supplies the build settings:

- Base directory: `angular-client`
- Build command: `npm run audit:dependencies && npm run build:netlify`
- Publish directory: `dist/angular/browser` (relative to the base directory)
- Node.js: `24`

If a package directory or custom configuration-file path is set in Netlify,
clear any old value pointing at `angular`, `angular-server`, or `gh-pages-angular`.
Trigger a production deploy after switching branches. Later pushes to `main`
will update both sites automatically while auto publishing is enabled.

The `gh-pages-angular` branch is no longer used by either deployment after this
migration. No deployment token or committed JavaScript bundles are required.

## Repository layout

- `angular-client/`: the maintained app and its tests.
- `angular-client/src/app/puzzle.ts`: sizes, items, guess budgets, URL parsing.
- `angular-client/scripts/build-size-pages.mjs`: writes one static page per size.
- `.github/workflows/deploy-angular.yml`: GitHub Pages deployment.
- `netlify.toml`: Netlify build configuration.
- `game.ipynb`: the original Python experiment; not part of either deployment.

The old `angular-server/` and `vanilla/` implementations, the `angular/` build
directory, and generated files at the repository root were removed during
consolidation. Their history remains available in Git.

## Dependency maintenance

GitHub Pages and Netlify require a clean npm vulnerability audit before a new
deployment. Dependabot proposes weekly npm and GitHub Actions updates for review;
GitHub Actions are pinned to immutable release commits. See [SECURITY.md](SECURITY.md)
for the maintenance process, audit commands, and the GitHub settings to enable.
