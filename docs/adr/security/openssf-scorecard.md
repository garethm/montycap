# ADR: OpenSSF Scorecard

OpenSSF Scorecard runs on a weekly schedule via GitHub Actions, providing automated supply chain security posture assessment against an industry-standard benchmark.

## Decision

Scorecard runs weekly via the `ossf/scorecard-action` GitHub Action. Results are published to GitHub's Security tab via the Code Scanning API, surfacing individual check results alongside other security alerts. A badge in `README.md` provides a public summary of the current score.

## Rationale

**An industry-standard benchmark makes posture comparable and externally meaningful.** Scorecard assesses projects against a defined set of supply chain security checks — branch protection, CI presence, dangerous workflow patterns, dependency pinning, security policy, and others — each scored 0–10. Using a community-maintained benchmark means the criteria are not invented in-house and the score can be compared against community norms.

**Automated weekly runs detect regressions promptly.** A regression introduced between manual reviews — branch protection weakened, an unsafe workflow pattern added — surfaces within days as a Code Scanning alert rather than being discovered during an audit or incident.

**Complements the dependency policy.** [dependency-policy.md](../dependencies/dependency-policy.md) assesses what the project consumes. Scorecard assesses the project itself as a dependency — whether its CI is trustworthy, whether it pins its own dependencies, whether it has a security policy. The two are complementary.

**This project is used as a learning environment.** Scorecard makes supply chain compliance requirements concrete and measurable, providing hands-on experience with the kinds of automated posture assessments that larger or higher-risk projects are expected to meet.

## Consequences

### Benefits

- Automated weekly snapshot of security posture against a defined, community-maintained standard
- Regressions in branch protection, workflow permissions, or pinning surface as Code Scanning alerts
- No additional tooling account or credential required beyond the GitHub token available to Actions

### Risks

- Several checks (signed releases, binary artefacts) are not applicable to a browser-only project deployed via GitHub Pages and will score 0, depressing the aggregate without reflecting a real weakness
- A newly introduced regression could exist for up to seven days before the weekly run detects it

## Rejected Approaches

**SLSA provenance.** Focuses on build provenance — proving a specific artefact was produced by a specific build process. A meaningful future enhancement but a heavier lift that addresses a different part of the risk profile. Not warranted at the current scale.

**Manual periodic audits only.** Scheduled and retrospective; do not detect regressions introduced between review cycles. Scorecard's automated weekly run provides continuous coverage at no marginal cost.

## References

- [OpenSSF Scorecard](https://securityscorecards.dev/)
- [../structure/github-ecosystem.md](../structure/github-ecosystem.md)
- [../dependencies/dependency-policy.md](../dependencies/dependency-policy.md)
- [security-policy.md](security-policy.md)
