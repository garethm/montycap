# ADR: fast-check

fast-check is the property-based testing library used to generate inputs for the automated test suite.

## Decision

Use **fast-check** (pinned to exact version in `package.json`) for property-based test input generation. It is imported directly in test files alongside vitest's assertion utilities.

## Rationale

**The most actively maintained property-based testing library in the JavaScript ecosystem.** fast-check has a comprehensive set of built-in arbitraries, strong TypeScript support, and best-in-class counterexample shrinking. jsverify, the historical alternative, has not seen active development since 2020.

**Shrinking makes failures actionable.** When fast-check finds a failing input it automatically shrinks it to the minimal counterexample. This is particularly valuable for security findings, where the minimal payload is often more informative than the raw generated input.

**Directly expresses the specification.** The project's test requirements are invariant-shaped — mathematical bounds that must hold across all inputs, security properties that must hold for all user-supplied strings. fast-check's API maps naturally to this: `fc.assert(fc.property(...))` reads as a statement of the invariant.

## Health Assessment

Assessed 2026-05-11 against the criteria in [dependency-policy.md](dependency-policy.md).

| Criterion | Assessment |
|---|---|
| **Maintenance activity** | ✅ Actively maintained; frequent releases |
| **Security posture** | ✅ No known unresolved CVEs with CVSS ≥ 7.0 |
| **Issue responsiveness** | ✅ Highly responsive maintainer; detailed issue engagement |
| **Download trend** | ✅ Strong and growing npm download trajectory |
| **Maintainer continuity** | ⚠️ Primarily a single maintainer; mitigated by active community and broad adoption |
| **Deprecation status** | ✅ Not deprecated; the clear community standard for JS property-based testing |

## Supply Chain Implications

- **Type**: npm dev dependency
- **Transitive dependencies**: minimal; reviewed at adoption and monitored by Dependabot
- **Lifecycle scripts**: none required; compatible with `npm ci --ignore-scripts`

## Consequences

### Benefits

- Hundreds of generated inputs per second provide coverage that hand-written examples cannot match
- Shrinking produces minimal counterexamples, making failures easy to diagnose
- Arbitraries for strings, numbers, arrays, and Unicode are available out of the box

### Risks

- Primarily maintained by a single author; continuity depends on that individual remaining active

## Rejected Approaches

**jsverify.** The historical alternative for JS property-based testing. Not actively maintained since 2020; fast-check is the clear successor and community standard.

**Other PBT libraries (proptest-js, etc.).** Smaller communities, less comprehensive arbitraries, and less mature shrinking than fast-check.

## References

- [../development/testing.md](../development/testing.md)
- [dependency-policy.md](dependency-policy.md)
