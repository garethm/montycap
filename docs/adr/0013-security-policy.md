# ADR-0013: Security Policy and Vulnerability Disclosure Process

## Status

Accepted

## Context

The project is a publicly accessible browser application that processes user-supplied CSV data and loads external CDN dependencies. It is hosted on GitHub as a public repository. Without a documented security policy, there is no clear path for a researcher or user who discovers a vulnerability to report it responsibly — the likely outcome is either a public issue (which discloses the vulnerability before a fix is available) or no report at all.

GitHub provides native infrastructure for private vulnerability reporting and coordinated disclosure via its Security Advisories feature.

## Decision

Maintain a `SECURITY.md` file at the repository root documenting:

- Which versions of the application are supported
- How to report a vulnerability privately (via GitHub's private vulnerability reporting)
- The expected disclosure timeline (acknowledgement within 48 hours; resolution target within 90 days; coordinated public disclosure)

Use GitHub's native **private vulnerability reporting** as the reporting mechanism. Reporters submit via the repository's Security tab; the report is visible only to repository administrators until a fix is published.

## Rationale

### Standard practice for public repositories

GitHub surfaces `SECURITY.md` automatically in the repository's Security tab and to users who attempt to open a security-related issue. Providing it reduces the chance of accidental public disclosure and signals that the project takes vulnerability reports seriously.

### Private reporting closes the gap between "no process" and "public issue"

Without private reporting, a reporter who discovers a vulnerability in a public GitHub repository has two options: open a public issue (disclosing the vulnerability immediately) or find an email address (if one is published). GitHub's private vulnerability reporting provides a structured, confidential channel that is directly integrated into the repository — no external account, form, or email address required.

### Consistent with the GitHub ecosystem commitment in ADR-0010

ADR-0010 established GitHub's native tooling as the platform for CI/CD, project automation, and dependency management. GitHub's Security Advisories and private vulnerability reporting are part of the same platform. Adopting them here is consistent with that commitment: the project avoids external service dependencies where GitHub provides equivalent capability, and vulnerability management is no exception.

### No external tooling required

GitHub's Security Advisories and private vulnerability reporting are available on all public repositories at no cost. There is no additional service to configure, no webhook to maintain, and no email routing to manage.

### Appropriate to the threat model

The application runs entirely in the browser, processes only locally provided CSV files, and transmits no data to a server. The realistic vulnerability surface is: XSS via CSV import, supply chain compromise via CDN dependencies, or information disclosure via the build process. A lightweight coordinated disclosure process (rather than a formal bug bounty programme) is proportionate to this surface.

## Consequences

### Positive

- Reporters have a clear, confidential path to disclose vulnerabilities without public exposure
- GitHub indexes `SECURITY.md` and uses it to guide users who file security-adjacent issues
- The disclosure timeline sets expectations for both reporters and maintainers
- OpenSSF Scorecard's security-policy check passes (see ADR-0012)

### Negative

- Maintainers are expected to acknowledge reports within 48 hours; this creates an implicit availability commitment
- A 90-day resolution target may be difficult to meet for complex vulnerabilities if the project is not actively maintained
- The process relies on GitHub's infrastructure; if GitHub's private reporting feature changes or is removed, an alternative channel would need to be established

## Alternatives Considered

### Alternative 1: Email-based disclosure

Publish a security contact email address in `SECURITY.md` and handle reports via email.

**Rejected because**: email provides no structured intake, no confidential thread visible to all administrators, and no integration with GitHub's advisory publication workflow. GitHub's native reporting is strictly more capable and consistent with ADR-0010's platform stance.

### Alternative 2: No security policy

Omit `SECURITY.md` and rely on reporters opening issues or contacting maintainers through other channels.

**Rejected because**: the absence of a security policy means vulnerabilities are more likely to be disclosed publicly before a fix is available, and OpenSSF Scorecard's security-policy check fails, which signals poor posture to downstream users assessing the project.

### Alternative 3: Third-party bug bounty platform (HackerOne, Bugcrowd)

Use a dedicated vulnerability management platform.

**Rejected because**: bug bounty platforms are designed for programmes with monetary rewards, large researcher communities, and high-volume intake. The overhead of maintaining an external programme is not proportionate to a project of this scale and threat model. It would also introduce an external service dependency that ADR-0010's platform stance specifically avoids.

## References

- [GitHub private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability)
- [ADR-0003: Property-Based Testing](./0003-property-based-testing.md) — security properties tested systematically (XSS, injection)
- [ADR-0005: Dependency Decision Policy](./0005-dependency-decision-policy.md) — supply chain risk controls
- [ADR-0010: GitHub Ecosystem](./0010-github-ecosystem.md) — platform commitment that this ADR's tooling choice is consistent with
- [ADR-0012: OpenSSF Scorecard](./0012-openssf-scorecard.md) — security-policy check that this ADR satisfies
