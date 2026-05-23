# ADR: happy-dom

happy-dom is the DOM environment used by vitest when testing DOM-coupled functions in `src/ui.js`.

## Decision

Use **happy-dom** (pinned to exact version in `package.json`) as the vitest DOM test environment, configured via `vitest.config.js`.

## Rationale

**Smaller transitive dependency surface than jsdom.** jsdom is the most established DOM environment for Node.js testing but carries a large number of transitive dependencies. happy-dom achieves equivalent DOM coverage for this project's test requirements with a significantly lighter dependency footprint, consistent with the project's preference for a minimal supply chain.

**Recommended by the vitest project.** vitest's own documentation recommends happy-dom as the preferred DOM environment, which provides confidence in the integration and signals ongoing compatibility maintenance.

## Health Assessment

Assessed 2026-05-11 against the criteria in [dependency-policy.md](dependency-policy.md).

| Criterion | Assessment |
|---|---|
| **Maintenance activity** | ✅ Actively maintained; recent releases |
| **Security posture** | ✅ No known unresolved CVEs with CVSS ≥ 7.0 |
| **Issue responsiveness** | ✅ Active maintainer engagement |
| **Download trend** | ✅ Growing adoption, driven by vitest recommendation |
| **Maintainer continuity** | ⚠️ Primarily a single maintainer; mitigated by vitest project's dependency on it |
| **Deprecation status** | ✅ Not deprecated |

## Supply Chain Implications

- **Type**: npm dev dependency
- **Transitive dependencies**: significantly fewer than jsdom; reviewed at adoption and monitored by Dependabot
- **Lifecycle scripts**: none required; compatible with `npm ci --ignore-scripts`

## Consequences

### Benefits

- DOM-coupled functions in `src/ui.js` can be tested in Node.js without launching a browser
- Smaller transitive dependency surface compared to jsdom

### Risks

- happy-dom's DOM implementation may diverge from browser behaviour in edge cases; tests passing in happy-dom do not guarantee identical behaviour in all target browsers
- Primarily maintained by a single author

## Rejected Approaches

**jsdom.** The established alternative; more complete DOM implementation but a substantially larger transitive dependency surface. Not warranted given the project's preference for a minimal supply chain and vitest's recommendation of happy-dom.

## References

- [../development/testing.md](../development/testing.md)
- [dependency-policy.md](dependency-policy.md)
- [vitest.md](vitest.md)
