# Dependency Review Template

Records the outcome of a periodic health review of direct dependencies, as required by the [dependency policy](../../adr/dependencies/dependency-policy.md).

An entry is required after every review, including reviews where no action is taken.

Save this file as `YYYY-MM-DD.md` in `docs/development/dependency-reviews/`.

---

## Dependency Review YYYY-MM-DD

**Reviewer**: [Name]
**Scope**: [All dependencies | specific packages] — [reason, e.g. scheduled review, new dependency added, CVE alert]

| Dependency | Version | Maintained | Security | Responsiveness | Downloads | Continuity | Not deprecated | Outcome |
|---|---|---|---|---|---|---|---|---|
| `package-name` | x.y.z | ✅/⚠️/❌ | ✅/⚠️/❌ | ✅/⚠️/❌ | ✅/⚠️/❌ | ✅/⚠️/❌ | ✅/⚠️/❌ | No action / Monitor / ADR-XXXX raised |

**Notes**: [Any findings, mitigations accepted, or context for deferred actions]

**Next review due**: YYYY-MM-DD

---

Criteria reference: see [dependency policy — Health assessment criteria](../../adr/dependencies/dependency-policy.md#health-assessment-criteria).
