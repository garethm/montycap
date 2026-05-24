# Feature: CSV Export

## Overview

Allows a user to save the current task list as a CSV file. Clicking the export button downloads a file containing all named task rows in the application's standard CSV format. The file can be re-imported without modification and opened in common spreadsheet tools.

## User Story

As a capacity planner, I want to save my task list to a CSV file so that I can preserve my work, share it with colleagues, and reload it in a future session.

## Functionality

### Core Features

- An "Export to CSV" button must download the current task list as a file named `timeline_planning_tasks.csv`
- Only rows with a non-empty Task Name must be included in the export; rows without a name must be silently excluded
- The exported file must conform to the format defined in [CSV File Format](./csv-file-format.md)
- Task names beginning with formula-starter characters must be escaped before export to prevent formula injection when the file is opened in a spreadsheet application

### User Interface

An "Export to CSV" button appears above the task grid, alongside the file picker and "Load from File" button. Clicking it triggers an immediate browser download with no additional confirmation step or dialogue.

### Data Flow

1. The user clicks "Export to CSV"
2. All task rows are read from the task grid; rows with an empty Task Name are excluded
3. Task names are checked for formula-starter characters and escaped where necessary
4. The row data is serialised to RFC 4180-conformant CSV with a header row and CRLF line endings
5. The CSV content is offered to the browser as a file download named `timeline_planning_tasks.csv`
6. The browser's native download mechanism handles the save location; the application does not retain or transmit the file content

## Security Considerations

### Attack Surface

#### Inbound Data Vectors

- **Task grid content**: Task names and numeric values are read from form inputs. These values originate from user entry or CSV import and must be treated as untrusted when deciding how to serialise them.

#### Outbound Data Vectors

- **File download**: The exported CSV is written to the user's filesystem. If opened in a spreadsheet application, formula-starter task names could be interpreted as formulas unless escaped.

#### Trust Boundaries

- **Task grid to CSV**: Task names must be inspected for formula-starter characters before serialisation; names beginning with such characters must be escaped.
- **Application to user's filesystem**: The download is initiated by a programmatically created anchor element; no content is sent to any server and no URL is retained after the download completes.

### Threat Model

- **Formula injection via exported file**: A task name beginning with `=`, `+`, `-`, `@`, tab, or carriage return would be interpreted as a formula by some spreadsheet applications when the file is opened → Mitigation: task names beginning with these characters must have a single quote prepended before serialisation.
- **Data exfiltration**: The export mechanism could be exploited to send file content to an external server rather than the user's filesystem → Mitigation: the download uses a blob URL created and immediately revoked in the browser; no network request is involved.

### Security Controls

- Task names beginning with formula-starter characters must be prefixed with a single quote before serialisation
- The download must use a browser-local blob URL that is revoked immediately after the download is initiated; no content must be transmitted to any server
- Numeric fields are written as-is; they cannot contain formula-starter values

## Configuration

| Constant | Value | Purpose |
|---|---|---|
| Export filename | `timeline_planning_tasks.csv` | Fixed filename offered to the browser download dialogue |
| Line ending | CRLF (`\r\n`) | RFC 4180 requirement for maximum spreadsheet compatibility |
| Formula-starter characters | `=`, `+`, `-`, `@`, tab (`\t`), carriage return (`\r`) | Task names beginning with these must be escaped |
| Escape prefix | `'` (single quote) | Prepended to formula-starter task names; stripped on re-import |

## Usage Examples

### Exporting the current task list

1. Configure tasks and run the simulation
2. Click "Export to CSV"
3. The browser downloads `timeline_planning_tasks.csv`
4. Open the file in a spreadsheet tool — all tasks appear as rows with correct column values

### Round-trip: export then import

1. Click "Export to CSV" to save the current task list
2. Click the file picker, select the downloaded file, and click "Load from File"
3. The task list is restored exactly as it was at the point of export

## Validation & Error Handling

Export requires no user-provided input and performs no validation that can fail. The only exclusion rule is that rows with an empty Task Name are omitted silently; no error or warning is shown for excluded rows.

If the task grid contains no named rows, the exported file will contain only the header row. The download still proceeds; no error is shown.

## Testing

### Test Cases

- A task list with three named rows exports a file containing a header row and three data rows
- A task list containing a row with an empty Task Name exports without that row; no error is shown
- A task list containing only unnamed rows exports a file with only the header row
- A task name beginning with `=` is exported with a leading `'` and the raw CSV contains `'=`
- A task name beginning with `'` followed by a formula-starter character is exported as `''=` (double single-quote)
- A task name containing a comma is exported as a quoted field
- A task name containing a double-quote is exported with the quote escaped as `""`
- The exported file uses CRLF line endings
- The exported filename is `timeline_planning_tasks.csv`
- The download does not trigger a network request (verifiable via browser DevTools network panel)

### Manual Testing Steps

1. Enter a task named `=HYPERLINK("http://evil.example","x")` and export — open the downloaded CSV in Excel or Google Sheets and confirm the cell is not rendered as a hyperlink
2. Enter a task with a comma in its name and export — open the file in a text editor and confirm the name is quoted
3. Export and re-import — confirm the task list is identical to the original
4. Export with an empty task grid — confirm the download still occurs and the file contains only the header row
5. Open browser DevTools network panel, click Export — confirm no network request is made

## Performance Considerations

- All task rows are read from the DOM in a single pass; with a maximum of 100 rows this is negligible
- The CSV is serialised in memory and written to a blob URL; no streaming or chunking is needed at this scale
- The blob URL is revoked immediately after the download link is clicked, releasing the memory

## Known Limitations

- The exported filename is fixed as `timeline_planning_tasks.csv`; the user cannot choose a different name at export time (though they can rename it after download).
- The export always captures the current state of the task grid at the moment of the click; any unsaved edits in progress are included.
- In some browsers, the download may silently fail if the user's download folder is full or write-protected; no error is surfaced to the application.

## Future Enhancements

- Allow the user to specify a custom filename before exporting.
- Show the number of rows included in the export as confirmation feedback after the download is initiated.

## Related Documentation

- [CSV File Format](./csv-file-format.md)
- [CSV Import](./csv-import.md)
- [Task Management](../01-configure/task-management.md)
- [ADR: CSV Format](../../adr/standards/csv-format.md)
- [ADR: DOM XSS Prevention](../../adr/security/dom-xss-prevention.md)
