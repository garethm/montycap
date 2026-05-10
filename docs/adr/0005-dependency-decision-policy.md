# ADR-0005: Dependency Decision Policy

## Status

Accepted

## Context

The project currently has four direct dev dependencies — `eslint`, `fast-check`, `html-validate`, and `vitest` — all pinned to exact versions with a committed lock file and installed via `npm ci --ignore-scripts` in CI. This supply chain stance was established in ADR-0003 but applied implicitly rather than as a named policy.

As the project grows, new dependencies will be proposed (the immediate prompt is adding a DOM environment library for testing). Without an explicit policy, dependencies can be added casually: a package chosen quickly, alternatives not evaluated, and the supply chain cost not considered. Over time this erodes the deliberate, minimal dependency surface the project currently has.

A lightweight, consistent policy ensures that each addition to the dependency graph is intentional, its alternatives have been weighed, and the reasoning is recorded where future maintainers can find it.

## Decision

### Adding a dependency

Any new direct dependency — whether a production or development dependency — requires an ADR before it is added to `package.json`. The ADR must document:

1. **What the dependency does** and why it is needed
2. **Alternatives considered** and why they were not chosen
3. **Supply chain implications**: approximate transitive dependency count, whether lifecycle scripts are required, and how it fits within the existing pinning and `--ignore-scripts` policy
4. **Health assessment** against the criteria below

Transitive dependencies introduced by an approved direct dependency do not each require their own ADR, but the ADR for the direct dependency should acknowledge the transitive surface.

This policy applies to both `dependencies` and `devDependencies`. Dev dependencies run in CI and developer environments and carry the same supply chain risk as production dependencies in this context.

### Existing dependencies

The four dependencies present when this ADR was adopted (`eslint`, `fast-check`, `html-validate`, `vitest`) are grandfathered in. They do not require retroactive ADRs for their original adoption decision, but they must be included in the first periodic health review and any findings recorded at that time.

### Periodic review

The project should periodically review its existing dependencies to:

- **Remove dependencies that are no longer required**: unused packages should be removed promptly; the corresponding ADR (if one exists) should be updated to reflect the removal and the reason
- **Replace or remove dependencies that are no longer healthy**: the replacement or removal decision should itself be recorded as an ADR

**Review records**: the outcome of each periodic review — including the date, the dependencies assessed, and any actions taken or deferred — must be recorded in `docs/development/dependency-review-log.md`. This makes it unambiguous when each dependency was last assessed and what was decided. An entry is required even when no action is taken, so that a clean bill of health is also on record.

### Assessing dependency health

A dependency is considered healthy when it meets the following criteria. Each criterion should be evaluated when a dependency is first added and revisited during periodic review.

| Criterion | Healthy signal | Unhealthy signal |
|---|---|---|
| **Maintenance activity** | Release or meaningful commit activity within the past 12 months | No releases or commits for over 12 months |
| **Security posture** | No unresolved CVEs with a CVSS score ≥ 7.0; Dependabot alerts are addressed promptly | Known unresolved high or critical CVEs; security issues closed without fix |
| **Issue and PR responsiveness** | Maintainers respond to bug reports and PRs within a reasonable time | Large backlog of unacknowledged issues; PRs ignored for months |
| **Download trend** | Stable or growing weekly download count on npm | Sharp, sustained decline in downloads suggesting community abandonment |
| **Maintainer continuity** | More than one active maintainer, or backed by an organisation | Single maintainer with no succession plan or signs of disengagement |
| **Explicit deprecation or successor** | Not deprecated; no known recommended replacement | Marked deprecated on npm, or maintainers have publicly recommended migrating away |

A dependency that fails one criterion warrants monitoring and a note in the review log; failure of two or more criteria warrants a replacement ADR. The decision to replace or remove should be recorded even if it results in no change (i.e. no healthy alternative exists and the risk is explicitly accepted).

## Rationale

### Supply chain risk is proportional to dependency count

Every added package is an additional trust decision. The project's existing controls (exact pinning, lock file integrity, `--ignore-scripts`, Dependabot) reduce but do not eliminate the risk from each package and its transitive graph. Keeping the dependency surface small and intentional is the most effective first-order control.

### Decisions without records get revisited unnecessarily

When a dependency was added without documented rationale, future maintainers cannot tell whether alternatives were considered, whether the choice was deliberate, or whether the dependency is still the right one. An ADR makes the decision durable and reduces repeated evaluation.

### Unused and unhealthy dependencies compound risk without providing value

A dependency that is no longer used still contributes to the attack surface — it appears in the lock file, is downloaded in CI, and may receive Dependabot alerts. An unhealthy dependency that is not replaced represents an unacknowledged and unmitigated risk. Periodic review keeps the dependency surface accurate and honest.

### Review records make health assessments auditable

Without a log of when reviews happened and what was found, it is impossible to know whether a dependency has been recently assessed or silently neglected. The review log provides that record at minimal cost.

### The overhead is low and the forcing function is valuable

Writing an ADR for a dependency takes less time than the evaluation that should happen anyway. The policy makes that evaluation explicit rather than optional, and the record persists in the repository rather than in a PR description or a Slack thread.

## Consequences

### Positive

- The dependency surface remains auditable: every direct dependency has a corresponding record of why it exists and what was considered
- Forces evaluation of alternatives and a health assessment before committing to a package, reducing the risk of hasty choices
- The review log makes it immediately clear when each dependency was last assessed and what was decided
- Periodic review ensures removed and replaced dependencies are recorded, keeping the ADR set accurate over time
- Explicit health criteria make it unambiguous when a dependency warrants action
- Consistent with the existing supply chain security stance documented in ADR-0003

### Negative

- Small overhead when adding any new dependency; teams under time pressure may find the requirement friction
- Periodic review requires discipline to schedule and act on; without a trigger it can be deferred indefinitely
- Health criteria involve judgement calls (e.g. what counts as "responsive"); the table provides guidance but not a mechanical pass/fail
- Does not cover indirect upgrades to transitive dependencies (Dependabot PRs); those are handled by the existing lock file and integrity verification controls

## Alternatives Considered

### Alternative 1: No formal policy — rely on PR review

Evaluate new dependencies informally during code review, with no requirement to document the decision.

**Rejected because**: PR descriptions are not surfaced when reading the codebase later, review quality is inconsistent, and there is no forcing function to consider alternatives. The dependency ends up in `package.json` with no accessible rationale.

### Alternative 2: Record decisions in PR descriptions only

Require that the PR adding a dependency documents the alternatives considered, without a separate ADR.

**Rejected because**: PR descriptions are not visible in the repository tree and are not updated if the decision later changes. The ADR format places the record where it will be found during future maintenance and keeps it versioned alongside the code it describes.

### Alternative 3: Require ADRs only for production dependencies

Apply the policy to `dependencies` but not `devDependencies`.

**Rejected because**: In this project, dev dependencies run in CI and on developer machines with the same supply chain exposure as production dependencies. The distinction between runtime and build-time risk does not apply meaningfully to a single-file browser tool with no server component.

### Alternative 4: Use an automated tool to enforce dependency policies

Use a tool such as `license-checker` or a custom script to block unapproved packages in CI.

**Rejected because**: Automated enforcement operates at the package level (licence, known CVEs) but cannot assess the qualitative health criteria — maintainer continuity, responsiveness, community trajectory — that matter most for long-term supply chain health. Automated tools are a complement to, not a replacement for, deliberate human review.

## References

- [ADR-0003: Property-Based Testing](./0003-property-based-testing.md) — establishes the supply chain controls this policy builds on
- [ADR-0004: Branch Policy](./0004-branch-policy.md) — analogous lightweight process policy
- [Dependency review log](../development/dependency-review-log.md)
