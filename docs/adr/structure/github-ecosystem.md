# ADR: GitHub Ecosystem

The application is hosted and developed entirely within the GitHub platform, using GitHub's native tooling for CI/CD, deployment, dependency management, and project automation.

## Decision

- **GitHub Actions** — CI pipeline (lint, build, HTML validation, tests), deployment to GitHub Pages, dependency review, and housekeeping automation
- **GitHub Pages** — hosts the built application directly from the repository
- **Dependabot** — opens pull requests for npm dependency updates automatically
- **CODEOWNERS** — declares code ownership and triggers automatic review requests

## Rationale

**A single platform reduces operational surface.** Using GitHub-native tooling means no additional accounts, credentials, or service integrations to manage. Secrets, permissions, CI results, and deployment status are all co-located with the code and pull requests that produced them.

**Each tool is sufficient for the use case.** The CI pipeline is straightforward; GitHub Actions handles it without needing a more capable platform. The output is a single static file; GitHub Pages serves it with no configuration beyond enabling it. Dependabot covers the npm dependency graph with a single YAML file and no external service.

**Dependabot is the practical mechanism for receiving security patches.** The supply chain stance in [dependency-policy.md](../dependencies/dependency-policy.md) requires exact version pinning and a committed lock file. Dependabot PRs are how upstream security fixes arrive; without it, patches would depend on manual monitoring.

## Consequences

### Benefits

- No external service accounts, credentials, or integrations to maintain
- CI results, deployment status, and Dependabot PRs are all visible in the GitHub UI alongside the code
- GitHub Pages deployment is automatic on merge to `main`

### Risks

- The project is tightly coupled to GitHub; migrating to another host would require replacing all workflows, Dependabot configuration, and hosting simultaneously
- Dependabot does not cover CDN dependencies (Chart.js, PapaParse); those must be managed manually per the dependency policy

## Rejected Approaches

**Third-party CI (CircleCI, Travis CI).** The additional account, credential management, and webhook configuration are not justified for a pipeline this simple.

**Netlify or Vercel for deployment.** The application is a single static file with no preview deployments or edge functions. GitHub Pages serves this use case with no additional account or configuration.

**Renovate for dependency updates.** More flexible than Dependabot but requires installation and configuration. Dependabot is built into GitHub and needs only a YAML file; that is the lower-friction choice at this scale.

## References

- [dependency-policy.md](../dependencies/dependency-policy.md)
- [../security/openssf-scorecard.md](../security/openssf-scorecard.md)
- [../security/security-policy.md](../security/security-policy.md)
