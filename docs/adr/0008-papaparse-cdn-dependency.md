# ADR-0008: PapaParse as the CSV Library

## Status

Accepted

## Context

ADR-0007 mandates RFC 4180 compliance for CSV import and export, and decides to delegate parsing and serialisation to a browser-compatible external library loaded via CDN. This ADR records the library selection per the dependency policy in ADR-0005.

The requirements from ADR-0007 constrain the candidate pool to libraries that:

- run in the browser without a bundler (CDN-distributable)
- are RFC 4180 compliant
- can be loaded via cdnjs (consistent with the existing Chart.js pattern)

## Decision

Use **PapaParse** (v5.x) as the CSV parsing and serialisation library. Load it from cdnjs with a Subresource Integrity hash pinned in `src/template.html`.

## Rationale

### Only viable browser-native candidate

The major JavaScript CSV libraries split into two groups:

| Library | Browser-compatible? | CDN-distributable? |
|---|---|---|
| **PapaParse** | Yes | Yes |
| csv-parse | No (Node.js streams) | No |
| fast-csv | No (Node.js streams) | No |
| d3-dsv | Yes | Yes |

csv-parse and fast-csv depend on Node.js stream primitives and cannot run in the browser without a bundler. That leaves PapaParse and d3-dsv as viable candidates.

### PapaParse over d3-dsv

d3-dsv is part of the D3 visualisation ecosystem and provides competent RFC 4180 parsing. PapaParse is preferred on two grounds:

1. **Purpose-built for the use case**: PapaParse is a standalone CSV parser designed specifically for browser use, including file input handling, streaming large files, and explicit RFC 4180 compliance documentation. d3-dsv is a general delimiter-separated-values library that handles CSV as one of several formats; its browser CSV support is functional but not its primary focus.

2. **Adoption signal**: PapaParse has 5–11M weekly npm downloads vs d3-dsv's lower standalone count. Broader adoption means more edge cases exercised in production and a larger community surface for catching bugs.

## Health Assessment

Assessed 2026-05-10 against the criteria in ADR-0005.

| Criterion | Assessment |
|---|---|
| **Maintenance activity** | ✅ v5.5.x released within 12 months; active commit history |
| **Security posture** | ✅ One past ReDOS vulnerability, patched promptly; no current CVEs with CVSS ≥ 7.0 |
| **Issue and PR responsiveness** | ✅ Maintainers engaged; active issue tracker on a high-traffic project |
| **Download trend** | ✅ 5–11M weekly downloads (source-dependent); stable trajectory |
| **Maintainer continuity** | ✅ 2 listed maintainers; broad community usage |
| **Explicit deprecation or successor** | ✅ Not deprecated; no known recommended replacement |

## Supply Chain Implications

- **npm dependencies added**: none — PapaParse is not installed via npm
- **CDN URL**: `https://cdnjs.cloudflare.com/ajax/libs/PapaParse/<version>/papaparse.min.js`
- **Integrity control**: SRI hash pinned in `src/template.html`; must be updated on version upgrade
- **Runtime availability**: requires cdnjs to be reachable — the same availability dependency already accepted for Chart.js
- **Transitive surface**: none (PapaParse has no production dependencies)
- **Page weight**: approximately 50 KB uncompressed (~20 KB gzip)

## Consequences

### Positive

- RFC 4180 compliance delivered by a purpose-built, battle-tested library with years of production edge-case coverage
- No npm supply chain addition; no lock file changes; no `--ignore-scripts` exposure
- Consistent with the Chart.js CDN pattern — no new infrastructure or build process required
- SRI pinning enforced by the browser; the file cannot be substituted at the CDN without breaking the hash check

### Negative

- A second CDN runtime dependency is introduced; the CSV feature fails if cdnjs is unreachable
- The SRI hash must be manually updated when upgrading PapaParse — Dependabot does not cover CDN dependencies
- ~20 KB of additional page weight (gzip)

## Alternatives Considered

### Alternative 1: d3-dsv

A delimiter-separated-values library from the D3 ecosystem; RFC 4180 capable and browser-compatible.

**Rejected because**: d3-dsv is general-purpose and not primarily focused on browser CSV; PapaParse is purpose-built for this use case and has broader adoption indicating more thorough real-world validation.

### Alternative 2: csv-parse

The most widely downloaded CSV library on npm (~1.4M weekly downloads); RFC 4180 compliant.

**Rejected because**: csv-parse targets Node.js stream environments and cannot be loaded via CDN without a bundler.

### Alternative 3: fast-csv

A Node.js streaming CSV library.

**Rejected because**: same reason as csv-parse — Node.js-only, not CDN-distributable.

## References

- [ADR-0005: Dependency Decision Policy](./0005-dependency-decision-policy.md)
- [ADR-0007: RFC 4180 Compliance for CSV Import and Export](./0007-rfc4180-csv-compliance.md)
- [PapaParse documentation](https://www.papaparse.com/)
- [PapaParse on cdnjs](https://cdnjs.cloudflare.com/ajax/libs/PapaParse/)
- [PapaParse GitHub](https://github.com/mholt/PapaParse)
- [Subresource Integrity – MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
