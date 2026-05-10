# ADR-0003: Property-Based Testing

## Status

Accepted

> **Amended by [ADR-0006: happy-dom as the vitest DOM Test Environment](./0006-happy-dom-test-environment.md)**: the Consequences section below refers to `jsdom` as the DOM test environment for `src/ui.js`. ADR-0006 supersedes that detail — `happy-dom` was chosen instead due to its smaller transitive dependency surface and vitest's own recommendation.

## Context

The application has two distinct areas where testing provides high value, each with characteristics that make example-based unit tests a poor fit:

**Statistical correctness**: The simulation engine implements stochastic algorithms (PERT/Beta distribution, Marsaglia-Tsang gamma, capacity scheduling) whose correctness depends on mathematical invariants rather than specific output values. Any fixed expected output for a stochastic function would be wrong most of the time, and manually chosen inputs make it easy to miss edge cases in the parameter space.

**Security and input validation**: The UI layer handles user-supplied data — CSV file content and form inputs — that is subsequently parsed and written into the DOM. The security properties here (no XSS, correct parsing across a wide range of inputs including malformed or adversarial content) are also invariant-shaped: they must hold for all valid and invalid inputs, not just a handful of representative examples.

In both cases the specification is a set of properties that must hold universally, which makes property-based testing the natural fit.

## Decision

Adopt property-based testing using **fast-check** and **vitest** as the primary automated testing approach for this project, covering both the simulation engine and input handling.

**Simulation engine** (`src/simulation.js`): Tests assert mathematical invariants across randomly generated inputs — bounded outputs, positive-only distributions, effort always within PERT bounds, correct capacity accounting.

**Input handling and security** (`src/ui.js`): Tests assert security and correctness properties across a wide range of generated inputs — no XSS payloads survive unescaped into the DOM, malformed or adversarial CSV content does not cause crashes or data corruption, input sanitisation holds at all boundaries.

## Rationale

### Fitness for Stochastic Functions

Testing that `betaDistribution(alpha, beta)` always returns a value in `[0, 1]` across hundreds of generated parameter combinations provides far stronger confidence than any small set of hand-picked examples. The invariant is the specification.

### Fitness for Security Properties

XSS and injection vulnerabilities are characteristically hard to catch with example-based tests because attackers use inputs that developers don't think to enumerate. Property-based testing generates a wide range of inputs — including unusual Unicode, nested tags, encoded characters, and boundary values — that would be impractical to write by hand. Expressing "no user input survives unescaped into the DOM" as a property tests that guarantee systematically rather than by enumeration.

### Counterexample Shrinking

When fast-check finds a failing input it automatically shrinks it to the minimal counterexample. This makes debugging failures significantly easier than a random seed alone, particularly for security findings where the minimal payload is often more informative than the raw generated input.

### Low Ongoing Maintenance

Properties based on invariants are stable — they don't need updating when implementation details change, only when the specification changes.

## Consequences

### Positive

- Strong confidence in statistical correctness across a wide input space
- Security properties (XSS, injection) tested systematically rather than by enumeration
- Tests serve as executable documentation of the mathematical and security specifications
- fast-check's shrinking makes failures easy to diagnose
- Pure functions in `src/simulation.js` can be tested in Node.js without a browser or DOM

### Negative

- DOM-coupled functions in `src/ui.js` require a test environment with DOM support (jsdom via vitest's `environment: 'jsdom'` config)
- Introducing vitest and fast-check adds ~45 transitive packages to the supply chain; mitigated by exact version pinning, committed lock file, `npm ci --ignore-scripts`, and Dependabot monitoring

## Alternatives Considered

### Alternative 1: Example-Based Unit Tests

Write conventional unit tests with fixed inputs and expected outputs.

**Rejected because**: Stochastic functions don't have predictable outputs for given inputs without seeding `Math.random`, which adds complexity and tests only a narrow path through the distribution. For security properties, hand-enumerated inputs systematically miss the adversarial cases that matter most. Property-based testing addresses both problems directly.

### Alternative 2: Jest instead of vitest

Use Jest as the test runner instead of vitest.

**Rejected because**: Jest requires additional configuration to handle ES modules, whereas vitest supports them natively with zero config. vitest is also significantly faster for small suites and shares configuration conventions with Vite if a bundler is ever adopted. Both are mature, well-maintained options; vitest is the better fit given the project's ES module source structure.

### Alternative 3: jsverify or other property-based libraries instead of fast-check

Use an alternative property-based testing library such as jsverify or proptest-js.

**Rejected because**: fast-check is the most actively maintained property-based testing library in the JavaScript ecosystem, with strong TypeScript support, a comprehensive set of built-in arbitraries, and best-in-class shrinking. jsverify has not seen active development since 2020. fast-check is the clear community standard.

### Alternative 4: End-to-End Browser Testing (e.g. Playwright)

Run tests in a real browser to test the full stack including DOM behaviour.

**Rejected because**: End-to-end tests are slower, more brittle, and harder to run in CI than unit-level tests. Property-based testing at the unit level catches more invariant violations more efficiently. The two approaches are complementary rather than mutually exclusive.

## References

- [fast-check documentation](https://fast-check.io/)
- [vitest documentation](https://vitest.dev/)
- [Property-based testing — Wikipedia](https://en.wikipedia.org/wiki/Property-based_testing)
- [docs/features/simulation-engine-property-based-tests.md](../features/simulation-engine-property-based-tests.md)
- [ADR-0002: Source Restructuring and Build Step](./0002-source-restructuring-and-build-step.md)
