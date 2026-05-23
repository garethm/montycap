# ADR: PapaParse

PapaParse is the CSV parsing and serialisation library, loaded via CDN to implement RFC 4180-compliant import and export.

## Decision

Use **PapaParse v5.x** loaded from cdnjs with a pinned version and Subresource Integrity hash in `src/template.html`. The SRI hash must be updated whenever the version is upgraded.

## Rationale

**The only purpose-built browser-native CSV candidate.** The major JavaScript CSV libraries split into two groups: Node.js streaming libraries (csv-parse, fast-csv) that cannot be loaded via CDN without a bundler, and browser-compatible libraries. Of the browser-compatible candidates, PapaParse is purpose-built for browser CSV handling — including file input, RFC 4180 compliance, and streaming large files — while d3-dsv handles CSV as one of several delimiter-separated formats without the same degree of browser focus.

**Broad adoption signals thorough real-world validation.** PapaParse has millions of weekly npm downloads, indicating extensive production use across diverse edge cases that a less-adopted library would not have encountered.

**Consistent with the CDN pattern.** Loading via cdnjs with SRI pinning is the same pattern used for Chart.js, requiring no new infrastructure or build process changes.

## Health Assessment

Assessed 2026-05-10 against the criteria in [dependency-policy.md](dependency-policy.md).

| Criterion | Assessment |
|---|---|
| **Maintenance activity** | ✅ v5.5.x released within 12 months; active commit history |
| **Security posture** | ✅ One past ReDOS vulnerability, patched promptly; no current CVEs with CVSS ≥ 7.0 |
| **Issue responsiveness** | ✅ Maintainers engaged; active issue tracker |
| **Download trend** | ✅ Millions of weekly downloads; stable trajectory |
| **Maintainer continuity** | ✅ Multiple listed maintainers; broad community usage |
| **Deprecation status** | ✅ Not deprecated; no known recommended replacement |

## Supply Chain Implications

- **Type**: CDN runtime dependency
- **CDN URL**: `https://cdnjs.cloudflare.com/ajax/libs/PapaParse/<version>/papaparse.min.js`
- **Integrity control**: SRI hash pinned in `src/template.html`; must be updated on version upgrade
- **npm dependencies added**: none (also available as npm dev dependency for test environments)
- **Transitive surface**: none (PapaParse has no production dependencies)
- **Runtime availability**: requires cdnjs to be reachable — the same availability dependency accepted for Chart.js

## Consequences

### Benefits

- RFC 4180 compliance delivered by a purpose-built, battle-tested library with years of production edge-case coverage
- SRI pinning enforced by the browser; the file cannot be substituted at the CDN without breaking the hash check
- No npm supply chain addition for the runtime dependency

### Risks

- The CSV feature fails if cdnjs is unreachable at runtime
- The SRI hash must be manually updated when upgrading — Dependabot does not cover CDN dependencies

## Rejected Approaches

**d3-dsv.** Browser-compatible and RFC 4180 capable, but general-purpose across multiple delimiter formats rather than purpose-built for CSV. PapaParse has broader adoption indicating more thorough real-world validation.

**csv-parse.** Most widely downloaded CSV library on npm but targets Node.js stream environments; cannot be loaded via CDN without a bundler.

**fast-csv.** Same reason as csv-parse — Node.js-only.

**Custom RFC 4180 implementation.** RFC 4180 has enough edge cases (embedded newlines, escaped quotes, CRLF/LF tolerance, BOM handling) that a correct implementation requires ongoing maintenance and testing. The cost of in-house ownership is not justified when a healthy browser-compatible library is available.

## References

- [../standards/csv-format.md](../standards/csv-format.md)
- [dependency-policy.md](dependency-policy.md)
