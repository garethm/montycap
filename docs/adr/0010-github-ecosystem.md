# ADR-0010: GitHub Ecosystem for CI/CD, Automation, and Project Management

## Status

Accepted

> **Supplemented by [ADR-0013: Security Policy and Vulnerability Disclosure](./0013-security-policy.md)**: extends the GitHub ecosystem commitment to include GitHub's native private vulnerability reporting and Security Advisories infrastructure.

## Context

The project is hosted on GitHub and required decisions about CI/CD, automated dependency management, deployment hosting, and code ownership. These concerns could be met by a combination of third-party services (CircleCI, Netlify, Renovate, etc.) or by relying primarily on the tooling GitHub provides natively.

The project's goals favour simplicity and minimal operational overhead: it is a single-file browser application with a small contributor surface and no server-side component.

## Decision

Adopt the GitHub platform's native tooling for all CI/CD and project automation concerns:

- **GitHub Actions** for CI (lint, build, HTML validation, tests), deployment, dependency review, and housekeeping (stale issues)
- **GitHub Pages** for hosting the built application
- **Dependabot** for automated dependency update pull requests
- **CODEOWNERS** (`.github/CODEOWNERS`) to declare code ownership and automatically request reviews

## Rationale

### Single platform reduces operational surface

Using GitHub-native tooling means no additional accounts, credentials, or service integrations to manage. Secrets, permissions, and access controls are all managed in one place. Failures and logs are co-located with the code and pull requests that caused them.

### GitHub Actions is sufficient for the CI workload

The CI pipeline is straightforward: install dependencies, lint, build, validate HTML, run tests. GitHub Actions handles this without any features that would require a more capable CI platform. The free tier for public repositories covers the project's needs entirely.

### GitHub Pages is the natural deployment target

The output is a single static HTML file with no server requirements. GitHub Pages serves static files from a branch or directory with no configuration beyond enabling it in repository settings. This avoids any external hosting dependency.

### Dependabot is zero-configuration for basic coverage

Dependabot monitors `package.json` for npm dependency updates and opens pull requests automatically. The supply chain stance in ADR-0005 (exact pinning, `npm ci --ignore-scripts`, committed lock file) means Dependabot PRs are the primary mechanism for receiving upstream security patches. Enabling it requires only a `.github/dependabot.yml` file — no external service or token.

### CODEOWNERS makes review requirements explicit

A `CODEOWNERS` file declares who is responsible for each part of the repository, enabling GitHub to automatically request reviews from the right people on pull requests. This is a lightweight mechanism that integrates directly with GitHub's PR workflow.

## Consequences

### Positive

- No external service accounts, credentials, or integrations to manage
- CI results, deployment status, and Dependabot PRs are all visible in the GitHub UI alongside the code
- GitHub Pages deployment is automatic on merge to `main` with no separate pipeline to maintain
- Dependabot PRs arrive without any manual polling or scheduling

### Negative

- The project is more tightly coupled to GitHub: migrating to another host (GitLab, Forgejo, etc.) would require replacing all workflows, Dependabot config, and GitHub Pages hosting simultaneously
- GitHub Actions has usage limits; while the free tier is currently sufficient, a significant increase in CI load could incur cost
- Dependabot does not cover CDN dependencies (Chart.js, PapaParse) — those are outside its scope and must be managed manually per ADR-0005

## Alternatives Considered

### Alternative 1: Third-party CI (CircleCI, GitHub Actions alternatives)

Use a dedicated CI platform such as CircleCI, Travis CI, or Buildkite.

**Rejected because**: the additional account, credential management, and webhook configuration are not justified for a pipeline this simple. GitHub Actions provides equivalent capability with zero additional service dependencies.

### Alternative 2: Netlify or Vercel for deployment

Use a frontend hosting platform for deployment rather than GitHub Pages.

**Rejected because**: the application is a single static file with no build-time environment variables, preview deployments, or edge functions. GitHub Pages serves this use case with no additional configuration or account. Netlify and Vercel would add an external service dependency for no functional gain.

### Alternative 3: Renovate Bot for dependency updates

Use Renovate as an alternative to Dependabot for automated dependency PRs.

**Rejected because**: Dependabot is built into GitHub and requires no installation or configuration beyond a single YAML file. Renovate offers more flexibility and grouping options but that flexibility is not needed for a project with four npm dev dependencies. Dependabot is the lower-friction choice at this scale.

### Alternative 4: No automated dependency updates

Manage dependency updates manually, triggered by Dependabot alerts or periodic review.

**Rejected because**: ADR-0005 identifies periodic review as a requirement, and Dependabot PRs are the practical mechanism for receiving security patches promptly. Manual-only updates create a lag between a CVE being published and a patch being applied.

## References

- [ADR-0001: Repository Structure Reorganization](./0001-repository-structure.md)
- [ADR-0003: Property-Based Testing](./0003-property-based-testing.md) — establishes `npm ci --ignore-scripts` and Dependabot as supply chain controls
- [ADR-0005: Dependency Decision Policy](./0005-dependency-decision-policy.md) — Dependabot is cited as a monitoring control
- [ADR-0009: Pre-commit Application Validation](./0009-precommit-application-validation.md) — local hook complement to GitHub Actions CI
- [GitHub Actions documentation](https://docs.github.com/en/actions)
- [GitHub Pages documentation](https://docs.github.com/en/pages)
- [Dependabot documentation](https://docs.github.com/en/code-security/dependabot)
