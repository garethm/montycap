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

**pytm.** A Python-based code-first threat modeling library that generates DFDs and reports. Evaluated via a proof-of-concept model of the same architecture as the threatcl model (see `chore/pytm-poc`). Three findings drove the decision not to adopt it.

*Built-in threat library assumes server-side architecture.* Against a browser-only model, pytm's CAPEC-derived library generated 168 findings by default, the majority inapplicable — SQL injection, LDAP injection, buffer overflows, dictionary password attacks, session replay, network interception. Reducing this to a relevant set required either a 27-entry manual EXCLUDE list (filtering at the reporting layer) or setting Controls flags accurately across all elements (suppressing at the model layer). Both approaches require ongoing maintenance: the EXCLUDE list must be audited on every pytm upgrade; the Controls approach requires consistency across all elements or threats resurface on elements that were missed.

*Controls are binary and imply zero residual risk.* pytm's Controls model is a set of boolean flags. Once a flag is set, the corresponding threats are removed from findings entirely — there is no concept of partial mitigation or residual risk. In practice this means the model cannot represent that `sanitizesInput = True` reduces XSS likelihood substantially but does not eliminate it. threatcl's explicit `risk_reduction` score per control, and the fact that threats remain visible alongside their controls regardless of implementation status, allows the model to reflect that no control is perfect and that implemented mitigations still warrant ongoing review.

*Toolchain overhead.* pytm is a Python library, not a CLI binary. It requires a virtual environment (`python3 -m venv`), a `requirements.txt`, and graphviz for DFD output — three separate installation steps versus one binary for threatcl. This is a meaningful barrier in a JavaScript project where no Python toolchain is otherwise required.

**Threagile** (evaluated via PoC on `chore/threagile-poc`; model at `threatmodel/threagile/montycap.yaml`). YAML-based threat modeling with PDF report generation, quantified risk scoring, and deep integration with OWASP ASVS. The initial rejection (Docker overhead, YAML verbosity, weak validation) was written without empirical evidence and is replaced here with PoC findings.

The PoC model covers the runtime browser app, CDN dependencies, GitHub repository, GitHub Actions CI/CD pipeline, GitHub Pages hosting, and all five third-party GitHub Actions — 14 technical assets, 7 data assets, 4 trust boundaries, and 73 risk tracking entries. The existing threatcl model covers only the runtime app and CDN; a fair like-for-like comparison would require extending it to the same CI/CD scope (see below).

*Advantages found:*

- **ASVS alignment.** Every risk category maps to an ASVS control reference and CWE, providing a recognised security standard anchor that threatcl lacks.
- **Full SDLC modeling.** Threagile's trust boundary and communication link model covers the CI/CD pipeline, GitHub infrastructure, and third-party action supply chain as first-class elements. Whether threatcl can cover the same scope with comparable fidelity is an open question (see below).
- **Richer risk tracking.** Each tracking entry carries status, justification, ticket reference, date, and reviewer. threatcl represents mitigation only as a `risk_reduction` percentage per control, with no per-risk status or audit trail.
- **Quantified risk ratings.** Severity, likelihood, and data breach probability are derived from model attributes (confidentiality, integrity, asset classification) rather than manually assigned.
- **PDF report and two diagram types.** A data flow diagram and a data asset diagram are generated from the same YAML source. The PDF is structured for stakeholder review.
- **Security requirements and abuse cases as first-class fields.** Structural YAML elements with schema validation, not free-text prose.

*Limitations found:*

- **High false positive rate.** 50 of 73 risks (68%) were false positives. Threagile's built-in rule set assumes server-side architecture: it flags SSRF on every outbound HTTPS call (CDN loads, npm fetches, GitHub Actions invocations), missing authentication for public resources, missing WAF for external entities, and CSRF on a static app. Each false positive requires a tracked justification entry. The upfront investment is significant; ongoing maintenance is lower once the baseline is established.
- **Risk tracking ID fragility.** Synthetic IDs encode the full asset/link/trust-boundary/data-asset hierarchy. Any model restructuring — renaming an asset, retargeting a communication link — orphans existing entries. Orphaned IDs must be discovered from `risks.json` and corrected manually; they are not surfaced without the `-ignore-orphaned-risk-tracking` flag.
- **Docker dependency.** There is no npm-installable Threagile binary; Docker is required. This adds a contributor prerequisite not otherwise present in the toolchain.
- **Data asset diagram limitation.** Arrows always point toward assets (consumed-by / stored-in). There is no produced-by relationship, so outputs such as simulation results and exported CSV appear as inputs in the diagram.

*Open question — threatcl at equivalent scope:*

A direct comparison between the two tools is not yet possible because the threatcl model covers only the runtime application and CDN dependencies. A PoC extending the HCL model to include GitHub repository, GitHub Actions CI/CD, GitHub Pages, and the five third-party actions would establish whether the SDLC modeling gap is a real limitation of threatcl or simply an authoring gap in the current model.

**Microsoft Threat Modeling Tool.** STRIDE-native and widely referenced in literature. Rejected because it is Windows-only with an XML format that has a poor version control story and no CI integration path.

**Unstructured markdown.** A hand-written markdown document would fit the existing docs style and have no tooling dependency. Rejected because it cannot be validated, cannot generate a DFD from the same source as the threat descriptions, and has no structural enforcement — omitting impacts, STRIDE, or controls is silently permitted.

## References

- [threatcl documentation](https://github.com/threatcl/threatcl)
- [Threagile documentation](https://threagile.io)
- [threatmodel/montycap.hcl](../../threatmodel/montycap.hcl)
- [threatmodel/threagile/montycap.yaml](../../threatmodel/threagile/montycap.yaml) — Threagile PoC model
- [dom-xss-prevention.md](dom-xss-prevention.md)
- [security-policy.md](security-policy.md)
