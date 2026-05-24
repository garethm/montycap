# Feature: CSV File Format

## Overview

Task lists are stored and exchanged as CSV files conforming to RFC 4180. The format is designed to be readable and writable by common spreadsheet tools — Excel, Google Sheets, LibreOffice Calc — without data loss. A file exported by the application can be re-imported without any manual editing, and files produced by spreadsheet tools can be imported directly.

## User Story

As a capacity planner, I want a well-defined, portable file format for my task lists so that I can author or edit tasks in a spreadsheet tool and import them, and share exported files with colleagues using different tools.

## Functionality

### Core Features

- The format must use a fixed eight-column schema with a mandatory header row
- The format must conform to RFC 4180: comma-separated fields, CRLF line endings on export, both CRLF and LF accepted on import, quoted fields for values containing commas or double-quotes, `""` escaping for embedded double-quotes
- Task names containing commas, double-quotes, apostrophes, and Unicode characters must survive a full export–import round-trip without modification
- Task names beginning with characters that spreadsheet applications interpret as formula starters must be escaped on export and unescaped on import

### User Interface

This document specifies the file format, not user interactions. There are no UI elements associated with the format itself. UI elements for reading and writing files are defined in [CSV Import](./csv-import.md) and [CSV Export](./csv-export.md).

### Data Flow

On export, the application reads the task grid and serialises each named row into the eight-column schema. On import, the application parses the file according to the same schema and populates the task grid. The schema is the shared contract between the two operations; a file produced by either the application or a compatible spreadsheet tool must be acceptable to both.

## Security Considerations

### Attack Surface

#### Inbound Data Vectors

- **File content**: A CSV file submitted for import may contain arbitrary text in the Task Name column, including strings crafted to trigger formula execution or XSS payloads. Numeric columns may contain non-numeric values.

#### Outbound Data Vectors

- **File downloads**: The exported CSV file is written to the user's filesystem. If opened in a spreadsheet application, task names beginning with formula-starter characters could be interpreted as formulas unless escaped.

#### Trust Boundaries

- **File content to application**: Imported CSV content must be treated as untrusted. Task names are free text and must be rendered to the DOM as plain text, not as markup.
- **Application to spreadsheet tools**: Exported task names must be escaped to prevent formula injection when the file is opened in a spreadsheet application.

### Threat Model

- **Formula injection via exported file**: A task name beginning with `=`, `+`, `-`, `@`, tab, or carriage return would be interpreted as a formula by some spreadsheet applications when the exported CSV is opened → Mitigation: the application must prepend a single quote to any such task name on export; the quote must be stripped on re-import so round-tripping preserves the original name.
- **XSS via imported task name**: A crafted task name containing HTML or script content is imported and later rendered to the DOM → Mitigation: task names must be set via DOM text assignment, never injected as HTML — see [ADR: DOM XSS Prevention](../../adr/security/dom-xss-prevention.md).

### Security Controls

- Task names beginning with formula-starter characters must be prefixed with a single quote on export and have the prefix stripped on import
- Task names must be rendered to the DOM as plain text at all times — see [CSV Import](./csv-import.md)
- Numeric fields are not subject to formula injection and require no escaping

## Configuration

| Constant | Value | Purpose |
|---|---|---|
| Column headers | `Task Name`, `Skip %`, `Work Optimistic (hrs)`, `Work Expected (hrs)`, `Work Pessimistic (hrs)`, `Wait Optimistic (days)`, `Wait Expected (days)`, `Wait Pessimistic (days)` | Fixed header row; column order is significant |
| Formula-starter characters | `=`, `+`, `-`, `@`, tab (`\t`), carriage return (`\r`) | Task names beginning with these must be escaped on export |
| Escape prefix | `'` (single quote) | Prepended to formula-starter task names on export; stripped on import |

## Usage Examples

### Minimal valid file

```csv
Task Name,Skip %,Work Optimistic (hrs),Work Expected (hrs),Work Pessimistic (hrs),Wait Optimistic (days),Wait Expected (days),Wait Pessimistic (days)
Supplier Security Review,0,8,32,96,0,2,5
```

### File with optional tasks and wait time

```csv
Task Name,Skip %,Work Optimistic (hrs),Work Expected (hrs),Work Pessimistic (hrs),Wait Optimistic (days),Wait Expected (days),Wait Pessimistic (days)
Supplier Security Review,0,8,32,96,0,2,5
Vulnerability Assessment,0,24,64,120,1,3,7
Supplier Follow-up,60,8,24,64,0,1,3
```

### Task name requiring formula escaping (as it appears in the exported file)

```csv
'=SUM(A1:A10),0,8,16,32,0,0,0
```

The leading `'` is stripped on re-import; the task name is restored to `=SUM(A1:A10)`.

## Validation & Error Handling

A row is considered valid for import if it has a non-empty Task Name and at least eight columns. Rows failing this check are silently skipped — they do not block the import of other rows. Invalid numeric values are passed through to the task grid as-is; the simulation engine handles degenerate values.

The file as a whole is rejected before any rows are loaded if the total number of valid rows exceeds the task limit — see [CSV Import](./csv-import.md).

## Testing

### Test Cases

- A task name containing a comma round-trips correctly (export then import preserves the name)
- A task name containing a double-quote round-trips correctly
- A task name beginning with `=` is exported with a leading `'` and re-imported without it
- A task name beginning with `'=` (genuine apostrophe followed by `=`) is exported as `''=` and re-imported as `'=`
- A task name beginning with a plain apostrophe not followed by a formula-starter character is not modified on export or import
- A file using LF line endings imports correctly
- A file using CRLF line endings imports correctly
- A row with an empty Task Name is excluded from import without error
- A row with fewer than eight columns is excluded from import without error

### Manual Testing Steps

1. Enter a task named `=HYPERLINK("http://evil.example","Click me")` and export — open the exported file in a spreadsheet application and confirm the cell is not rendered as a hyperlink
2. Export a task list, open the CSV in a text editor, confirm CRLF line endings and a correct header row
3. Edit a task name in the exported CSV to include a comma, save, and re-import — confirm the name appears correctly in the task grid
4. Re-import an exported file without modification — confirm the task list is identical to the original

## Performance Considerations

The format specification itself imposes no performance requirements. File size limits and parse time constraints are concerns of the import process; see [CSV Import](./csv-import.md).

## Known Limitations

- The column order is fixed; files with columns in a different order or with additional columns will import with incorrect field mapping.
- The format carries no version indicator. If the schema changes in a future release, existing files may import incorrectly without a clear error message.
- Locale-specific decimal separators (e.g. `,` instead of `.` for European locales) produced by some spreadsheet tools will cause numeric fields to import incorrectly.
- Encoding is assumed to be UTF-8. Files saved with other encodings (e.g. Windows-1252 from older versions of Excel) may produce garbled task names for non-ASCII characters.

## Future Enhancements

- Add a version header row or comment to allow future schema changes to be detected and handled gracefully.
- Detect and reject files with locale-specific decimal separators, with a clear error message directing the user to resave the file with the correct locale settings.

## Related Documentation

- [CSV Import](./csv-import.md)
- [CSV Export](./csv-export.md)
- [Task Management](../01-configure/task-management.md) — the task schema the format represents
- [ADR: CSV Format](../../adr/standards/csv-format.md) — rationale for RFC 4180 and PapaParse
- [ADR: DOM XSS Prevention](../../adr/security/dom-xss-prevention.md)
