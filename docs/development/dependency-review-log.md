# Dependency Review Log

Records the outcome of each periodic health review of direct dependencies, as required by [ADR-0005](../adr/0005-dependency-decision-policy.md).

An entry is required after every review, including reviews where no action is taken.

---

## Review template

```
## Review YYYY-MM-DD

**Reviewer**: [Name]
**Scope**: [All dependencies | specific packages] — [reason, e.g. scheduled review, new dependency added, CVE alert]

| Dependency | Version | Maintained | Security | Responsiveness | Downloads | Continuity | Not deprecated | Outcome |
|---|---|---|---|---|---|---|---|---|
| `package-name` | x.y.z | ✅/⚠️/❌ | ✅/⚠️/❌ | ✅/⚠️/❌ | ✅/⚠️/❌ | ✅/⚠️/❌ | ✅/⚠️/❌ | No action / Monitor / ADR-XXXX raised |

**Notes**: [Any findings, mitigations accepted, or context for deferred actions]

**Next review due**: YYYY-MM-DD
```

Criteria reference: see [ADR-0005 — Assessing dependency health](../adr/0005-dependency-decision-policy.md#assessing-dependency-health).

---

## Review 2026-05-10

**Reviewer**: Gareth Marshall
**Scope**: All dependencies — first periodic review; grandfathered packages (`eslint`, `fast-check`, `html-validate`, `vitest`) assessed for the first time per ADR-0005; `happy-dom` reviewed in ADR-0006 (2026-05-10) and included here for completeness.

| Dependency | Version | Maintained | Security | Responsiveness | Downloads | Continuity | Not deprecated | Outcome |
|---|---|---|---|---|---|---|---|---|
| `eslint` | 10.3.0 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | No action |
| `fast-check` | 4.7.0 | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | Monitor |
| `html-validate` | 10.13.1 | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | Monitor |
| `vitest` | 4.1.5 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | No action |
| `happy-dom` | 20.9.0 | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | Monitor |

**Notes**:

- `npm audit` returned zero vulnerabilities across all installed packages at the time of this review.
- **eslint** (127M downloads/week): v10.3.0 released 2026-05-01; v9.x maintained in parallel as a long-term branch. Backed by the OpenJS Foundation with automated publishing via `eslintbot`. No concerns.
- **fast-check** (15M downloads/week): v4.7.0 released 2026-04-17; active release cadence with minor versions shipping roughly monthly. Single maintainer (Nicolas Dubien, `ndubien`). No organisational backing; flagged for monitoring. No CVEs, no deprecation.
- **html-validate** (397K downloads/week): v10.15.0 released 2026-05-04; we are pinned to 10.13.1. Lower download volume is expected for a specialised HTML linting tool rather than a sign of community abandonment — the release cadence (multiple releases per month in 2026) is healthy. Hosted on GitLab. Single maintainer (`ext` / sidvind.com). Flagged for monitoring. No CVEs, no deprecation. Consider updating the pinned version to 10.15.0 in a maintenance pass.
- **vitest** (59M downloads/week): v4.1.5 released 2026-04-21; v5.0.0-beta.2 published 2026-05-05, indicating an active major version cycle. Multiple named maintainers including Evan You (creator of Vite/Vue) and Anthony Fu. No concerns. Monitor v5 stable release for a future upgrade decision.
- **happy-dom** (8.2M downloads/week): v20.9.0 released 2026-04-13. Versions 20.8.8 and 20.8.9 (March 2026) included security fixes for a cookie-forwarding vulnerability and an ESM export-name interpolation issue; our pinned version incorporates both patches. Single maintainer (David Ortner, `davidortner`). Flagged for monitoring. Detailed health assessment recorded in ADR-0006 at adoption.

**Single-maintainer monitoring**: three packages (`fast-check`, `html-validate`, `happy-dom`) are maintained by a single individual with no organisational backing. Each fails only the Continuity criterion; none triggers the two-criterion threshold requiring a replacement ADR. These packages should be observed at each subsequent review for signs of disengagement (no releases for 12+ months, unacknowledged issues, npm deprecation notice).

**Next review due**: 2026-11-10
