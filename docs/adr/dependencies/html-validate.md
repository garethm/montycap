# ADR: html-validate

html-validate is the offline HTML linter used to validate the built `web/index.html` before commit, in CI, and before deployment.

## Decision

Use **html-validate** (pinned to exact version in `package.json`) to validate the built artifact with `npx html-validate web/index.html`. No configuration file is committed, so the built-in `html-validate:recommended` preset applies.

It runs in three places:

- The `validate` script in `package.json`, invoked by the pre-commit application validation hook
- The CI workflow (`.github/workflows/ci.yml`)
- The deploy workflow (`.github/workflows/deploy.yml`), before publishing

## Rationale

**Runs entirely offline.** html-validate is a pure JavaScript validator that checks the document locally. Validation never sends the artifact to a third-party service, so it works without network access, is not subject to rate limits, and adds no external availability dependency to CI or the pre-commit hook.

**Validates the artifact that actually ships.** The build concatenates `src/template.html`, `src/styles.css`, and the JS sources into a single file. Validating the built `web/index.html` rather than the template catches problems introduced by assembly as well as by the source.

**Lint rules, not just conformance.** Beyond HTML specification conformance, the recommended preset enforces practices relevant to this project — notably `no-inline-style`, which backs the Content Security Policy's `style-src` restriction by rejecting inline styles before they reach a browser that would block them.

**Fast enough for a pre-commit hook.** Validation of the built file completes in under a second, keeping `npm run validate` cheap enough to run on every commit.

## Health Assessment

Assessed 2026-11-10 against the criteria in [dependency-policy.md](dependency-policy.md), consistent with the [2026-11-09 dependency review](../../development/dependency-reviews/2026-11-09.md).

| Criterion | Assessment |
|---|---|
| **Maintenance activity** | ✅ Actively maintained; multiple releases per week through October–November 2026 |
| **Security posture** | ✅ No known unresolved CVEs with CVSS ≥ 7.0 |
| **Issue responsiveness** | ✅ Issues and merge requests on GitLab receive timely maintainer engagement |
| **Download trend** | ✅ Stable (~397K weekly downloads); lower volume is expected for a specialised linting tool |
| **Maintainer continuity** | ⚠️ Single maintainer (`ext` / sidvind.com) with no organisational backing |
| **Deprecation status** | ✅ Not deprecated; no recommended replacement |

## Supply Chain Implications

- **Type**: npm dev dependency
- **Transitive dependencies**: 12 packages (chiefly `ajv` and its dependencies for configuration schema validation, plus `prompts`, `semver`, `kleur`, and the `@html-validate/stylish` formatter); monitored by Dependabot
- **Lifecycle scripts**: none; compatible with `npm ci --ignore-scripts`

## Consequences

### Benefits

- Markup errors and CSP-incompatible patterns are caught locally before commit rather than in CI or in the browser
- No network dependency, rate limits, or third-party data transfer during validation
- Zero configuration required; the recommended preset suits the project as-is

### Risks

- Primarily maintained by a single author; continuity depends on that individual remaining active
- With no committed configuration, a new major version may change the recommended preset and introduce new failures on upgrade. Exact pinning and Dependabot PRs make such changes visible and reviewable before they land

## Rejected Approaches

**W3C Nu HTML Checker via npm wrappers (`w3c-html-validator`, `node-w3c-validator`, `html-w3c-validator`).** These submit the document to `validator.w3.org`. They introduce a network dependency into the pre-commit hook and CI, are subject to rate limiting by the W3C service, and check conformance only, without lint rules such as `no-inline-style`.

**Nu HTML Checker run locally (`vnu-jar`).** The authoritative conformance checker, and offline. Rejected because it requires a Java runtime in both the development environment and CI, adding a toolchain the project otherwise does not need, and it offers no lint-style rules.

**Manual validation via the W3C web interface.** Easily skipped, not automatable in CI, and offers no protection against regressions.

**No HTML validation.** ESLint covers the JavaScript sources only; without HTML validation, markup errors and CSP-incompatible inline styles would surface only at runtime in the browser.

## References

- [dependency-policy.md](dependency-policy.md)
- [../development/precommit.md](../development/precommit.md)
- [../security/threat-modeling.md](../security/threat-modeling.md)
- [2026-11-09 dependency review](../../development/dependency-reviews/2026-11-09.md)
