# ADR: Security Policy and Vulnerability Disclosure

The project maintains a documented security policy using GitHub's native private vulnerability reporting as the disclosure channel.

## Decision

`SECURITY.md` at the repository root documents:

- Which versions of the application are supported
- How to report a vulnerability privately (via GitHub's Security tab)
- The expected disclosure timeline: acknowledgement within 48 hours, resolution target within 90 days, coordinated public disclosure

GitHub's **private vulnerability reporting** is the reporting mechanism. Reports are visible only to repository administrators until a fix is published and a Security Advisory is issued.

## Rationale

**A published security policy reduces accidental public disclosure.** GitHub surfaces `SECURITY.md` in the repository's Security tab and guides users who attempt to open security-related issues toward it. Without it, the likely outcome of a discovered vulnerability is either a public issue or no report at all.

**Private reporting closes the gap between those two outcomes.** It provides a structured, confidential channel integrated directly into the repository — no external account, form, or email address required from the reporter.

**Consistent with the GitHub ecosystem commitment.** [github-ecosystem.md](github-ecosystem.md) established GitHub's native tooling as the platform for all project automation. GitHub's Security Advisories are part of that platform; adopting them avoids introducing an external service dependency.

**Proportionate to the threat model.** The application runs entirely in the browser and transmits no data to a server. The realistic vulnerability surface is XSS via CSV import, supply chain compromise via CDN dependencies, or information disclosure via the build process. A lightweight coordinated disclosure process is appropriate for this surface.

## Consequences

### Benefits

- Reporters have a clear, confidential path to disclose vulnerabilities without public exposure
- The disclosure timeline sets expectations for both reporters and maintainers
- OpenSSF Scorecard's security-policy check passes

### Risks

- Maintainers are expected to acknowledge reports within 48 hours; this creates an implicit availability commitment
- A 90-day resolution target may be difficult to meet for complex vulnerabilities if the project is not actively maintained

## Rejected Approaches

**Email-based disclosure.** Provides no structured intake, no confidential thread visible to all administrators, and no integration with GitHub's advisory workflow. GitHub's native reporting is strictly more capable.

**No security policy.** Vulnerabilities are more likely to be disclosed publicly before a fix is available, and OpenSSF Scorecard's security-policy check fails.

**Third-party bug bounty platform (HackerOne, Bugcrowd).** Designed for programmes with monetary rewards and high-volume intake. The overhead is not proportionate to a project of this scale and would introduce an external service dependency.

## References

- [github-ecosystem.md](github-ecosystem.md)
- [openssf-scorecard.md](openssf-scorecard.md)
- [../dependencies/dependency-policy.md](../dependencies/dependency-policy.md)
- [GitHub private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability)
