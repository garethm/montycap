# ADR: Documentation Structure

Project documentation is organised into directories that group content by concern and reflect the conceptual architecture of the application rather than its implementation structure.

## Decision

```text
docs/
├── foundation.md              Conceptual model — start here
├── adr/                       Architecture Decision Records
│   ├── structure/             Repository and code organisation decisions
│   ├── development/           Development workflow and tooling decisions
│   ├── security/              Security decisions
│   ├── dependencies/          Dependency selections and policy
│   └── standards/             Specification conformance decisions
├── features/                  Feature documentation
│   ├── 01-configure/          Defining inputs before a simulation run
│   ├── 02-simulate/           Simulation computation
│   ├── 03-report/             Presenting results
│   ├── 04-exchange/           Data import and export
│   └── 90-testing/            Cross-cutting quality and verification
└── development/               Contributor and maintenance guides
```

`foundation.md` is the intended entry point for anyone new to the project — it explains the planning problem and the conceptual model before any implementation detail.

ADRs are organised by topic rather than by numbered sequence. Each file describes the current architectural state; the history of how that state was reached is recorded in a History section within each document.

Feature documentation is organised by workflow phase. The numbered prefix establishes a canonical reading order that mirrors how a user moves through the application. `90-testing` is offset from the workflow sequence to signal that it is a cross-cutting concern rather than a workflow phase.

## Rationale

**Workflow phases over implementation layers for features.** The obvious alternative — grouping features by code layer (UI vs simulation engine) — mirrors the source file split but obscures decisions that span both. A feature like complexity limits has both UI behaviour and a simulation guard; assigning it to one layer hides half the decision. Workflow phase grouping allows a single document to cover both layers for a given feature.

**Topic directories over numbered sequence for ADRs.** Sequential numbering communicated chronological order, which is meaningful for an append-only decision log but not for declarative documents describing current architectural state. Topic directories make it easier to find decisions relevant to a given concern without reading a sequence of amendments.

**`foundation.md` is separate from the ADRs.** The conceptual model — why the tool works the way it does — is not an architectural decision record. It is stable background knowledge that rarely changes and serves a different audience: users and new contributors who need to understand the problem before they can understand the implementation.

## Consequences

### Benefits

- A reader unfamiliar with the application can navigate feature documentation in workflow order, building understanding incrementally
- ADRs can be found by concern rather than by chronological excavation
- Cross-layer features have a natural home without splitting their documentation

### Risks

- Features that span workflow phases require a judgement call about which phase is primary; there is no mechanical rule

## Rejected Approaches

**Flat feature directory with filename prefixes.** Achieves grouping in filesystem listings but the grouping is implicit and the index reads as a flat list without navigational structure.

**Layer-based feature grouping (ui / simulation / testing).** Mirrors the source structure but forces artificial placement for features that span both layers, which is where the most interesting decisions live.

**Numbered ADR sequence.** Communicates chronological order but not conceptual grouping. Finding all security decisions requires reading the sequence rather than navigating to `adr/security/`.

## References

- [foundation.md](../../foundation.md)

## History

- **Flat `docs/` directory** — all documentation at one level; simple initially but gave no navigational structure as content grew.
- **`adr/`, `features/`, `development/` subdirectories introduced** — documentation grouped by type and audience.
- **`features/` reorganised into workflow phase subdirectories** — flat feature list replaced with numbered phase directories to provide reading order and group related concerns.
- **`adr/` reorganised into topic subdirectories** — numbered sequence replaced with topic-based directories to support declarative architectural documentation.
