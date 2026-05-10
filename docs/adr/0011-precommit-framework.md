# ADR-0011: pre-commit as the Local Hook Management Framework

## Status

Accepted

## Context

Git provides a hook mechanism for running scripts at defined points in the workflow (before a commit, before a push, etc.). Raw git hooks live in `.git/hooks/` and are not committed to the repository, which means they are not shared between contributors and must be manually installed by each person working on the project.

Several tools exist to manage git hooks declaratively, via a configuration file that is checked into the repository. The project needed local pre-commit validation (see ADR-0009) and required a framework to manage those hooks reliably across contributor environments.

## Decision

Use the **pre-commit** framework (https://pre-commit.com/) to manage git hooks. Hooks are declared in `.pre-commit-config.yaml` at the repository root.

## Rationale

### Declarative, committed configuration

pre-commit stores hook configuration in `.pre-commit-config.yaml`, which is version-controlled alongside the code. Every contributor who installs pre-commit gets the same hooks, at the same versions, without manual setup beyond running `pre-commit install` once.

### Ecosystem of ready-made hooks

pre-commit hosts a public registry of hooks for common tasks. The project uses hooks from this registry for secret detection, trailing whitespace, end-of-file newlines, and merge conflict markers — none of which required custom scripting. This ecosystem is a significant advantage over plain git hooks, which require each check to be scripted from scratch.

### Language-agnostic

pre-commit can run hooks written in any language (Python, Node, Go, shell) and manages their dependencies in isolated environments. This is important for a project that uses both npm tooling (ESLint, vitest) and Python-based hooks from the pre-commit registry, without requiring contributors to manage multiple toolchains manually.

### Pinned hook versions

pre-commit configuration pins each hook to a specific `rev`, and the `pre-commit autoupdate` command provides a controlled upgrade path. This is consistent with the exact-pinning supply chain stance in ADR-0005.

## Consequences

### Positive

- Hook configuration is shared and version-controlled; contributors cannot run without the same checks
- Ready-made hooks eliminate custom scripting for generic hygiene tasks
- Hook versions are pinned and auditable
- Adding new hooks (as in ADR-0009) is a one-line change to `.pre-commit-config.yaml`

### Negative

- Requires contributors to install pre-commit separately (it is a Python tool, not an npm package); the installation step is not automated
- If pre-commit is not installed, hooks do not run at all — there is no fallback
- pre-commit manages its own hook environments, which introduces a small additional layer between the hook definition and execution

## Alternatives Considered

### Alternative 1: Plain git hooks

Commit hook scripts to a directory (e.g. `.githooks/`) and document that contributors must run `git config core.hooksPath .githooks` to activate them.

**Rejected because**: there is no enforcement that contributors activate the hooks, no shared version pinning, and no ecosystem of ready-made checks. Each hook must be scripted and maintained in-house.

### Alternative 2: Husky

Husky is an npm package that installs git hooks via npm's `prepare` lifecycle script.

**Rejected because**: Husky runs via `npm install`, which the project explicitly avoids by using `npm ci --ignore-scripts` in CI. An `--ignore-scripts` stance and a `prepare`-script-based hook tool are incompatible. Additionally, Husky hooks are shell scripts without a shared ecosystem of ready-made checks, requiring custom scripting for each task.

### Alternative 3: lefthook

lefthook is a Go-based hook manager with a YAML configuration similar to pre-commit.

**Not adopted**: lefthook is a viable alternative with good performance and no Python dependency. It was not chosen because pre-commit was already in use for generic hygiene hooks before ADR-0009 added application-specific checks, making migration unnecessary.

### Alternative 4: No local hooks — CI only

Rely entirely on GitHub Actions for quality enforcement; do not run checks locally.

**Rejected because**: CI feedback arrives after a push or pull request is opened, not before a commit is created. Local hooks catch failures earlier and avoid avoidable fix commits in the pull request history, as described in ADR-0009.

## References

- [pre-commit documentation](https://pre-commit.com/)
- [ADR-0005: Dependency Decision Policy](./0005-dependency-decision-policy.md) — supply chain stance (pinned versions)
- [ADR-0009: Pre-commit Application Validation](./0009-precommit-application-validation.md) — application-specific hooks added to this framework
- [ADR-0010: GitHub Ecosystem](./0010-github-ecosystem.md) — GitHub Actions as the CI complement to local hooks
