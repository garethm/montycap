# ADR-0015: Feature Documentation Structure

## Status

Accepted

## Context

The `docs/features/` directory contains a template and three feature documents, but no organising principle. As the feature documentation grows toward full coverage of the application, an unstructured flat directory becomes hard to navigate and gives a reader no sense of how features relate to each other or to the user workflow.

The three existing documents cover concerns at very different levels of abstraction — a simulation guard (complexity limits), a test infrastructure decision (property-based testing), and a security property (DOM injection prevention) — without any grouping that signals their relationship to the running application.

A reader trying to understand the application as a whole, or to regenerate a similar application from the documentation, needs a structure that reflects the conceptual architecture, not the implementation file layout.

## Decision

Feature documentation is organised into numbered subdirectories that reflect the application's workflow phases:

```text
docs/features/
├── template.md              Template for new feature documents
├── 01-configure/            Features concerned with defining inputs before a run
├── 02-simulate/             Features concerned with the simulation computation
├── 03-report/               Features concerned with presenting results to the user
├── 04-exchange/             Features concerned with data import and export
└── 90-testing/              Cross-cutting quality and verification concerns
```

The numbers establish a canonical reading and navigation order. `90-testing` is offset from the workflow sequence to signal that testing is a cross-cutting concern rather than a workflow phase.

Within each subdirectory, files are named descriptively without further numbering. The README index in `docs/README.md` lists all feature documents grouped by subdirectory.

## Rationale

**Workflow phases over implementation layers.** The obvious alternative — grouping by code layer (UI vs simulation engine) — mirrors `src/ui.js` vs `src/simulation.js` but obscures design decisions that span both. Complexity limits, for example, have UI behaviour (error states, button disablement) and a simulation guard (JavaScript validation before the loop enters); assigning it to one layer hides half the decision. A workflow phase grouping allows a single document to cover both layers for a given feature, which is where the interesting decisions live.

**Numbered directories over flat naming with prefixes.** A flat directory with filename prefixes (e.g. `simulate-complexity-limits.md`) achieves similar grouping in filesystem listings but makes the index harder to read and offers no explicit statement of intent about ordering. Subdirectories make the grouping a first-class structural fact and allow `docs/README.md` to present a clean two-level index.

**`90-testing` offset.** Testing documents describe how correctness is verified across the application rather than any single workflow phase. Numbering them `05-` would imply they belong after exchange in a workflow sequence, which is misleading. The `90-` prefix signals separation from the workflow while keeping all feature documentation under a single directory.

## Consequences

### Positive

- A reader unfamiliar with the application can navigate feature documentation in workflow order, building understanding incrementally
- Cross-layer features (complexity limits, CSV import/export) have a natural home without splitting their documentation
- The structure scales to full application coverage without reorganisation
- The numbered prefix convention is self-documenting — the ordering rationale is visible in the filenames

### Negative

- Relative link paths within feature documents are one level deeper than before (`../../adr/` instead of `../adr/`), requiring updates to existing documents when they are moved
- Subdirectory creation adds a small amount of friction when adding a new feature document for the first time in a category

## Alternatives Considered

### Alternative 1: Flat directory with filename prefixes

Keep all feature documents in `docs/features/` with names like `simulate-monte-carlo-engine.md`. Achieves grouping in filesystem listings without subdirectory overhead, but the grouping is implicit and the index in README reads as a flat list rather than a structured hierarchy.

### Alternative 2: Layer-based grouping (ui / simulation / testing)

Mirrors the source structure (`src/ui.js`, `src/simulation.js`). Rejected because several features span both layers, and the documentation value is highest precisely at the boundary between them. A layer split would force artificial placement or document duplication.

### Alternative 3: Single flat directory, no grouping

The current state. Acceptable for three documents; does not scale to full application coverage and gives no navigational structure to a new reader.

## References

- [Feature Template](../features/template.md)
- [ADR-0001: Repository Structure](0001-repository-structure.md)
