# Documentation Index

This directory contains comprehensive documentation for the Monte Carlo Capacity Planning Tool.

## Quick Navigation

### For Users

- **[Main README](../README.md)**: Getting started and basic usage
- **[Security Policy](development/SECURITY.md)**: Security considerations and vulnerability reporting

### For Contributors

- **[Contributing Guide](development/CONTRIBUTING.md)**: How to contribute to this project
- **[Security Policy](development/SECURITY.md)**: Security considerations for development

### For Maintainers

- **[Architecture Decision Records](adr/)**: Technical decisions and their rationale
- **[Feature Documentation](features/)**: Detailed feature specifications and templates

## Documentation Structure

```text
docs/
├── README.md                    # This navigation file
├── adr/                        # Architecture Decision Records
│   ├── template.md            # ADR template for new decisions
│   └── 0001-repository-structure.md
├── features/                   # Feature-specific documentation
│   └── template.md            # Template for documenting features
└── development/               # Development and maintenance docs
    ├── CONTRIBUTING.md        # Contribution guidelines
    └── SECURITY.md           # Security policy and procedures
```

## Documentation Standards

### Writing Guidelines

- Use clear, concise language
- Include blank lines after headings and before lists
- Specify language types in code blocks (e.g., `bash`, `text`, `javascript`)
- Follow the templates provided for consistency

### Security Focus

All documentation includes security considerations:

- **Threat modeling**: Identify potential security risks
- **Attack surface analysis**: Document inbound and outbound data flows
- **Mitigation strategies**: Explain how risks are addressed
- **Security testing**: Include security validation steps

### Maintenance

- Keep documentation up-to-date with code changes
- Review annually for accuracy and completeness
- Update templates as standards evolve
- Archive outdated decisions in ADRs rather than deleting them

## Templates Available

- **[ADR Template](adr/template.md)**: For documenting architectural decisions
- **[Feature Template](features/template.md)**: For documenting features with security considerations

## Getting Help

- Check existing documentation first
- Search [GitHub Issues](https://github.com/garethm/montycap/issues) for answers
- Create new issues for documentation improvements
- Follow the [Contributing Guide](development/CONTRIBUTING.md) for documentation changes
