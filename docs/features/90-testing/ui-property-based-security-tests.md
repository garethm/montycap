# Feature: UI DOM Security Property-Based Tests

## Overview

Property-based security testing of the DOM-building functions in `src/ui.js` that handle user-supplied data. Tests verify that arbitrary string inputs — including crafted XSS payloads — cannot inject HTML or event handlers into the DOM via `addTaskFromData` or through the CSV import path via `parseCSV`.

`createHistogram` correctness invariants are explicitly out of scope for this feature and addressed separately.

## User Stories

**As a developer, I want property-based tests that verify `addTaskFromData` cannot inject HTML for any task name** so that I can be confident that manually entered task names are always rendered as text, never as markup.

**As a developer, I want property-based tests that verify `parseCSV` does not allow XSS via CSV field values** so that I can be confident that importing a malicious CSV file cannot inject script or event handlers into the task list.

## Functionality

### Core Features

- fast-check generates arbitrary Unicode strings, including embedded `<`, `>`, `"`, `'`, `&`, and full XSS payload patterns, as task name inputs
- Tests assert absence of injected elements and event handler attributes after each generated input
- Tests run in a `happy-dom` environment via vitest's per-file `// @vitest-environment happy-dom` directive, isolated from the existing Node-environment simulation tests

### Tested Invariants

| Function | Invariant |
|---|---|
| `addTaskFromData` | Task div has exactly 9 child elements for any input values |
| `addTaskFromData` | Those children are exactly 8 `input` elements followed by 1 `button` element, in that order |
| `addTaskFromData` | No inline event handler attributes on any element in the created subtree |
| `parseCSV` | Each produced task div has exactly 9 child elements for any CSV content |
| `parseCSV` | Those children are exactly 8 `input` elements followed by 1 `button` element, in that order |
| `parseCSV` | No inline event handler attributes on any element in any produced task div |

### Data Flow

Tests import `addTaskFromData` and `parseCSV` directly from `src/ui.js` as ES module exports. `happy-dom` provides a minimal DOM. Each property resets `document.body.innerHTML` before asserting, keeping runs independent.

## Security Considerations

### Attack Surface

#### Inbound Data Vectors

- **Manual task entry**: Task names typed into the UI — untrusted, passed directly to `addTaskFromData`
- **CSV file content**: Name fields in imported CSV files — untrusted, passed through `parseCSV` to `addTaskFromData` with only comma/newline splitting and quote stripping

#### Trust Boundaries

- **User input to DOM**: `addTaskFromData` is the boundary where untrusted strings are rendered — currently via an `innerHTML` template literal, which is unsafe

### Threat Model

- **XSS via task name**: `addTaskFromData` builds task rows with an `innerHTML` template literal containing `${name}`. A crafted name such as `"><img src=x onerror=alert(1)>` breaks out of the `value` attribute context and injects arbitrary HTML including executable event handlers → Property tests detect this via the structural invariants: any injected element changes the child count or introduces a non-`input`/non-`button` tag, and any injected attribute is caught by the event handler attribute check
- **XSS via CSV import**: Malicious field values in an imported CSV reach `addTaskFromData` with no sanitisation beyond quote stripping → Same injection path; the CSV property exercises the full `parseCSV` pipeline and applies the same structural and attribute invariants to every produced task div

### Security Controls

- **Replace `innerHTML` with DOM API calls**: `addTaskFromData` should use `document.createElement` and `element.setAttribute` / `element.value =` for each field — DOM API assignment treats values as text, not markup, eliminating the injection vector
- **Exact version pinning and lifecycle script blocking**: `happy-dom` pinned to an exact version; installed via `npm ci --ignore-scripts` in CI consistent with existing dependency policy

## Implementation Details

### Key Components

- **`test/ui.test.js`**: New test file; `// @vitest-environment happy-dom` at the top scopes the DOM environment to this file only
- **`src/ui.js`**: `addTaskFromData` and `parseCSV` exported with `export function`; `scripts/build.js`'s existing `stripModuleSyntax()` removes the declarations before browser injection without changes
- **`happy-dom`**: New dev dependency providing the DOM environment

### Code Location

- Tests: `test/ui.test.js`
- Source under test: `src/ui.js` — `parseCSV` (line 548), `addTaskFromData` (line 561)
- Build stripping: `scripts/build.js` — `stripModuleSyntax()`, no changes needed

### Dependencies

- **vitest**: Existing; per-file environment directive is built in
- **fast-check**: Existing
- **happy-dom**: New dev dependency

## Validation & Error Handling

- fast-check prints the minimal failing string when a property is violated, making the exact injection payload immediately visible
- A correct fix (DOM API calls) causes all properties to pass; a partial fix (escaping only some characters) will still be caught by fast-check's generative inputs

## Testing

### Test Cases

- **Element injection via name**: strings containing `<script>`, `<img>`, `<b>`, or any other tag do not change the child count or element types of the created task div
- **Attribute injection via name**: strings containing `"><img onerror=...>` or `' onfocus='...'` do not add event handler attributes to any element in the subtree
- **CSV — element injection**: after `parseCSV`, every task div has exactly 8 inputs and 1 button regardless of CSV name field content
- **CSV — attribute injection**: after `parseCSV`, no event handler attributes appear on any element in any task div

### Manual Testing Steps

1. Run `npm test` — both `simulation.test.js` and `ui.test.js` should pass
2. To confirm detection works: temporarily leave `addTaskFromData` using its current `innerHTML` template literal and verify fast-check reports a counterexample showing the injection payload

## Known Limitations

- `happy-dom` does not execute inline event handlers, so tests detect injection structurally (element presence, attribute presence) rather than by observing code execution — structural detection is sufficient to prevent injection reaching a real browser
- `runSimulationAsync` and `displayResults` are not covered; their DOM side-effects and dependency on `simulateProgram` make them better suited to integration testing

## Future Enhancements

- End-to-end test in Playwright verifying non-execution of injected payloads in a real browser after the DOM API fix
- Content Security Policy as defence-in-depth against any residual injection vectors

## Related Documentation

- [Feature: Simulation Engine Property-Based Tests](./simulation-engine-property-based-tests.md)
- [ADR-0003: Property-Based Testing](../../adr/0003-property-based-testing.md)
- [Security Policy](../../../SECURITY.md)
