# ADR-0009: Pre-commit Application Validation

## Status

Accepted

## Context

The project already uses the `pre-commit` framework for generic hygiene checks (secret detection, whitespace, merge conflict markers). However, none of the project-specific quality checks — JavaScript linting, HTML validation, and the test suite — ran automatically before a commit. This gap was exposed when an inline style violation introduced during the simulation complexity limits feature was only caught by CI after the PR was opened, requiring a follow-up fix commit.

The three checks that matter for this project are:

- **ESLint** (`npx eslint src/simulation.js src/ui.js`) — enforces JavaScript code style
- **HTML validation** (`npx html-validate web/index.html`) — enforces structural and policy rules on the built output, including the `no-inline-style` rule that caught the CI failure
- **Vitest** (`npm test`) — runs the property-based test suite for the simulation engine

All three tools are already installed as dev dependencies; the gap was the absence of a hook to invoke them.

## Decision

1. Add a `validate` script to `package.json` that chains all three checks in sequence: lint → build + HTML validate → test.
2. Add a `local` hook in `.pre-commit-config.yaml` that runs `npm run validate`, scoped to changes under `src/` so it only fires when application source changes.

## Rationale

Catching failures locally is cheaper than catching them in CI. The full validation suite completes in under two seconds, which is an acceptable pre-commit overhead. Scoping the hook to `src/` avoids running it for documentation-only commits where the application code is unchanged.

A single `validate` script in `package.json` provides a canonical entry point that is easy to run manually, referenced from the hook, and self-documenting for contributors reading the project scripts.

## Consequences

### Positive

- Inline style violations, lint errors, and test failures are caught before a commit is created rather than after a PR is opened
- `npm run validate` gives contributors and tooling (including Claude Code) a single command to confirm the project is in a good state
- Consistent with the existing `pre-commit` framework rather than introducing a second tool

### Negative

- Commits touching `src/` now take ~2 seconds longer due to the validation run
- The hook requires Node.js to be available in the environment where `pre-commit` runs; contributors without Node installed locally would need to skip it

## Alternatives Considered

### Alternative 1: CI-only enforcement

Leave the checks to run only in GitHub Actions. Rejected because it increases round-trip time from mistake to feedback and produces avoidable fix commits in the PR history.

### Alternative 2: Husky

Use Husky to manage the git hook instead of `pre-commit`. Rejected because `pre-commit` is already in use and adding Husky would introduce a second hook management tool with no benefit.

### Alternative 3: Separate hooks per check

Add three distinct local hooks (one for lint, one for HTML validate, one for tests) rather than a single `validate` script. Rejected because a single script is simpler to maintain and easier to invoke manually; the granularity of separate hooks is not needed given the short total runtime.

## References

- [pre-commit local hooks documentation](https://pre-commit.com/#repository-local-hooks)
- [Feature: Simulation Complexity Limits](../features/simulation-complexity-limits.md) — incident that motivated this ADR
