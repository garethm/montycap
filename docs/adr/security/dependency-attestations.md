# ADR: Dependency Provenance Attestations

CI verifies npm registry signatures and provenance attestations for every installed package, and fails if a dependency loses provenance or changes the source repository it is built from, compared with a committed baseline.

## Decision

Two checks run in CI after `npm ci`, before any dependency code is executed:

1. **`npm audit signatures`** cryptographically verifies the registry signature of every installed package and every provenance attestation present. It fails on an invalid signature or attestation, but not on a missing one.
2. **`npm run attestations`** (`scripts/attestations.js`) reads every registry package in `package-lock.json`, fetches its attestations from the npm registry, and compares the SLSA provenance against `dependency-attestations.json`. It fails if:
   - a package version has no provenance, but the same or an older version of that package in the baseline did
   - a package was built from a different source repository than the baseline records for that package
   - an attestation's subject digest does not match the lock file's `integrity` value

   A changed publishing workflow, and packages added to or removed from the lock file, are reported as notices without failing the build.

The baseline records, for each `name@version` in the lock file, the source repository, publishing workflow and commit from its provenance, or `null` where there is none. It is regenerated with `npm run attestations:update` and reviewed like any other change. When a regression is legitimate, for example a maintainer moving a package to a new repository, the PR that updates the baseline records the reason.

The package set comes from `package-lock.json` rather than the installed tree or an external service, because the lock file defines exactly what `npm ci` installs, including overrides. Optional platform-specific packages are included so the result is the same on every machine.

## Rationale

**Provenance is the only verified link from a package to its source.** The `repository` field in `package.json` is self-declared. A provenance attestation is signed through Sigstore using the identity of the CI run that built the package, and the registry checks it against the package before accepting it. Recording it gives the dependency reviews and any future Scorecard checks a trustworthy repository for each attested package.

**Losing provenance is a strong signal of a compromised publish.** A package published with provenance comes from a CI workflow. If a later version arrives without it, the most likely explanations are a stolen npm token used outside CI, or a maintainer changing their release process. Either is worth knowing about before the version runs in CI or on a developer machine. `npm audit signatures` cannot detect this on its own, because it has no record of what earlier versions had.

**A change of source repository is equally suspicious.** A valid attestation from an unexpected repository means the package is now built from somewhere else, which may be a hijacked or typosquatted fork.

**Matching by package name catches regressions across version bumps.** Dependabot updates change versions, so an exact `name@version` comparison would never see the previous release. An older version without provenance installed alongside a newer one with it is common (for example `eslint-visitor-keys` 3.x and 5.x) and is not treated as a regression.

**The checks are complementary.** `npm audit signatures` answers "is this attestation genuine?"; the baseline check answers "is this what we had before?". Neither is sufficient alone.

## Consequences

### Benefits

- A publish made outside a package's usual CI pipeline fails the PR that introduces it
- Each attested dependency has a verified source repository and commit on record
- The baseline diff in a dependency update PR shows exactly which packages changed provenance

### Risks

- Only about a third of the dependency tree has provenance (54 of 161 lock file packages when adopted). Unattested packages are tracked but cannot regress, so the check says nothing about them
- A maintainer legitimately changing their release process fails CI until the baseline is updated
- The check needs network access to the npm registry, so it is not part of `npm run validate` or the pre-commit hook
- Provenance proves where a package was built, not that its code is safe: a compromised repository or workflow still produces valid provenance

## Rejected Approaches

**Require provenance for every dependency.** Most of the tree, including direct dependencies such as `eslint` and `html-validate`, is published without it. Enforcing it would mean replacing a large part of the toolchain for a property that most of the npm ecosystem does not yet provide.

**`npm audit signatures` alone.** Verifies attestations that exist but does not notice when one disappears, which is the main attack this ADR addresses.

**Baseline keyed by exact version only.** Every dependency update would appear as a new package with nothing to compare against, so a lost attestation would never be detected.

**Rely on deps.dev for the package list and provenance.** deps.dev resolves dependencies itself rather than reading the lock file, so it does not reflect overrides, and its data can lag the registry. The registry is the source of the attestations, so it is queried directly.

## References

- [npm: Generating provenance statements](https://docs.npmjs.com/generating-provenance-statements)
- [SLSA provenance v1](https://slsa.dev/spec/v1.0/provenance)
- [../dependencies/dependency-policy.md](../dependencies/dependency-policy.md)
- [openssf-scorecard.md](openssf-scorecard.md)
