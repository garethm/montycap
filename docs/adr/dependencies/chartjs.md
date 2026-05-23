# ADR: Chart.js

Chart.js is the data visualisation library, loaded via CDN to render the workload histogram in the results display.

## Decision

Use **Chart.js 4.5.0** loaded from cdnjs with a pinned version and Subresource Integrity hash in `src/template.html`. The SRI hash must be updated whenever the version is upgraded.

## Rationale

**De facto standard for browser-based charting.** Chart.js is the most widely adopted browser charting library, providing the histogram chart type needed for the workload distribution display with minimal configuration. Its API is stable, well-documented, and familiar to most web developers.

**Proportionate to the requirement.** The application needs a single chart type — a histogram of weekly workload. Chart.js delivers this without the overhead of heavier visualisation frameworks designed for interactive data exploration.

**Consistent with the CDN pattern.** Loading via cdnjs with SRI pinning requires no new infrastructure and is consistent with how PapaParse is loaded.

## Health Assessment

Assessed 2026-05-11 against the criteria in [dependency-policy.md](dependency-policy.md).

| Criterion | Assessment |
|---|---|
| **Maintenance activity** | ✅ Actively maintained; regular releases |
| **Security posture** | ✅ No known unresolved CVEs with CVSS ≥ 7.0 |
| **Issue responsiveness** | ✅ Active maintainer team; responsive issue tracker |
| **Download trend** | ✅ Millions of weekly downloads; stable and growing |
| **Maintainer continuity** | ✅ Multiple active maintainers; large community |
| **Deprecation status** | ✅ Not deprecated; no known recommended replacement |

## Supply Chain Implications

- **Type**: CDN runtime dependency
- **CDN URL**: `https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.0/chart.umd.min.js`
- **Integrity control**: SRI hash pinned in `src/template.html`; must be updated on version upgrade
- **npm dependencies added**: none
- **Transitive surface**: none at runtime (CDN-loaded)
- **Runtime availability**: requires cdnjs to be reachable

## Consequences

### Benefits

- Histogram rendering with minimal implementation effort
- SRI pinning enforced by the browser
- No npm supply chain addition

### Risks

- The workload chart fails to render if cdnjs is unreachable at runtime
- The SRI hash must be manually updated when upgrading — Dependabot does not cover CDN dependencies

## Rejected Approaches

**D3.js.** A powerful data manipulation and visualisation toolkit, but designed for building custom visualisations from primitives. The additional complexity is not warranted for a single standard chart type.

**Native Canvas API.** Would require implementing the histogram chart entirely in-house. The ongoing maintenance cost is not justified when Chart.js provides the needed chart type out of the box.

**Plotly.js.** Feature-rich interactive charting library, but significantly heavier than Chart.js. The additional capabilities (3D charts, statistical plots, advanced interactivity) are not needed.

## References

- [dependency-policy.md](dependency-policy.md)
- [../structure/source-and-build.md](../structure/source-and-build.md)
