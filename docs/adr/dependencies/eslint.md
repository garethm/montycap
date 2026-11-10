# ADR: ESLint

ESLint is the JavaScript linter run against the application sources before commit and in CI.

## Decision

Use **ESLint** (pinned to exact version in `package.json`) to lint `src/simulation.js` and `src/ui.js` with `npx eslint src/simulation.js src/ui.js`. Configuration lives in the flat config file `eslint.config.mjs`, which sets `ecmaVersion: 2020`, `sourceType: 'module'`, and declares the browser and CDN globals the sources rely on (`window`, `document`, `Chart`, `FileReader`, and others).

It runs in two places:

- The `validate` script in `package.json`, invoked by the pre-commit application validation hook
- The CI workflow (`.github/workflows/ci.yml`)

The configuration does not extend any shared rule set and enables no individual rules. ESLint therefore currently acts as a **syntax check** only: it fails on parse errors but reports nothing else. The declared globals are inert until a rule that consumes them, such as `no-undef`, is enabled.

## Rationale

**The de facto standard JavaScript linter.** ESLint has the broadest rule ecosystem, editor integration, and community knowledge of any JavaScript linter, so contributors are likely to already know it.

**Catches syntax errors before the build.** The build concatenates the sources into a single inline script; a syntax error in either file would break the whole application at load time. Linting the sources directly reports the error against the original file and line, rather than against the assembled `web/index.html`.

**Room to grow without changing tools.** Enabling rules is a configuration change, not a tooling change. The flat config already declares the project's globals, so adopting a rule set later requires no restructuring.

## Health Assessment

Assessed 2026-11-10 against the criteria in [dependency-policy.md](dependency-policy.md), consistent with the [2026-11-09 dependency review](../../development/dependency-reviews/2026-11-09.md).

| Criterion | Assessment |
|---|---|
| **Maintenance activity** | ✅ Actively maintained; frequent minor releases on the v10 line |
| **Security posture** | ✅ No known unresolved CVEs with CVSS ≥ 7.0 |
| **Issue responsiveness** | ✅ Dedicated core team with a structured triage process |
| **Download trend** | ✅ Very high and stable (~127M weekly downloads) |
| **Maintainer continuity** | ✅ OpenJS Foundation project with a multi-person core team and automated publishing |
| **Deprecation status** | ✅ Not deprecated; no recommended replacement |

## Supply Chain Implications

- **Type**: npm dev dependency
- **Transitive dependencies**: 75 packages per the lock file; the largest footprint of any dev dependency in the project (vitest: 22, html-validate: 12). Monitored by Dependabot
- **Lifecycle scripts**: none; compatible with `npm ci --ignore-scripts`

## Consequences

### Benefits

- Syntax errors are caught locally before commit and in CI, against the original source location
- A widely understood tool and config format for contributors
- Enabling rules later is a configuration-only change

### Risks

- **No lint rules are currently enforced.** Undefined identifiers, unused variables, and similar defects pass the lint step; README, CONTRIBUTING, and CLAUDE.md describe ESLint as linting without qualification, which may overstate the coverage it provides
- A 75-package transitive footprint for a check that currently provides syntax validation only

## Rejected Approaches

**Biome.** A fast, single-binary linter and formatter with no transitive npm dependencies. Not chosen when ESLint was adopted; it remains the most credible alternative should the transitive footprint become a concern.

**oxlint.** A fast Rust-based linter with ESLint-compatible rules. Narrower rule coverage and configuration ecosystem than ESLint.

**`node --check` only.** Would provide the same syntax checking ESLint currently delivers with no dependency, but forecloses adding lint rules without introducing a tool later.

**No linting.** Syntax errors would surface only after building and loading the application in a browser.

## References

- [dependency-policy.md](dependency-policy.md)
- [../development/precommit.md](../development/precommit.md)
- [2026-11-09 dependency review](../../development/dependency-reviews/2026-11-09.md)
