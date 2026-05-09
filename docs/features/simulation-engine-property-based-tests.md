# Feature: Simulation Engine Property-Based Tests

## Overview

Property-based testing of the simulation engine's pure statistical and scheduling functions using fast-check and vitest. Rather than asserting specific output values, tests verify mathematical invariants that must hold across a wide range of randomly generated inputs — catching edge cases that example-based tests would miss.

Scope is limited to the pure functions in `src/simulation.js`. DOM-coupled functions in `src/ui.js`, including CSV parsing and input handling, are out of scope and addressed in a follow-up feature.

## User Story

As a developer, I want property-based tests for the statistical functions so that I can be confident they produce mathematically valid outputs across a wide range of inputs without having to manually enumerate test cases.

## Functionality

### Core Features

- 13 property-based tests covering the core statistical and scheduling functions
- fast-check generates hundreds of random inputs per test run, shrinking failures to minimal counterexamples
- Tests run in Node.js via vitest, isolated from the browser and DOM

### Tested Invariants

| Function | Invariant |
|---|---|
| `betaDistribution` | Output always in [0, 1] |
| `gammaRandom` | Output always positive and finite (shape ≥ 1 and shape < 1) |
| `normalRandom` | Output always finite |
| `generateTaskEffortHelper` | Output always within [optimistic, pessimistic] |
| `generateTaskEffortHelper` | Returns `expected` when optimistic equals pessimistic |
| `generateTaskEffort` | Output is 0 or within [optimistic, pessimistic] |
| `generateTaskEffort` | Always returns 0 when `skipPercentage` is 100 |
| `generateTaskEffort` | Never returns 0 when `skipPercentage` is 0 |
| `canScheduleInPeriod` | Always returns true for zero-work items |
| `canScheduleInPeriod` | Returns false when weekly usage already equals capacity |
| `allocateCapacity` | Total allocated hours matches hours argument |
| `allocateCapacity` | No-op for zero hours |

### Data Flow

Tests import pure functions directly from `src/simulation.js` as an ES module. No DOM, no browser globals, no build step required to run tests.

## Security Considerations

### Attack Surface

#### Inbound Data Vectors
- **Test inputs**: fast-check generates inputs within defined ranges — no external data enters the test process

#### Outbound Data Vectors
- **Console/logs**: vitest output goes to stdout only; no sensitive data involved

#### Trust Boundaries
- **Test process to source module**: tests import `src/simulation.js` directly; the module contains no I/O or side effects beyond `console.warn` in `scheduleWorkItem`

### Threat Model

- **Supply chain — malicious package version**: A compromised or malicious release of vitest or fast-check (or any of their ~45 transitive dependencies) published to npm could execute arbitrary code during install or test in CI and developer environments → Mitigation: exact version pinning in `package.json` and a committed `package-lock.json` ensure only the audited versions are installed; `npm ci --ignore-scripts` in CI prevents lifecycle scripts from executing; Dependabot monitors all transitive dependencies for published CVEs
- **Supply chain — lifecycle script execution**: npm packages can run arbitrary code during install via `postinstall` and similar hooks, providing an attack vector even for pinned packages if a pinned version is itself malicious → Mitigation: `npm ci --ignore-scripts` blocks all lifecycle scripts; verified that none of the 132 installed packages require lifecycle scripts to function correctly
- **Supply chain — dependency confusion / typosquatting**: An attacker could publish a package with a similar name to intercept installs → Mitigation: `package-lock.json` records the resolved registry URL and SHA-512 integrity hash for every transitive dependency, allowing npm to detect tampering
- **NaN propagation**: Statistical functions receiving unusual inputs could produce NaN, which would silently corrupt simulation results displayed to users → Mitigation: `noNaN: true` and `noDefaultInfinity: true` constraints on fast-check arbitraries verify finite outputs; `generateTaskEffortHelper` safe parameter bounds (`Math.max(0.5, alpha)`) prevent degenerate Beta parameters
- **Infinite loops**: The Marsaglia-Tsang algorithm loops until acceptance — pathological inputs could cause non-termination → Mitigation: `gammaRandom` tests with shape < 1 verify the recursive path completes

### Security Controls

- **Exact version pinning**: `package.json` specifies exact versions (no `^` or `~`) for vitest and fast-check; `package-lock.json` is committed and enforced via `npm ci --ignore-scripts` in CI
- **Lifecycle script blocking**: `npm ci --ignore-scripts` prevents any package from executing install-time scripts; verified safe — none of the 132 installed packages require lifecycle scripts
- **Integrity verification**: `package-lock.json` records the SHA-512 integrity hash for every installed package and transitive dependency, allowing npm to detect tampering
- **Dependabot monitoring**: Configured to alert on published CVEs affecting all direct and transitive test dependencies
- Tests use bounded arbitraries (e.g. `min: 0.1, max: 500`) consistent with real-world planning inputs, avoiding unnecessarily extreme values that are outside the application's intended operating range

## Implementation Details

### Key Components

- **`test/simulation.test.js`**: All property-based tests; imports directly from `src/simulation.js`
- **`src/simulation.js`**: Functions exported with `export function` for Node.js import
- **`scripts/build.js`**: `stripModuleSyntax()` removes `export`/`import` declarations before HTML injection so the built file remains a plain browser script
- **`eslint.config.mjs`**: Both `src/simulation.js` and `src/ui.js` configured as `sourceType: 'module'`

### Code Location

- Tests: `test/simulation.test.js`
- Source under test: `src/simulation.js`
- Build stripping: `scripts/build.js` — `stripModuleSyntax()` function

### Dependencies

- **vitest**: Test runner with native ES module support
- **fast-check**: Property-based testing library; generates and shrinks counterexamples

## Configuration

No vitest config file — vitest's zero-config defaults are sufficient for plain JavaScript ES modules.

## Usage Examples

### Running Tests

```text
npm test
```

### Adding a New Property

```javascript
import { myFunction } from '../src/simulation.js';
import fc from 'fast-check';

it('describes the invariant', () => {
    fc.assert(fc.property(
        fc.double({ min: 0.1, max: 100, noNaN: true, noDefaultInfinity: true }),
        (input) => {
            const result = myFunction(input);
            return result >= 0; // the invariant
        }
    ));
});
```

## Validation & Error Handling

- fast-check reports the minimal failing input when a property is violated, including the seed for reproducibility
- Tests fail loudly on NaN or Infinity outputs via explicit `isFinite()` checks

## Testing

### Test Cases

See `test/simulation.test.js` for the full list. Key cases:

- **Beta distribution bounds**: any valid alpha/beta produces output in [0, 1]
- **Effort bounds**: any ordered (opt, exp, pess) triple produces effort within that range
- **Skip logic**: skip=100 is deterministic; skip=0 never skips
- **Capacity accounting**: allocated hours always sum to the input hours

### Manual Testing Steps

1. Run `npm test`
2. All 13 tests should pass in under 500ms
3. To inspect a failure, fast-check will print the minimal counterexample and seed

## Performance Considerations

- Full suite runs in ~180ms (13 tests × 100 runs each = ~1,300 function calls)
- fast-check's default 100 runs per property is sufficient for these pure mathematical functions
- Tests run before the build step in CI, so failures are caught without incurring build time

## Known Limitations

- `ui.js` functions are intentionally out of scope — DOM-coupled functions including CSV parsing and `innerHTML` input handling are covered in a follow-up feature
- `simulateProgram` is not directly tested with properties; its invariants (non-negative effort and timeline) are implicitly covered by the constituent function tests

## Future Enhancements

- Property tests for `simulateProgram` output (totalEffort ≥ 0, totalTime ≥ 0, percentile ordering)
- Increase `numRuns` for the statistical functions to improve confidence in distribution shape
- Consider model-based testing for the scheduling logic

## Related Documentation

- [ADR-0001](../adr/0001-repository-structure.md)
- [Security Policy](../development/SECURITY.md)
