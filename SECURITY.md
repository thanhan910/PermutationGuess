# Dependency security maintenance

This site serves static HTML, CSS and JavaScript with no runtime dependencies.
Node.js 24 LTS (at least 24.21.0) is used for development, builds and tests only.
Playwright and Acorn are development dependencies; they are not shipped to users.

## Checks

Run from the repository root:

```sh
npm ci
npm run audit:dependencies
npm run test:ci
npx playwright install --with-deps chromium firefox webkit
npm run test:browser
```

The full audit includes development and transitive dependencies and fails for any
known vulnerability rated low or above. An unavailable audit service also fails
the check. Do not replace it with an audit that omits development dependencies.

GitHub Actions audits, tests and builds on pull requests, pushes to main, manual
runs and daily scheduled runs. Pull requests and scheduled runs do not deploy.
Netlify audits before building. GitHub Actions are pinned to release commit SHAs;
checkout does not retain credentials. Dependabot checks npm and Actions weekly.

Merge dependency updates after the audit, game tests and browser tests pass.
Retain the ES5 syntax and old-browser API/layout constraints when editing browser
code. Test legacy browsers separately from the current Playwright engines.
Archived browser binaries used for optional compatibility tests are not part of
the site or npm dependencies; keep them isolated from normal browsing.

Repository owners should enable Dependabot alerts/security updates and require
the workflow's build check before merging into main. Node 24 selects new LTS
patches in both hosts; review the minimum version after security releases.

The lockfile, CI logs and audit results document dependency maintenance. An npm
audit does not prove the absence of vulnerabilities or assess hosting settings.
