# Feature: CSV Import

## Overview

Allows a user to load a task list from a CSV file into the task grid, replacing the current tasks. The file must conform to the application's CSV schema. Several validation checks run before any tasks are loaded, so the existing task list is never partially replaced.

## User Story

As a capacity planner, I want to load a previously saved task list from a CSV file so that I can resume work on a programme without re-entering tasks manually.

## Functionality

### Core Features

- A file picker must allow the user to select a CSV file from their local filesystem
- The selected file must pass a series of validation checks before any content is loaded
- If validation passes, the current task list must be replaced in full with the tasks from the file
- If validation fails at any point, the existing task list must be left unchanged and an error message must be shown
- Rows with an empty Task Name or fewer than eight columns must be silently skipped; they must not block the import of other rows
- Task names escaped for formula injection on export must be unescaped on import, restoring the original name — see [CSV File Format](./csv-file-format.md#formula-injection-handling)

### User Interface

A file picker and a "Load from File" button appear above the task grid. The user selects a file using the picker and then clicks the button to trigger the import. There is no drag-and-drop target; selection must be done through the browser's native file dialogue.

### Data Flow

1. The user selects a file and clicks "Load from File"
2. The file is validated against extension, MIME type, and size constraints before any content is read
3. The file content is read as UTF-8 text
4. The content is parsed according to the RFC 4180 rules defined in [CSV File Format](./csv-file-format.md)
5. Parsed rows are filtered to retain only those with a non-empty Task Name and at least eight columns
6. If the number of valid rows exceeds the task limit, the import is rejected and the existing task list is preserved
7. Otherwise, the task grid is cleared and each valid row is added as a new task row

## Security Considerations

### Attack Surface

#### Inbound Data Vectors

- **File upload**: The user selects a file from their local filesystem. The file name, MIME type, and content are all supplied by the user and must be treated as untrusted.
- **File content**: Task names may contain arbitrary strings, including HTML, script content, and formula-starter characters.

#### Outbound Data Vectors

- **DOM rendering**: Task names from the imported file are written into the task grid. They must be set as plain text, never as HTML.

#### Trust Boundaries

- **File to application**: File extension, MIME type, and size must all be validated before the file is read. File content must be parsed by a conformant RFC 4180 parser and must not be evaluated or executed.
- **Parsed content to DOM**: Task names must be assigned to input values via the DOM API, not injected as markup — see [ADR: DOM XSS Prevention](../../adr/security/dom-xss-prevention.md).

### Threat Model

- **Malicious file content (XSS)**: A crafted task name containing `<script>` tags or event handler syntax is imported and written to the DOM → Mitigation: task names must be set via `input.value` assignment, which the browser treats as plain text regardless of content.
- **Resource exhaustion via large file**: An oversized file causes the browser to stall while reading → Mitigation: files larger than 1 MB must be rejected before the content is read.
- **Task limit bypass via file import**: A file containing more than 100 valid rows causes the application to exceed its task count limit → Mitigation: the import must be rejected in full if valid row count exceeds the limit; the existing task list must be preserved.
- **MIME type spoofing**: A non-CSV file is given a `.csv` extension to pass the extension check → Mitigation: both extension and MIME type are checked where the browser provides a MIME type; content is still parsed as CSV regardless of actual structure.

### Security Controls

- File extension must end in `.csv`
- MIME type, when provided by the browser, must be one of the permitted CSV types
- File size must not exceed 1 MB
- Valid row count must not exceed 100 before any tasks are loaded
- Task names must be rendered to the DOM as plain text — see [ADR: DOM XSS Prevention](../../adr/security/dom-xss-prevention.md)
- Formula-injection prefixes added on export must be stripped on import using the inverse of the export escaping scheme

## Configuration

| Constant | Value | Purpose |
|---|---|---|
| Maximum file size | 1 MB | Prevents resource exhaustion from oversized files |
| Permitted MIME types | `text/csv`, `text/plain`, `application/csv`, `application/vnd.ms-excel` | Accepted content types alongside the `.csv` extension check |
| Maximum task rows | 100 | Import is rejected in full if valid row count exceeds this limit |

## Usage Examples

### Loading a saved task list

1. Click the file picker and select `timeline_planning_tasks.csv`
2. Click "Load from File"
3. The current task list is replaced with the tasks from the file
4. The simulation re-runs automatically with the imported tasks

### Recovering from a rejected import

1. Click the file picker and select a file with 150 valid task rows
2. Click "Load from File"
3. An error message reports that the file contains too many tasks
4. The existing task list remains unchanged

## Validation & Error Handling

Validation runs in the following order, stopping at the first failure:

| Check | Failure response |
|---|---|
| A file has been selected | Alert: "Please select a file first" |
| File name ends in `.csv` | Alert: "Invalid file type. Please upload a CSV file (.csv)." |
| MIME type is permitted (when provided) | Alert: "Invalid file type. Please upload a CSV file." |
| File size does not exceed 1 MB | Alert: "File is too large (*N* KB). Please upload a CSV file smaller than 1 MB." |
| Valid row count does not exceed 100 | Alert: "This file contains *N* tasks, which exceeds the limit of 100. Please reduce the number of tasks in the file and try again." |

If all checks pass, the import proceeds. Rows with an empty Task Name or fewer than eight columns are silently skipped; no error is shown for individual invalid rows.

## Testing

### Test Cases

- A valid CSV file with three tasks imports correctly and replaces the current task list
- A file with no extension other than `.csv` (e.g. `.txt`) is rejected before content is read
- A file larger than 1 MB is rejected before content is read
- A file with 101 valid rows is rejected; the existing task list is unchanged
- A file with 100 valid rows and additional invalid rows imports the 100 valid rows only
- A task name containing `<img src=x onerror=alert(1)>` imports without triggering the handler
- A task name exported with a formula-injection prefix (`'=`) is imported as `=` (prefix stripped)
- A row with an empty Task Name is excluded; no error is shown and other rows are imported
- A row with fewer than eight columns is excluded; no error is shown and other rows are imported
- Cancelling the file picker without selecting a file and clicking "Load from File" shows the "Please select a file first" alert

### Manual Testing Steps

1. Export the default task list, then immediately re-import it — confirm the task list is identical
2. Select a `.txt` file — confirm the error alert fires and no tasks change
3. Select a CSV file larger than 1 MB — confirm the size-limit alert fires
4. Prepare a CSV with 101 valid rows and import it — confirm the task-limit alert fires and the existing tasks are unchanged
5. Enter a task named `<script>alert(1)</script>`, export, re-import — confirm no alert fires and the name appears as plain text in the task grid
6. Enter a task named `=HYPERLINK("http://evil.example","x")`, export, re-import — confirm the name round-trips correctly and no formula executes

## Performance Considerations

- Files are read in full before parsing begins; a 1 MB limit bounds the maximum memory used during a single import operation
- Parsing and row validation are O(n) in the number of rows; with a maximum of 100 valid rows the parse time is negligible
- The task grid is cleared and rebuilt in a single pass after validation; there is no incremental rendering

## Known Limitations

- There is no progress indicator during file reading; for files approaching the 1 MB limit the browser may appear unresponsive briefly.
- MIME type checking depends on the browser providing a type; some browsers report an empty MIME type for `.csv` files, in which case only the extension check applies.
- Files saved with non-UTF-8 encodings (e.g. Windows-1252) will import without error but non-ASCII characters may be garbled.
- The import replaces the entire task list; there is no merge or append option.

## Future Enhancements

- Add an append mode that adds imported tasks to the existing list rather than replacing it.
- Show a preview of the tasks to be imported before committing, allowing the user to confirm or cancel.
- Detect and report non-UTF-8 encoding with a clear error message.

## Related Documentation

- [CSV File Format](./csv-file-format.md)
- [CSV Export](./csv-export.md)
- [Task Management](../01-configure/task-management.md)
- [Simulation Complexity Limits](../02-simulate/simulation-complexity-limits.md) — the 100-task limit applies equally to import and manual entry
- [ADR: CSV Format](../../adr/standards/csv-format.md)
- [ADR: DOM XSS Prevention](../../adr/security/dom-xss-prevention.md)
