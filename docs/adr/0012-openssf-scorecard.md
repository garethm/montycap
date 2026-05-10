# ADR-0012: OpenSSF Scorecard for Supply Chain Security Posture Assessment

## Status

Accepted

## Context

The project has several supply chain security controls in place: exact dependency pinning, a committed lock file, `npm ci --ignore-scripts` in CI, Dependabot monitoring, and the dependency decision policy in ADR-0005. These controls address specific risks but provide no aggregate, externally-comparable view of the project's overall security posture.

Without an automated assessment, it is easy for individual controls to degrade over time — branch protection weakened, a dangerous workflow pattern introduced, CI checks removed — without any signal that the posture has regressed.

## Decision

Run the **OpenSSF Scorecard** (https://securityscorecards.dev/) on a weekly schedule via GitHub Actions. Results are published to GitHub's Security tab via the Code Scanning API, making the current score and individual check results visible in the repository alongside other security alerts.

## Rationale

### Industry-standard benchmark

OpenSSF Scorecard assesses projects against a defined set of supply chain security checks, each producing a score from 0–10. The checks cover areas including branch protection, CI presence, dangerous workflow patterns, dependency pinning, binary artefacts, signed releases, and security policy. Using a standard benchmark means the project's posture can be compared against community norms and the criteria are maintained by the security community rather than in-house.

### Automated regression detection

Running Scorecard weekly means a regression (e.g. branch protection accidentally weakened, a new workflow using `pull_request_target` unsafely) surfaces within days rather than being discovered during an audit or incident. The GitHub Code Scanning integration surfaces failures as alerts that can be tracked and closed.

### Complements the manual dependency health criteria in ADR-0005

ADR-0005 defines qualitative health criteria for individual dependencies. Scorecard assesses the project itself as a dependency — how reliably it pins its own dependencies, whether its CI is trustworthy, whether it has a security policy. The two are complementary: ADR-0005 covers what the project consumes; Scorecard covers what the project publishes.

### Learning environment for compliance practices

This project is used as a learning environment to explore what supply chain compliance looks like at the small-project scale. Scorecard makes compliance requirements concrete and measurable, providing hands-on experience with the kinds of automated posture assessments that larger or higher-risk projects are expected to meet. Even where individual checks (signed releases, SLSA provenance) are not currently warranted, seeing their contribution to an overall score makes the trade-offs visible.

### No build artefact or code signing requirement

Scorecard's full set of checks includes signed releases and binary artefacts, which are not applicable to a browser-only project deployed via GitHub Pages. Inapplicable checks score 0 but do not invalidate the rest of the assessment. The checks that matter for this project (branch protection, CI, dangerous workflows, dependency pinning, security policy) all produce meaningful scores.

## Consequences

### Positive

- Automated weekly snapshot of security posture against a defined, community-maintained standard
- Regressions in branch protection, workflow permissions, or pinning surface as Code Scanning alerts
- A public Scorecard badge in the README gives contributors and users a quick view of posture
- No additional tooling account or credential required beyond the GitHub token available to Actions
- Provides concrete, measurable experience with compliance tooling at the small-project scale

### Negative

- Several checks (signed releases, binary artefacts) are not applicable and will score 0, which depresses the aggregate score without reflecting a real weakness
- The weekly schedule means a newly introduced regression could exist for up to seven days before detection
- Scorecard's read-only GitHub token scope means some checks (e.g. branch protection details) must use a token with broader permissions or will report incomplete results

## Alternatives Considered

### Alternative 1: SLSA framework

Implement SLSA (Supply-chain Levels for Software Artifacts) provenance for build artefacts.

**Rejected at this stage**: SLSA focuses on build provenance — proving that a specific artefact was produced by a specific build process. The deployed artefact here is `web/index.html` built by GitHub Actions, but the project has not established a signing or attestation step. SLSA is a meaningful future enhancement but is a heavier lift than Scorecard and addresses a different part of the risk profile.

### Alternative 2: Manual periodic audits only

Assess supply chain security posture manually during periodic dependency reviews (per ADR-0005).

**Rejected because**: manual audits are scheduled and retrospective; they do not detect regressions introduced between review cycles. Scorecard's automated weekly run provides continuous coverage at no marginal cost.

### Alternative 3: No aggregate posture assessment

Rely on individual controls (Dependabot, pinning, `--ignore-scripts`) without an overall posture view.

**Rejected because**: individual controls can degrade silently. An aggregate automated assessment provides a signal when the overall posture regresses, which individual controls do not provide on their own.

## References

- [OpenSSF Scorecard](https://securityscorecards.dev/)
- [OpenSSF Scorecard GitHub Action](https://github.com/ossf/scorecard-action)
- [ADR-0005: Dependency Decision Policy](./0005-dependency-decision-policy.md) — supply chain stance this complements
- [ADR-0010: GitHub Ecosystem](./0010-github-ecosystem.md) — GitHub Actions and Code Scanning infrastructure this relies on
- [ADR-0013: Security Policy and Vulnerability Disclosure](./0013-security-policy.md) — security policy check assessed by Scorecard
