# ADR: CSV Format

CSV import and export must conform to RFC 4180.

## Decision

The application's CSV import and export behaviour must meet the following requirements derived from [RFC 4180](https://www.rfc-editor.org/rfc/rfc4180):

**Import**:
- Correctly parses quoted fields, including fields containing embedded commas and embedded newlines
- Unescapes `""` sequences inside quoted fields to a single `"`
- Accepts both CRLF and LF line endings

**Export**:
- Uses CRLF line terminators
- Quotes any field whose value contains a comma, double-quote, or newline
- Escapes any double-quote character in a field value as `""`
- Emits a header row

Parsing and serialisation is delegated to PapaParse, loaded via CDN. See [../dependencies/papaparse.md](../dependencies/papaparse.md) for the library selection rationale.

## Rationale

**Interoperability with spreadsheet tools.** Task lists are likely to be authored or reviewed in Excel, Google Sheets, or LibreOffice Calc. All of these generate RFC 4180-conformant CSV. Non-conformance creates a silent data-corruption path that is hard for users to diagnose — a task name containing a comma silently splits into multiple fields, misaligning all subsequent columns.

**Round-trip fidelity.** Task names are free-text; commas and quotation marks are natural in prose descriptions. Full RFC 4180 compliance guarantees a lossless round-trip for all valid task names, including those containing the characters that naive parsers cannot handle.

**Delegating a well-specified but edge-case-heavy problem.** RFC 4180 is short but its full implementation is non-trivial: quoted fields, embedded newlines, escaped quotes, BOM handling, and CRLF/LF tolerance each represent a distinct code path. A mature library carries the test coverage for these cases; an in-house implementation would need to own them indefinitely.

## Consequences

### Benefits

- CSV files exported by the application are importable by Excel, Google Sheets, and any RFC 4180-conforming tool without data loss
- CSV files produced by those tools import correctly, even when task names contain commas or quotation marks
- Round-trip fidelity: export followed by import produces an identical task list for all valid task names

### Risks

- **CSV injection.** Fields beginning with `=`, `+`, `-`, or `@` are interpreted as formulas by some spreadsheet applications. Modern versions of Excel and Google Sheets no longer auto-execute formulas from imported CSV files, so practical exploitability is low. This will be routinely flagged in security reviews if not addressed.
- **Inconsistent CSV handling across tools.** CSV has no formal schema or typing. Tools differ on encoding (UTF-8 vs. UTF-8-with-BOM vs. Windows-1252), number formatting (locale-specific decimal separators), and date serialisation. A file produced by one tool may import with subtly wrong values in another, even when both claim RFC 4180 conformance.

## Rejected Approaches

**XLSX.** Native format for Excel and well-supported in Google Sheets; preserves types and avoids encoding ambiguity. Rejected because the file format is a complex binary/XML container requiring a substantial parsing library, the added weight is not justified for exporting a simple flat table of task data, and CSV is already the expected interchange format for spreadsheet-friendly tools.

**Restricting task names to exclude commas and quotes.** Trades a parsing problem for a permanent usability constraint. Task names are prose; restricting them to work around a deficient parser is not acceptable.

**Alternative interchange formats (JSON, TSV).** CSV is the expected format for spreadsheet-friendly tools and is what users already have. Migration would break existing exported files.

## References

- [RFC 4180](https://www.rfc-editor.org/rfc/rfc4180)
- [../dependencies/papaparse.md](../dependencies/papaparse.md)

## History

- **Non-conformant naive parser** — CSV split on bare commas and newlines; task names containing commas or quotes produced corrupt output on import and export.
- **RFC 4180 compliance adopted** — parsing and serialisation delegated to PapaParse; behavioural requirements formalised.
