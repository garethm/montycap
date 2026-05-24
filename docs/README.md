# Documentation Index

## Quick Navigation

### For users
- **[Foundation](foundation.md)** — the conceptual model and planning problem
- **[Main README](../README.md)** — getting started and basic usage
- **[Security Policy](development/SECURITY.md)** — vulnerability reporting

### For contributors
- **[Foundation](foundation.md)** — start here to understand the design intent
- **[Contributing Guide](development/CONTRIBUTING.md)** — how to contribute
- **[Branch Policy](adr/development/branch-policy.md)** — branch naming and scoping
- **[Architecture Decision Records](adr/)** — current architectural decisions by topic
- **[Feature Documentation](features/)** — feature specifications by workflow phase
- **[Dependency Reviews](development/dependency-reviews/)** — periodic dependency health assessments

## Documentation Structure

```text
docs/
├── foundation.md              Conceptual model — start here
├── adr/                       Architecture Decision Records
│   ├── template.md            Template for new ADRs
│   ├── structure/             Repository and code organisation
│   ├── development/           Development workflow and tooling
│   ├── security/              Security decisions
│   ├── dependencies/          Dependency selections and policy
│   └── standards/             Specification conformance
├── features/                  Feature documentation
│   ├── template.md            Template for new feature docs
│   ├── 01-configure/          Input definition
│   ├── 02-simulate/           Simulation computation
│   ├── 03-report/             Results display
│   ├── 04-exchange/           CSV import and export
│   └── 90-testing/            Cross-cutting quality concerns
└── development/               Contributor and maintenance docs
    ├── CONTRIBUTING.md
    ├── SECURITY.md
    └── dependency-reviews/    Per-date dependency health assessments
        └── YYYY-MM-DD.md
```

## Documentation Standards

- Use clear, concise language
- Include blank lines after headings and before lists
- Specify language in code blocks (`bash`, `text`, `javascript`)
- Follow the templates in `adr/template.md` and `features/template.md`

## Maintenance

- ADRs describe current architectural state; update them in place when the architecture changes
- Dependency health assessments are recorded in `development/dependency-reviews/`
- Feature documentation should be updated when features change
