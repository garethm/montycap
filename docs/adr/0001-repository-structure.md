# ADR-0001: Repository Structure Reorganization

## Status

Accepted

## Context

The repository originally had a flat structure with the main application file (`index.html`) at the root alongside documentation and configuration files. This made it difficult to:

- Distinguish between source code and documentation
- Scale documentation as the project grows
- Follow industry-standard project organization conventions
- Provide clear separation of concerns for different types of content

As a single-file HTML application, the project needs a structure that maintains simplicity while providing room for comprehensive documentation including Architecture Decision Records (ADRs), feature documentation, and development guidelines.

## Decision

Reorganize the repository into a structured layout with dedicated directories:

```text
montycap/
├── web/                   # Web application assets
│   └── index.html        # Main application
├── docs/                 # All documentation
│   ├── adr/             # Architecture Decision Records
│   ├── features/        # Feature-specific documentation
│   └── development/     # Development tools and guides
├── .github/             # GitHub workflows and config
├── CLAUDE.md            # Claude Code instructions (required at root)
├── LICENSE             # Project license
└── README.md          # Project overview
```

## Rationale

### Clear Separation of Concerns

- **Web assets** (`web/`) contains the web application files following standard layout
- **Documentation** (`docs/`) contains all written documentation
- **Configuration** (`.github/`, root files) contains project metadata
- **Development tools** (`CLAUDE.md`) remain at root as required by tooling conventions

### Scalable Documentation Structure

- **ADRs** (`docs/adr/`) for architectural decisions and their rationale
- **Features** (`docs/features/`) for detailed feature documentation
- **Development** (`docs/development/`) for contributor and maintenance guides

### Industry Standards

- Follows [Standard Directory Layout](https://github.com/golang-standards/project-layout) conventions
- Uses `/web` directory for web application assets as recommended
- Respects Claude Code requirement for `CLAUDE.md` at repository root
- Familiar structure for contributors and maintainers

### Maintainability

- Easy to locate specific types of documentation
- Clear place for new documentation to be added
- Supports automation and documentation generation tools

## Consequences

### Positive

- **Improved Organization**: Clear separation makes the project more professional and easier to navigate
- **Scalable Documentation**: Room to grow comprehensive documentation without cluttering
- **Standard Conventions**: Follows industry practices that contributors expect
- **Better Tooling Support**: Standard structure works well with documentation generators and CI/CD tools
- **Clear Development Workflow**: Obvious place for development-specific documentation

### Negative

- **Path Updates Required**: All references to `index.html` must be updated to `web/index.html`
- **Slightly More Complex**: Additional directory navigation compared to flat structure
- **Migration Effort**: Existing documentation needs to be moved and reorganized

## Alternatives Considered

### Alternative 1: Keep Flat Structure

Keep all files at the root level as originally organized.

**Rejected because**: This approach doesn't scale well and makes it difficult to organize different types of documentation. It also doesn't follow standard conventions that contributors expect.

### Alternative 2: Use `/src` Directory

Place application files in `/src` directory as commonly seen in frontend projects.

**Rejected because**: The [Standard Directory Layout](https://github.com/golang-standards/project-layout) explicitly discourages `/src` directories, noting they typically happen "when the devs came from the Java world." The recommended approach is `/web` for web application assets.

### Alternative 3: Separate Source and Docs Repositories

Split the project into separate repositories for source code and documentation.

**Rejected because**: This adds unnecessary complexity for a single-file application. The overhead of managing multiple repositories outweighs the benefits for this project size.

## References

- [Architectural Decision Records](https://adr.github.io/) - ADR documentation standards
- [Standard Directory Layout](https://github.com/golang-standards/project-layout) - Common project organization patterns
- [Documentation Best Practices](https://www.writethedocs.org/guide/index.html) - Documentation writing guidelines
