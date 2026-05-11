# ADR: Branch Policy

All work is done on a dedicated branch created from `main` and scoped to a single logical change. Branches must not be reused for unrelated work.

## Decision

**Naming convention**: `<type>/<short-description>`

| Type | Use for |
|---|---|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `refactor/` | Code restructuring without behaviour change |
| `test/` | Adding or updating tests |
| `docs/` | Documentation only |
| `chore/` | Maintenance — dependencies, CI, tooling |

Before starting any work, verify the current branch is appropriate for the task. If it is not, create a new branch from `main`:

```bash
git checkout main
git pull
git checkout -b <type>/<short-description>
```

**Scope**: each branch contains one logical change. Related concerns that are prerequisites for each other may be combined on a single branch, but unrelated changes must be on separate branches.

## Rationale

**Scoped branches produce reviewable pull requests.** A reviewer can understand the intent of a change from the branch name and PR title, and evaluate the diff in that context without filtering out unrelated noise.

**Single-concern branches keep git history meaningful.** Each merged PR represents a coherent, nameable decision. This makes `git log`, `git blame`, and bisect more useful than a history that mixes unrelated changes.

**Scoped branches make reverts safe.** Mixing concerns on one branch means reverting a bug fix also reverts an unrelated refactor. Single-concern branches keep reverts clean.

**The naming convention mirrors conventional commits.** The type vocabulary is the same as that used for commit messages, reducing cognitive overhead and making the relationship between branches and their commits obvious.

## Consequences

### Benefits

- Pull requests are easier to review and understand
- Git history accurately reflects individual decisions
- Reverts and cherry-picks are clean

### Risks

- A prerequisite refactor must be merged before the branch that depends on it, which can slow development on tightly coupled changes
- There is no automated enforcement at the git level; the policy is upheld through code review

## Rejected Approaches

**No formal policy.** The absence of policy was the direct cause of the incident that motivated this ADR — unrelated changes accumulated on a branch created for a different fix. Without an explicit expectation, the path of least resistance is to commit to whatever branch is active.

**Pre-push hook enforcement.** Adds friction and requires reliable hook installation across all contributor environments. Deferred unless violations recur.

**GitHub branch protection for naming.** GitHub's native branch protection does not enforce naming patterns on feature branches. Third-party GitHub Apps exist for this but add external dependencies not warranted at this scale.

## References

- [Conventional Commits](https://www.conventionalcommits.org/)

## History

- **No formal policy** — branches were created ad hoc; an incident where a substantial refactor was committed to a branch named for an unrelated security fix made the cost of this visible.
- **Policy adopted** — dedicated branches with type-prefixed names required for all work.
