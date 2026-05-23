# ADR: Dependency Policy

Every new direct dependency requires an ADR documenting its purpose, alternatives considered, health assessment, and supply chain implications before it is introduced.

## Decision

### Scope

The policy applies to:

- **npm dependencies** — any addition to `devDependencies` in `package.json`
- **CDN-linked runtime libraries** — any third-party script added to `src/template.html` via a `<script>` tag

### Required ADR content

Each dependency ADR must document:

1. What the dependency does and why it is needed
2. Alternatives considered and why they were not chosen
3. A health assessment against the criteria below
4. Supply chain implications (npm: transitive dependency count, lifecycle script requirements; CDN: pinned version and SRI hash requirement)

### Health assessment criteria

| Criterion | Healthy signal | Unhealthy signal |
|---|---|---|
| **Maintenance activity** | Release or meaningful commit activity within 12 months | No releases or commits for over 12 months |
| **Security posture** | No unresolved CVEs with CVSS ≥ 7.0; Dependabot alerts addressed promptly | Known unresolved high or critical CVEs |
| **Issue responsiveness** | Maintainers respond to bug reports and PRs within a reasonable time | Large backlog of unacknowledged issues |
| **Download trend** | Stable or growing weekly download count | Sharp, sustained decline suggesting community abandonment |
| **Maintainer continuity** | More than one active maintainer or backed by an organisation | Single maintainer with no succession plan |
| **Deprecation status** | Not deprecated; no known recommended replacement | Marked deprecated or maintainers recommend migrating away |

### Periodic review

Dependencies must be reviewed periodically. The outcome — including date, dependencies assessed, and actions taken or deferred — is recorded in `docs/development/dependency-review-log.md`. An entry is required even when no action is taken.

A dependency failing one criterion warrants monitoring and a note in the review log. Failure of two or more criteria warrants a replacement ADR.

### Grandfathered dependencies

The dependencies present when this policy was adopted — `eslint`, `fast-check`, `happy-dom`, `html-validate`, `vitest` (npm) and Chart.js, PapaParse (CDN) — are included in the first periodic health review rather than requiring retroactive ADRs for their original selection. Individual ADRs for each have since been written.

## Rationale

**Supply chain risk is proportional to dependency count.** Every added package is an additional trust decision. Keeping the dependency surface small and intentional is the most effective first-order control, complementing the existing controls of exact pinning, a committed lock file, `npm ci --ignore-scripts`, and Dependabot.

**Decisions without records get revisited unnecessarily.** When a dependency was added without documented rationale, future maintainers cannot tell whether alternatives were considered or whether the choice is still the right one. An ADR makes the decision durable.

**Unused and unhealthy dependencies compound risk without providing value.** A dependency that is no longer used still appears in the lock file, is downloaded in CI, and may generate Dependabot alerts. Periodic review keeps the dependency surface accurate and honest.

## Consequences

### Benefits

- Every direct dependency has a corresponding record of why it exists and what was considered
- Alternatives are evaluated and health is assessed before committing to a package
- Periodic review ensures removed and replaced dependencies are recorded, keeping the ADR set accurate

### Risks

- Small overhead when adding any new dependency; contributors under time pressure may find the requirement friction

## Rejected Approaches

**No formal policy — rely on PR review.** PR descriptions are not surfaced when reading the codebase later, review quality is inconsistent, and there is no forcing function to consider alternatives.

**Record decisions in PR descriptions only.** PR descriptions are not visible in the repository tree and are not updated if the decision later changes.

**ADRs for production dependencies only.** In this project, dev dependencies run in CI with the same supply chain exposure as the application itself. The production/dev distinction does not meaningfully reduce risk here.

## References

- [dependency-review-log.md](../development/dependency-review-log.md)
- [../security/openssf-scorecard.md](../security/openssf-scorecard.md)
