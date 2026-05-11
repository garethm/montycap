# ADR: vitest

vitest is the test runner for the project's automated test suite.

## Decision

Use **vitest** (pinned to exact version in `package.json`) as the test runner. Tests are configured via `vitest.config.js` at the repository root.

## Rationale

**Native ES module support without additional configuration.** The source files in `src/` are written as ES modules. vitest supports them natively; Jest requires additional Babel or experimental flag configuration to handle ES modules, adding complexity for no benefit.

**Shared conventions with the broader Vite ecosystem.** vitest's configuration format is compatible with Vite's, which reduces the learning curve if a bundler is ever introduced and aligns with the direction of the JavaScript tooling ecosystem.

**Fast for small suites.** vitest is significantly faster than Jest for small test suites, which keeps the pre-commit validation hook acceptably quick.

## Health Assessment

Assessed 2026-05-11 against the criteria in [dependency-policy.md](dependency-policy.md).

| Criterion | Assessment |
|---|---|
| **Maintenance activity** | ✅ Actively maintained; frequent releases |
| **Security posture** | ✅ No known unresolved CVEs with CVSS ≥ 7.0 |
| **Issue responsiveness** | ✅ Active maintainer team; responsive issue tracker |
| **Download trend** | ✅ Rapidly growing adoption in the JavaScript ecosystem |
| **Maintainer continuity** | ✅ Multiple maintainers; backed by the Vite team |
| **Deprecation status** | ✅ Not deprecated; no known recommended replacement |

## Supply Chain Implications

- **Type**: npm dev dependency
- **Transitive dependencies**: moderate; reviewed at adoption and monitored by Dependabot
- **Lifecycle scripts**: none required; compatible with `npm ci --ignore-scripts`

## Consequences

### Benefits

- ES module source files are tested without transformation or additional configuration
- Fast execution keeps pre-commit validation overhead low

### Risks

- vitest is newer than Jest and less battle-tested in large enterprise environments; edge cases in configuration may surface that would not arise with Jest

## Rejected Approaches

**Jest.** Requires additional configuration to handle ES modules natively. vitest is the better fit given the project's ES module source structure, and is the community standard for Vite-adjacent projects.

## References

- [../development/testing.md](../development/testing.md)
- [dependency-policy.md](dependency-policy.md)
