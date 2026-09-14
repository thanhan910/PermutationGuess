# Dependency security maintenance

This project uses supported Node.js 24 LTS and Angular releases. It builds a
static browser application; Node.js is used for development and deployment
builds, not as a production application server.

## Local checks

Select Node.js 24 before installing packages. The application directory contains
an `.nvmrc`; the minimum patched version is recorded in `package.json` engines.

```sh
cd angular-client
npm ci
npm run audit:dependencies
npm run test:ci
npm run test:browser
npm run build:github
npm run build:netlify
```

The audit includes development and transitive dependencies, and fails for any
known vulnerability rated low or above. An unavailable audit service also fails
the check rather than reporting a clean result. `npm audit --omit=dev` can be
used separately to inspect runtime dependencies, but does not replace the full
audit required for deployment.

## Ongoing updates

- GitHub Actions audits, tests, and builds on pull requests, pushes to `main`,
  manual runs, and a daily schedule. Pull requests and scheduled runs do not
  deploy. GitHub Pages deployment depends on these checks passing.
- Netlify audits dependencies before its production build.
- Dependabot checks npm dependencies and GitHub Actions weekly. Related Angular,
  TypeScript, and Zone.js updates are grouped for compatibility review.
- GitHub Actions are pinned to release commit SHAs, with version comments so
  Dependabot can propose updates. Checkout does not retain Git credentials.
- Both deployment platforms select Node.js 24, allowing new LTS patches to be
  picked up on subsequent builds. Review the Node minimum version in
  `package.json` when Node security releases are published.

Review update pull requests and merge them after the audit, browser tests, and
both builds pass. Use Angular's migration tools for major upgrades. Do not use
`npm audit fix --force` or disable peer-dependency validation to hide findings.

Repository owners should enable Dependabot alerts/security updates and require
the workflow's `build` check before merging into `main`. These GitHub account
settings are separate from the files committed here. Configure workflow failure
notifications so new advisories found by scheduled runs are reviewed.

## Evidence and limits

Keep the lockfile, reviewed update commits, CI logs, and audit results as evidence
of maintenance. For an inventory, run `npm sbom --sbom-format cyclonedx` from
`angular-client/` and save the output with the relevant release records.

An npm audit checks published advisories for npm dependencies. It does not prove
the absence of vulnerabilities, assess all application code or hosting settings,
or certify compliance with a specific standard. No compliance standard has been
specified for this project.
