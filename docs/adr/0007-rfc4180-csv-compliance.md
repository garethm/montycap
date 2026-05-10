# ADR-0007: RFC 4180 Compliance for CSV Import and Export

## Status

Accepted

> **Extended by [ADR-0008: PapaParse as the CSV Library](./0008-papaparse-cdn-dependency.md)**: this ADR mandates RFC 4180 compliance and decides to use a CDN-loaded library, but defers the specific library selection. ADR-0008 records that decision — PapaParse was chosen.

## Context

The application supports importing and exporting task configurations as CSV files. The current implementation in `src/ui.js` (`parseCSV`, line 548, and the export block, line 613) does not comply with [RFC 4180](https://www.rfc-editor.org/rfc/rfc4180), the de-facto standard for CSV interchange.

Known non-conformances in the current implementation:

1. **Line splitting on `\n` only** — RFC 4180 specifies CRLF (`\r\n`) as the canonical line terminator. Splitting only on `\n` leaves a trailing `\r` on every field in files produced by Windows tools or conforming generators, silently corrupting numeric values on import.

2. **Field splitting on bare `,`** — `lines[i].split(',')` breaks whenever a task name contains a comma (e.g. `"Design, build, test"`), producing too many fields and misaligning all subsequent columns for that row.

3. **Naive quote stripping via `.replace(/"/g, '')`** — removes every double-quote character unconditionally. It does not handle the RFC 4180 rule that a literal double-quote inside a quoted field must be escaped as `""`. A task named `Say "hello"` would be mangled on round-trip.

4. **Export does not escape embedded double-quotes** — the export template wraps only the task name column in quotes (`"${task[0]}"`) but does not escape any `"` characters already present in the name, producing malformed CSV that no conforming parser can read back correctly.

These defects mean that CSV files produced by Excel, Google Sheets, or any RFC 4180-conforming tool may fail to import correctly, and files exported by the application may not be readable by those tools.

## Decision

CSV import and export in this application must conform to RFC 4180. The implementation will delegate parsing and serialisation to a browser-compatible external library, loaded via CDN with a Subresource Integrity (SRI) hash, per the dependency policy in ADR-0005. The specific library selection is recorded in ADR-0008.

Behavioural requirements:

- **Import** must correctly parse quoted fields, including fields containing embedded commas and embedded newlines.
- **Import** must unescape `""` sequences inside quoted fields to a single `"`.
- **Import** must accept both CRLF and LF line endings (LF tolerance is a pragmatic allowance for Unix-generated files).
- **Export** must use CRLF line terminators.
- **Export** must quote any field whose value contains a comma, double-quote, or newline.
- **Export** must escape any double-quote character in a field value as `""`.

The header row is always present; it is skipped on import and emitted on export.

## Rationale

### Interoperability

Task lists are likely to be authored or reviewed in spreadsheet tools (Excel, Google Sheets, LibreOffice Calc). All of these generate RFC 4180-conformant CSV. Accepting only a non-standard subset creates a silent data-corruption path that is hard for users to diagnose.

### Round-trip fidelity

The application allows any string as a task name. Names containing commas or quotation marks (common in prose descriptions) currently produce corrupt CSV on export and fail to re-import. Compliance is the minimum required to guarantee a lossless round-trip for all task names.

### Delegating a well-specified but edge-case-heavy problem

RFC 4180 is short but its full implementation is non-trivial: quoted fields, embedded newlines, escaped quotes, BOM handling, and CRLF vs LF tolerance each represent a distinct code path. Mature browser-compatible CSV libraries carry large test suites and years of production use covering these cases. Implementing this in-house means owning all of those edge cases indefinitely with no equivalent test coverage.

The CDN model, already in use for Chart.js, is the appropriate integration mechanism for a browser-only dependency with no npm footprint.

## Consequences

### Positive

- CSV files exported by the application will be importable by Excel, Google Sheets, and any other RFC 4180-conforming tool without data loss.
- CSV files produced by those tools will import without corruption, even when task names contain commas or quotation marks.
- Round-trip fidelity: export followed by import produces an identical task list for all valid task names.
- Edge cases (BOM, embedded newlines, escaped quotes, CRLF/LF) are handled by a battle-tested external implementation rather than in-house code.
- Files exported before this change used LF endings and unescaped quotes; they remain importable provided the chosen library tolerates LF line endings.

### Negative

- A second CDN runtime dependency is introduced. Like Chart.js, this creates a runtime availability dependency on cdnjs; if cdnjs is unreachable the CSV feature will not function.
- The SRI hash in `src/template.html` must be updated whenever the library version is upgraded.

## Alternatives Considered

### Alternative 1: Custom RFC 4180-compliant implementation

Implement a compliant parser and serialiser in-house within `src/simulation.js` or `src/ui.js`.

**Rejected because**: RFC 4180 has enough edge cases that a correct implementation requires meaningful ongoing maintenance and testing. The cost of in-house ownership is not justified when healthy browser-compatible libraries are available via the CDN mechanism already in use.

### Alternative 2: Node.js-native CSV libraries (csv-parse, fast-csv, etc.)

Use a Node.js-native library from npm.

**Rejected because**: Node.js-native libraries cannot be loaded via CDN and require a bundler to run in the browser — adding a bundler would conflict with the intentionally minimal build step established in ADR-0002.

### Alternative 3: Restrict task name input to disallow commas and quotes

Validate task names on entry to reject characters that break the naive parser.

**Rejected because**: task names are prose; commas and quotation marks are natural. Restricting input to work around a deficient parser trades a parsing problem for a permanent usability constraint.

### Alternative 4: Switch to a different interchange format (JSON, TSV)

Replace CSV with JSON or tab-separated values, which have simpler parsing rules.

**Rejected because**: CSV is already the shipped format and is what users expect from a spreadsheet-friendly tool. Migrating breaks all existing exported files. The problem is solvable within the CSV format.

## References

- [RFC 4180 – Common Format and MIME Type for Comma-Separated Values (CSV) Files](https://www.rfc-editor.org/rfc/rfc4180)
- [ADR-0002: Source Restructuring and Build Step](0002-source-restructuring-and-build-step.md)
- [ADR-0005: Dependency Decision Policy](0005-dependency-decision-policy.md)
- [ADR-0008: PapaParse CDN Dependency](0008-papaparse-cdn-dependency.md)
