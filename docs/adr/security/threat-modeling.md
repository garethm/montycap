# ADR: Threat Modeling Approach

Threat models for this project are authored as threatcl HCL files in `threatmodel/` and built via `npm run threatmodel`.

## Decision

1. **Threat models are stored as threatcl HCL source files in `threatmodel/`.** The HCL format is the source of truth; generated output (dashboard markdown, DFD diagrams) is a build artefact and is gitignored.
2. **`npm run threatmodel` generates the full output;** `npm run threatmodel:validate` validates the HCL and is suitable for CI.
3. **The threat model is updated alongside material changes to the application's attack surface** — new input paths, new dependencies, or significant changes to data handling.

## Rationale

**Reviewability.** HCL is compact and diff-friendly. Changes to threats, controls, or STRIDE classifications are visible as meaningful line-level diffs in pull requests. JSON-based tools (Threat Dragon) produce large opaque files that are difficult to review. A markdown-only model is reviewable but cannot be validated or generate diagrams.

**Validation.** `threatcl validate` catches structural errors — broken `information_asset_refs`, unknown STRIDE values, malformed blocks — before they reach main. This is the same principle as ESLint and html-validate in the existing `validate` script.

**Generated DFD.** The data flow diagram is derived from the same source as the threat descriptions, so the two cannot diverge. Maintaining a diagram separately from the threat model (as most manual approaches require) creates a common source of drift.

**Proportionate overhead.** threatcl is a single binary with no runtime dependencies. For a project of this size the tooling cost is low relative to the structure it provides.

## Consequences

### Benefits

- Threat model changes are code-reviewed on the same PRs as the features they describe
- `threatcl validate` can be added to CI as a lightweight gate
- DFD and dashboard output are generated consistently rather than maintained by hand
- HCL source is readable without running any tooling

### Risks

- threatcl is an external binary that must be installed separately; it is not declared in `package.json` and cannot be installed via `npm install`. Contributors need to install it independently.
- The HCL schema has a learning curve. Unlike a blank markdown file, authoring requires familiarity with threatcl's block types and valid field values.
- threatcl is a smaller ecosystem tool; long-term maintenance is less certain than OWASP-backed alternatives.

## Rejected Approaches

**OWASP Threat Dragon.** A well-supported visual tool with a JSON model file. Rejected primarily because the JSON output is verbose and not practically reviewable in PRs — the diff for a minor change is hundreds of lines of coordinates and metadata. It also has no build/validate step that integrates naturally with an npm workflow.

**pytm.** A Python-based code-first threat modeling library that generates DFDs and reports. Technically well-suited to the code-first approach we wanted, but adds a Python toolchain dependency to a JavaScript project. The project is less actively maintained than threatcl.

**Threagile.** YAML-based threat modeling with report generation. Requires Docker or a Java runtime, which is disproportionate overhead for a project this size. YAML models also grow verbose quickly and lack strong validation of STRIDE or CIA fields.

**Microsoft Threat Modeling Tool.** STRIDE-native and widely referenced in literature. Rejected because it is Windows-only with an XML format that has a poor version control story and no CI integration path.

**Unstructured markdown.** A hand-written markdown document would fit the existing docs style and have no tooling dependency. Rejected because it cannot be validated, cannot generate a DFD from the same source as the threat descriptions, and has no structural enforcement — omitting impacts, STRIDE, or controls is silently permitted.

## References

- [threatcl documentation](https://github.com/threatcl/threatcl)
- [threatmodel/montycap.hcl](../../threatmodel/montycap.hcl)
- [dom-xss-prevention.md](dom-xss-prevention.md)
- [security-policy.md](security-policy.md)
