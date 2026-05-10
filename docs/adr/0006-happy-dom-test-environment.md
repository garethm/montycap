# ADR-0006: happy-dom as the vitest DOM Test Environment

## Status

Accepted

## Context

The property-based security tests for `src/ui.js` (see `docs/features/ui-property-based-security-tests.md`) require a DOM environment. The functions under test — `addTaskFromData` and `parseCSV` — call `document.createElement`, `document.querySelector`, and similar DOM APIs. These cannot be exercised in the default Node.js vitest environment, which provides no DOM.

vitest supports per-file DOM environments via a `// @vitest-environment <name>` comment at the top of a test file. Two environments are supported out of the box: `jsdom` and `happy-dom`. Both require installing the corresponding package as a dev dependency.

This ADR records the choice between them per the dependency decision policy established in ADR-0005.

## Decision

Add **`happy-dom`** as a dev dependency and use it as the per-file vitest environment for `test/ui.test.js`.

## Rationale

Both `happy-dom` and `jsdom` satisfy the functional requirement — they provide `document`, `Element`, `querySelectorAll`, and `innerHTML` assignment, which is all the property tests need. The decision turns on supply chain surface, performance, and maintenance trajectory.

**Smaller transitive surface**: happy-dom has 6 direct dependencies (`@types/node`, `@types/whatwg-mimetype`, `@types/ws`, `entities`, `whatwg-mimetype`, `ws`). jsdom has 18 direct dependencies with a substantially larger transitive graph including a full CSS engine, URL parser, and XML serialiser. Fewer transitive packages means fewer trust decisions and a smaller attack surface, consistent with the supply chain stance in ADR-0003.

**Vitest's own recommendation**: vitest's documentation recommends happy-dom over jsdom for its speed advantage in test environments. happy-dom is significantly faster because it implements a subset of the browser APIs rather than a full simulation. The tests here use only basic DOM manipulation, well within that subset.

**No lifecycle scripts required**: Neither happy-dom nor jsdom requires lifecycle scripts (`postinstall` etc.). Both are safe under `npm ci --ignore-scripts`.

## Health Assessment

Assessed 2026-05-10 against the criteria in ADR-0005.

| Criterion | Assessment |
|---|---|
| **Maintenance activity** | ✅ Latest release 20.9.0 published April 2026; active release cadence |
| **Security posture** | ✅ No known CVEs at time of assessment |
| **Issue and PR responsiveness** | ✅ Active issue tracker; maintainer responsive |
| **Download trend** | ✅ Growing adoption driven by vitest's recommendation |
| **Maintainer continuity** | ✅ Maintained by David Fahlander with active community contributors |
| **Explicit deprecation or successor** | ✅ Not deprecated; actively developed |

## Supply Chain Implications

- **Direct dependencies added**: 1 (`happy-dom` at an exact pinned version)
- **Transitive dependencies**: approximately 6 direct deps of happy-dom; exact count and integrity hashes recorded in `package-lock.json` after installation
- **Lifecycle scripts**: none required; safe under `npm ci --ignore-scripts`
- **Scope**: dev dependency only; not included in any browser build or runtime artifact

## Consequences

### Positive

- DOM-coupled UI functions can be tested in vitest without a real browser
- Per-file environment directive (`// @vitest-environment happy-dom`) scopes the DOM to `test/ui.test.js` only; `test/simulation.test.js` continues to run in plain Node.js
- Smaller transitive surface than jsdom
- Fast test execution; happy-dom is measurably faster than jsdom for basic DOM operations

### Negative

- happy-dom implements a subset of browser APIs; tests that rely on behaviour not implemented (e.g. full CSS cascade, complex layout) would silently pass or fail incorrectly — not a concern for the structural and attribute assertions used here, but worth noting for future tests
- Adds one direct dependency and its transitive graph to the supply chain

## Alternatives Considered

### Alternative 1: jsdom

The other vitest-supported DOM environment. Provides a more complete browser simulation including a full CSS engine, `XMLHttpRequest`, and more.

**Rejected because**: the additional completeness is not needed for structural DOM assertions; jsdom's 18+ direct dependencies and larger transitive graph represent unnecessary supply chain surface for this use case. happy-dom covers all DOM APIs the tests require.

### Alternative 2: Playwright component testing

Run tests in a real browser (Chromium, Firefox, or WebKit) via Playwright.

**Rejected because**: Playwright is a significantly heavier dependency, requires browser binaries, and is slower to run. It is complementary to unit-level property tests, not a replacement. A Playwright end-to-end test remains a listed future enhancement in the feature spec for verifying non-execution of injected payloads in a real browser after the DOM API fix.

### Alternative 3: Refactor to eliminate DOM coupling

Extract the pure logic from `addTaskFromData` and `parseCSV` into DOM-free functions that can be tested in plain Node.js, deferring DOM assembly to thin wrappers.

**Rejected for this feature**: the security properties under test are inherently about the DOM output — whether injection occurs in the rendered element tree. A DOM-free extraction would test intermediate data structures but not the actual injection vector. The DOM environment is the right tool for these tests.

## References

- [ADR-0005: Dependency Decision Policy](./0005-dependency-decision-policy.md)
- [ADR-0003: Property-Based Testing](./0003-property-based-testing.md)
- [Feature: UI DOM Security Property-Based Tests](../features/ui-property-based-security-tests.md)
- [happy-dom on npm](https://www.npmjs.com/package/happy-dom)
- [vitest environment documentation](https://vitest.dev/guide/environment)
