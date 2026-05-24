# ADR: Repository Layout

The repository is organised into directories that separate source files, build artifacts, tests, and documentation, each with a defined purpose and boundary.

## Decision

```text
montycap/
├── src/                   Source files assembled by the build step
├── scripts/               Build tooling
├── test/                  Automated tests
├── web/                   Built artifact (gitignored)
├── docs/                  All project documentation
├── threatmodel/           threatcl HCL threat model source files
├── .github/               GitHub workflows and configuration
└── [root config files]    Project metadata and tooling configuration
```

### `web/` — Built artifact

`web/index.html` is the assembled application — a self-contained HTML file requiring no server or runtime dependencies. It is gitignored; every build produces it fresh from `src/`.

### `threatmodel/` — Threat model source

threatcl HCL files defining the application's threat model. Generated output (dashboard markdown, DFD diagrams) is written to `docs/threatmodel/` and gitignored. See [threat-modeling.md](../security/threat-modeling.md).

### `docs/` — Documentation

- `foundation.md` — the conceptual model; the right starting point for understanding the tool
- `adr/` — Architecture Decision Records
- `features/` — feature documentation organised by workflow phase
- `development/` — contributor and maintenance guides

## Rationale

**`src/` contains the source files assembled into the deployed artifact.** The internal structure of those files — how they are divided and why — is covered in [source-and-build.md](source-and-build.md).

**`web/index.html` and `docs/threatmodel/` are not versioned.** Both are deterministically produced by their respective build steps (`npm run build` and `npm run threatmodel`). Committing generated output alongside its sources creates drift risk and unnecessary diff noise; the gitignore enforces that only source is versioned.

**`docs/` collects all documentation under one tree.** Keeping documentation in a single directory makes it easy to locate, cross-link, and apply consistent standards. Subdirectories group by audience and purpose rather than by code layer.

## Consequences

### Benefits

- Clear separation makes each directory's purpose immediately apparent to a new contributor
- Gitignoring `web/index.html` prevents stale built artifacts from being committed

### Risks

- A contributor unaware that `web/index.html` is generated may edit it directly, losing those changes when the build next runs. A do-not-edit comment at the top of the file makes this explicit.

## Rejected Approaches

**Keeping source and artifact in the same directory.** The original structure placed `index.html` at the repository root and served as both source and output. As the source became multi-file, conflating source and artifact in one location made it unclear which files were inputs and which were outputs. Separating them into `src/` and `web/` makes the distinction unambiguous.

**Standard frontend bundler (Vite, Rollup, esbuild).** Adds significant tooling complexity and opinionated transformation behaviour for a project whose output is a single vanilla JavaScript file. A small custom build script achieves the same result with full transparency and no additional runtime dependencies.

**Separate repositories for source and documentation.** Unnecessary complexity for this project size; overhead outweighs the benefits.

## References

- [source-and-build.md](source-and-build.md)
- [documentation.md](documentation.md)
- [threat-modeling.md](../security/threat-modeling.md)

## History

- **Single file at root** (`web/index.html` alongside flat documentation) — the original structure; simple but did not separate code from docs and made linting and testing impractical.
- **`web/` and `docs/` directories introduced** — code and documentation separated as the project grew and a more navigable layout was needed.
- **`src/`, `scripts/`, and `test/` added** — source split into separate files to enable direct linting and importable modules; the build step was introduced to reassemble them into `web/index.html`, with tests arriving alongside it.
- **`threatmodel/` added** — threatcl HCL threat model introduced as a separate source directory following the same pattern as `src/`; generated output gitignored.
