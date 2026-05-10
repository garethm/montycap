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
