# ADR-0004: Branch Policy

## Status

Accepted

## Context

Without an explicit branch policy, changes risk being committed to whatever branch happens to be checked out rather than a branch scoped to the work being done. This makes pull requests harder to review (unrelated changes are mixed together), complicates revert and cherry-pick operations, and obscures the history of individual decisions.

This issue was observed in practice: a substantial refactoring and feature addition (source restructuring, property-based testing, ADRs) was committed to a branch originally created for an unrelated security fix (`fix/move-security-md-to-root`).

The project uses conventional commits for commit messages; branch naming should follow the same vocabulary for consistency.

## Decision

All work must be done on a dedicated branch created from `main` for that specific change. Branches must not be reused for unrelated work.

**Naming convention**: `<type>/<short-description>`

| Type | Use for |
|---|---|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `refactor/` | Code restructuring without behaviour change |
| `test/` | Adding or updating tests |
| `docs/` | Documentation only |
| `chore/` | Maintenance — dependencies, CI, tooling |

**Before starting any work**, verify the current branch is appropriate for the task. If it is not, create a new branch:

```bash
git checkout main
git pull
git checkout -b <type>/<short-description>
```

**Scope**: each branch should contain one logical change. Related concerns that naturally belong together (e.g. a refactor that is a prerequisite for a feature) may be combined, but unrelated changes must be on separate branches.

## Rationale

### Reviewability

Pull requests scoped to a single concern are significantly easier to review. A reviewer can understand the intent of the change from the branch name and PR title, and evaluate the diff in that context without filtering out noise.

### History Clarity

A branch-per-concern produces a git history where each merged PR represents a coherent, nameable decision. This makes `git log`, `git blame`, and bisect more useful.

### Revertability

Mixing concerns on one branch makes revert operations destructive — reverting a bug fix also reverts an unrelated refactor. Single-concern branches keep reverts clean.

### Tooling Alignment

The branch naming convention mirrors the conventional commits vocabulary already used for commit messages, reducing cognitive overhead and making the relationship between branches and their commits obvious.

## Consequences

### Positive

- Pull requests are easier to review and understand
- Git history accurately reflects individual decisions
- Reverts and cherry-picks are straightforward
- Branch names provide immediate context for what is in progress

### Negative

- A prerequisite refactor must be merged before the feature branch that depends on it, which can slow down development when working on tightly coupled changes
- Contributors must remember to check and create a branch before starting work; there is no automated enforcement at the git level

## Alternatives Considered

### Alternative 1: No Formal Branch Policy

Leave branch naming and scoping to individual discretion.

**Rejected because**: The absence of policy was the cause of the observed problem. Without an explicit expectation, the path of least resistance is to commit to whatever branch is active.

### Alternative 2: Enforce Branch Naming via Pre-push Hooks

Add a pre-push hook that rejects branch names not matching the convention.

**Not adopted at this time**: Adds friction for contributors and requires hook installation to be reliable. The policy is enforced via code review and PR requirements rather than automated tooling. May be revisited if violations recur.

### Alternative 3: GitHub Branch Protection Rules

Require branches to be named according to the convention via GitHub branch protection.

**Not adopted at this time**: GitHub's branch protection does not natively enforce naming patterns on feature branches (only on protected branches like `main`). Third-party GitHub Apps exist for this but add external dependencies. Deferred unless the policy proves difficult to follow in practice.

## References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [ADR-0001: Repository Structure Reorganization](./0001-repository-structure.md)
