# ADR: Pre-commit Hooks

Git hooks are managed via the pre-commit framework, covering both generic hygiene checks and project-specific application validation. Hooks run automatically before each commit.

## Decision

Hook configuration is declared in `.pre-commit-config.yaml` at the repository root and is version-controlled alongside the code.

**Hygiene hooks** (from the pre-commit registry, pinned by `rev`):
- Secret detection
- Trailing whitespace and end-of-file newlines
- Merge conflict markers

**Application validation hook** (local, scoped to changes under `src/`):
- Runs `npm run validate`, which chains: ESLint → build + HTML validation → test suite

The `validate` script in `package.json` provides a single canonical command usable both by the hook and by contributors running checks manually.

## Rationale

**Catching failures before a commit is cheaper than catching them in CI.** The full validation suite completes in a few seconds. Failures caught locally avoid fix commits in the PR history and reduce round-trip time from mistake to feedback — a gap that motivated this approach after an inline style violation was only caught by CI after a PR was opened.

**Declarative committed configuration ensures consistency.** `.pre-commit-config.yaml` is version-controlled; every contributor who installs pre-commit gets the same hooks at the same versions without manual setup.

**The pre-commit registry eliminates custom scripting for hygiene checks.** Hooks for secret detection, whitespace, and conflict markers are maintained upstream and require only a `rev` pin — no in-house implementation needed.

**Scoping application validation to `src/`** avoids running the full build and test suite on documentation-only commits where the application code is unchanged.

## Consequences

### Benefits

- Lint errors, build failures, HTML validation violations, and test failures are caught before a commit is created
- `npm run validate` gives contributors a single command to verify project health
- Hook versions are pinned and auditable in `.pre-commit-config.yaml`

### Risks

- pre-commit is a Python tool and must be installed separately; contributors without it installed will not have hooks run locally
- If pre-commit is not installed, hooks do not run and there is no fallback — CI remains the safety net

## Rejected Approaches

**Plain git hooks.** Hook scripts in `.githooks/` are not automatically shared between contributors and must be manually activated. No shared hook ecosystem; each check requires custom scripting.

**Husky.** Manages hooks via npm's `prepare` lifecycle script, which is incompatible with the project's `npm ci --ignore-scripts` stance in CI. Also lacks the pre-commit registry ecosystem.

**lefthook.** A viable Go-based alternative with similar YAML configuration and no Python dependency. Not adopted because pre-commit was already in use for hygiene hooks when application validation was added; migrating provided no benefit.

**CI-only enforcement.** CI feedback arrives after a push or PR is opened, not before a commit is created. Local hooks reduce avoidable fix commits and provide faster feedback.

## References

- [pre-commit documentation](https://pre-commit.com/)
- [../dependencies/dependency-policy.md](../dependencies/dependency-policy.md)

## History

- **No local hooks** — all quality checks ran in CI only; a style violation reached a PR before being caught.
- **pre-commit framework adopted for hygiene hooks** — secret detection, whitespace, and conflict marker checks added via the pre-commit registry.
- **Application validation hook added** — lint, build, HTML validation, and tests wired into a local hook after the CI-only gap was made visible by a fix commit.
