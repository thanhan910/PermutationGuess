# PermutationGuess

A five-item permutation guessing game with six attempts. Both hosted sites build
the same Angular application in `angular-client/`:

- GitHub Pages: https://thanhan910.github.io/PermutationGuess/
- Netlify: https://pggame.netlify.app/

## Development

Use Node.js 22 and the project's local Angular CLI:

```sh
cd angular-client
npm ci
npm start
```

Open http://localhost:4200/. Edit `src/app/game/` for the game logic, template,
styles, and regression tests. The guess limit is `maxGuesses` in
`src/app/game/game.component.ts`.

```sh
npm run test:ci
npm run build:github
npm run build:netlify
```

Tests require Chrome (or set `CHROME_BIN` to a compatible Chromium executable).
Each build writes to `angular-client/dist/angular/browser/` and replaces the
previous build. Build output and dependencies are ignored by Git.

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
It can also be started manually from the Actions tab.

### Netlify: one-time migration

The existing `pggame` site was configured to publish `gh-pages-angular`. Switch
its **production branch** to `main` in **Project configuration > Build & deploy >
Continuous deployment > Branches and deploy contexts** after this cleanup is
committed and pushed.

The root `netlify.toml` supplies the build settings:

- Base directory: `angular-client`
- Build command: `npm run build:netlify`
- Publish directory: `dist/angular/browser` (relative to the base directory)
- Node.js: `22`

If a package directory or custom configuration-file path is set in Netlify,
clear any old value pointing at `angular`, `angular-server`, or `gh-pages-angular`.
Trigger a production deploy after switching branches. Later pushes to `main`
will update both sites automatically while auto publishing is enabled.

The `gh-pages-angular` branch is no longer used by either deployment after this
migration. No deployment token or committed JavaScript bundles are required.

## Repository layout

- `angular-client/`: the maintained app and its tests.
- `.github/workflows/deploy-angular.yml`: GitHub Pages deployment.
- `netlify.toml`: Netlify build configuration.
- `game.ipynb`: the original Python experiment; not part of either deployment.

The old `angular-server/` and `vanilla/` implementations, the `angular/` build
directory, and generated files at the repository root were removed during
consolidation. Their history remains available in Git.
