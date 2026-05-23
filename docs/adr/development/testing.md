# ADR: Testing Approach

The project uses property-based testing as its primary automated testing approach, with fast-check generating inputs and vitest as the test runner. Tests cover both the simulation engine and input handling.

## Decision

**Simulation engine** (`src/simulation.js`): tests assert mathematical invariants across randomly generated inputs — bounded outputs, positive-only distributions, effort always within PERT parameter bounds, correct capacity accounting. Pure functions are tested in Node.js without a browser or DOM environment.

**Input handling and security** (`src/ui.js`): tests assert security and correctness properties across a wide range of generated inputs — XSS payloads do not survive unescaped into the DOM, malformed or adversarial CSV content does not cause crashes or data corruption, input sanitisation holds at all boundaries. These tests run with happy-dom providing the DOM environment.

The test files in `test/` import directly from `src/simulation.js` and `src/ui.js`. `test/setup.js` configures the DOM environment for UI tests.

## Rationale

**Property-based testing fits stochastic functions.** Testing that `betaDistribution(alpha, beta)` always returns a value in `[0, 1]` across hundreds of generated parameter combinations provides stronger confidence than any small set of hand-picked examples. The invariant is the specification; example-based tests would require seeding `Math.random` and would exercise only a narrow slice of the input space.

**Property-based testing fits security properties.** XSS and injection vulnerabilities are characteristically hard to catch with example-based tests because attackers use inputs developers don't think to enumerate. fast-check generates a wide range of inputs — unusual Unicode, nested tags, encoded characters, boundary values — that would be impractical to write by hand.

**Counterexample shrinking makes failures actionable.** When fast-check finds a failing input it automatically shrinks it to the minimal counterexample, making debugging significantly easier than a raw random seed — particularly for security findings where the minimal payload is often more informative than the generated input.

**Invariant-based tests are stable.** Properties based on invariants do not need updating when implementation details change, only when the specification changes.

## Consequences

### Benefits

- Strong confidence in statistical correctness across a wide input space
- Security properties (XSS, injection) tested systematically rather than by enumeration
- Tests serve as executable documentation of the mathematical and security specifications
- Pure functions in `src/simulation.js` are tested in Node.js with no browser dependency

### Risks

- Property-based tests are non-deterministic by default; a flaky failure may require reproducing with a fixed seed to diagnose

## Rejected Approaches

**Example-based unit tests.** Stochastic functions do not have predictable outputs for given inputs without seeding. For security properties, hand-enumerated inputs systematically miss adversarial cases. Property-based testing addresses both problems directly.

**End-to-end browser testing (Playwright).** Slower and more brittle than unit-level tests, and cannot match the input coverage that fast-check provides per second. The two approaches are complementary but property-based unit tests are the higher-value investment for this codebase.

## References

- [../dependencies/vitest.md](../dependencies/vitest.md)
- [../dependencies/fast-check.md](../dependencies/fast-check.md)
- [../dependencies/happy-dom.md](../dependencies/happy-dom.md)
