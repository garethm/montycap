# ADR-0002: Source Restructuring and Build Step

## Status

Accepted

## Context

The application was originally implemented as a single `web/index.html` file containing all HTML, CSS, and JavaScript inline. While this made the file self-contained and openable directly in a browser, it created several practical problems:

- JavaScript could not be linted directly — the CI workflow used a fragile `sed` command to extract the script block into a temporary file
- Functions had no exports and could not be imported in a Node.js environment, making automated testing impossible
- HTML, CSS, and JavaScript were interleaved in a single file, making each harder to navigate and edit independently

## Decision

Split the application into three source files assembled by a Node.js build script:

- `src/simulation.js` — pure simulation and statistical functions, no DOM dependencies
- `src/ui.js` — DOM-coupled UI functions
- `src/template.html` — HTML structure and CSS with a `/* @@BUILD_JS@@ */` placeholder

`scripts/build.js` concatenates the JavaScript sources, strips ES module syntax (`export`/`import` declarations), and injects the result into the template to produce `web/index.html`.

`web/index.html` is gitignored. CI and the deploy workflow run `npm run build` to produce it before validation and deployment.

## Rationale

### Enables Automated Testing

Separating the pure simulation functions into `src/simulation.js` with ES module exports makes them importable in a Node.js test environment. This is a prerequisite for property-based testing of the statistical engine and future testing of input handling in `src/ui.js`.

### Eliminates the Linting Hack

The `sed`-based script extraction in CI was brittle and silently permissive (`|| true` suppressed lint failures). Direct linting of `src/simulation.js` and `src/ui.js` as proper source files gives accurate, reliable results.

### Preserves the Single-File Output

The build step recombines the sources into a self-contained `web/index.html` that requires no runtime dependencies or server — the deployed artifact is unchanged from the user's perspective.

### Explicit Dependencies Between Modules

`src/ui.js` now explicitly imports the simulation functions it uses, making the dependency relationship visible in the code rather than implicit via shared global scope.

## Consequences

### Positive

- JavaScript can be linted directly as source files with proper ES module config
- Pure simulation functions are importable in Node.js for testing
- HTML, CSS, and JavaScript are independently editable
- CI is simpler and more reliable without the `sed` extraction hack
- The build step provides a natural place to apply transformations (e.g. stripping module syntax)

### Negative

- `web/index.html` is no longer directly editable — contributors must edit `src/` files and run `npm run build`
- The build script's `stripModuleSyntax()` function (stripping `export`/`import` before injection) is an indirection that must be kept in sync with the source files' module syntax
- A fresh clone requires running `npm run build` before the application can be opened in a browser

## Alternatives Considered

### Alternative 1: Keep the Single-File Architecture

Continue with `web/index.html` as the only source file, using workarounds for linting and testing.

**Rejected because**: The `sed`-based lint extraction was already proving fragile. Testing pure functions by duplicating them in a separate file would create silent divergence. The single-file approach does not scale as the codebase grows.

### Alternative 2: Use a Bundler (Vite, Rollup, esbuild)

Use a standard frontend bundler to produce the single-file output.

**Rejected because**: A bundler adds significant tooling complexity and opinionated transformation behaviour for a project whose output is a single vanilla JavaScript file with one external CDN dependency. A small custom build script achieves the same result with full transparency and no additional runtime dependencies.

### Alternative 3: Test via a Browser Automation Tool

Keep the single-file architecture and test via a browser automation tool (e.g. Playwright) rather than importing functions in Node.js.

**Rejected because**: Browser automation tests are slower and more brittle than unit tests. Property-based testing of pure functions is most effective at the unit level where hundreds of inputs can be evaluated per second.

## References

- [docs/features/simulation-engine-property-based-tests.md](../features/simulation-engine-property-based-tests.md)
- [ADR-0001: Repository Structure Reorganization](./0001-repository-structure.md)
- [ADR-0003: Property-Based Testing](./0003-property-based-testing.md)
