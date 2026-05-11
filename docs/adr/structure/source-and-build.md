# ADR: Source Structure and Build Step

The application is assembled from multiple source files into a single HTML file that runs directly in a browser without a server or module loader. External libraries are loaded via CDN rather than bundled.

## Decision

### Source file structure

`src/` contains four files with distinct roles:

- `simulation.js` — pure simulation and statistical functions; no DOM dependencies; importable in Node.js for testing
- `ui.js` — DOM-coupled UI functions; explicitly imports from `simulation.js`
- `template.html` — HTML structure and layout
- `styles.css` — stylesheet

The split between `simulation.js` and `ui.js` at the DOM boundary is structural: pure statistical functions have no business depending on the DOM, and separating them makes that constraint explicit rather than conventional. The explicit import in `ui.js` makes the dependency relationship visible in code.

### Build output

`scripts/build.js` assembles these into `web/index.html`. External library dependencies (Chart.js, PapaParse) are declared as CDN `<script>` tags in `template.html` and are not bundled into the output.

## Rationale

**A single HTML file is the simplest possible deployment unit.** It can be opened directly in a browser, served from any static host, or shared as a file attachment with no configuration. The multi-file source structure is a development concern; the single-file output is what the user receives.

**CDN-loaded libraries keep the output self-describing.** Bundling external libraries would produce a large, opaque output file. Loading them from CDN with pinned versions and SRI hashes keeps the output readable and the dependency versions explicit and verifiable.

**A custom build script is proportionate to the task.** The assembly is straightforward — concatenate source files, inject into a template. A full bundler would add significant complexity, opinionated transforms, and additional dependencies for a result that would be indistinguishable to the user.

## Consequences

### Benefits

- `simulation.js` being DOM-free is enforced structurally, not just by convention
- `web/index.html` can be opened directly in any modern browser with no installation or server setup
- The output is readable: its structure mirrors the source, and its dependencies are visible as CDN script tags
- The build step is small and auditable; its behaviour is fully visible in `scripts/build.js`

### Risks

- The application requires CDN availability at runtime; if cdnjs is unreachable, Chart.js and PapaParse will not load and those features will fail

## Rejected Approaches

**Standard frontend bundler (Vite, Rollup, esbuild).** Would handle source assembly and could inline dependencies, but introduces significant tooling complexity and opinionated transforms. The custom build script achieves the same output with full transparency.

**Keeping the single source file.** The original architecture required a fragile `sed` extraction in CI for linting and made automated testing impractical. Splitting source into separate files resolved both constraints without changing the output format.

## References

- [repository-layout.md](repository-layout.md)
- [../development/testing.md](../development/testing.md)
- [../dependencies/chartjs.md](../dependencies/chartjs.md)
- [../dependencies/papaparse.md](../dependencies/papaparse.md)

## History

- **Single `web/index.html`** — source and output were the same file; linting used a `sed` extraction in CI; automated testing was not practical.
- **Split into `src/` with build step** — source separated into ES modules to enable direct linting and Node.js-importable testing; build script introduced to reassemble them into the single-file output.
