# Feature: Task Management

## Overview

Provides a dynamic task input grid where users define the work items to be simulated. Each task captures a name, an optional skip probability, PERT effort estimates for active work, and PERT estimates for any wait time that follows. The grid must support adding and removing tasks up to a maximum of 100, and must pre-populate with three representative example tasks on load.

## User Story

As a capacity planner, I want to define a list of tasks with three-point effort estimates so that the simulation can model the realistic range of outcomes for my programme.

## Functionality

### Core Features

- Tasks must be addable and removable dynamically
- The grid must pre-populate with three example tasks on load
- Each task must have eight input fields and a Remove button
- The Add Task button must be disabled and a limit message displayed once 100 tasks are present
- Tasks must also be populatable programmatically to support CSV import — see [CSV Import/Export](../04-exchange/csv-import-export.md)

### Task Schema

Each task row must contain nine elements: eight inputs followed by one Remove button.

| Column | Type | Constraints | Description |
|---|---|---|---|
| Task Name | text | — | Free-text label; used in results display and CSV export |
| Skip % | number | 0–95, step 5 | Probability the task is omitted in a given simulation run |
| Work Opt (hrs) | number | min 0.1, step 0.1 | Optimistic work effort in person-hours |
| Work Exp (hrs) | number | min 0.1, step 0.1 | Expected work effort in person-hours |
| Work Pess (hrs) | number | min 0.1, step 0.1 | Pessimistic work effort in person-hours |
| Wait Opt | number | min 0, step 0.1 | Optimistic wait time in days |
| Wait Exp | number | min 0, step 0.1 | Expected wait time in days |
| Wait Pess | number | min 0, step 0.1 | Pessimistic wait time in days |
| Action | button | — | Removes the task row |

Skip % must be capped at 95 — a task must not be unconditionally skippable through the UI. For the conceptual distinction between work effort and wait time, see [Foundation](../../foundation.md#tasks-work-and-wait).

### Default Tasks

The template must pre-populate with three tasks representing a typical parallel review process:

| Task | Skip % | Work O/E/P (hrs) | Wait O/E/P (days) |
|---|---|---|---|
| Supplier Security Review | 0 | 8 / 32 / 96 | 0 / 2 / 5 |
| Vulnerability Assessment | 0 | 24 / 64 / 120 | 1 / 3 / 7 |
| Supplier Follow-up | 60 | 8 / 24 / 64 | 0 / 1 / 3 |

The Supplier Follow-up task demonstrates skip probability: it is omitted in 60% of runs, reflecting that not every instance requires follow-up work.

### User Interface

Column headers (`Task Name`, `Skip %`, `Work Opt (hrs)`, etc.) must be rendered as a fixed header row above the task inputs. The Add Task button and a task limit message (`"Maximum of 100 tasks reached"`) must appear below the task list. The message must be hidden until the limit is reached; the button must be disabled at that point. Both must be re-evaluated after every add and remove operation.

### Data Flow

1. The user adds and edits tasks in the grid
2. On Run, the UI reads all task rows and extracts the eight input values from each
3. Rows where the task name or any work effort field is empty must be silently excluded — only complete rows must enter the simulation
4. The resulting task array is passed into the simulation engine on each Monte Carlo iteration

## Security Considerations

### Attack Surface

#### Inbound Data Vectors

- **Manual entry**: Task name is a free-text string entered by the user
- **Programmatic population**: Task rows can be created with pre-filled values via the CSV import path

#### Outbound Data Vectors

- **DOM rendering**: Task names must be set via DOM property assignment — they must never be injected as HTML
- **CSV export**: Task names must be passed through formula-injection sanitisation before export — see [CSV Import/Export](../04-exchange/csv-import-export.md)

#### Trust Boundaries

- **User input to DOM**: Task row construction must use DOM API calls throughout. Value assignment treats any string as text, not markup — `<script>` tags and event handler syntax must be inert

### Threat Model

- **XSS via task name**: A crafted task name containing HTML or event handler syntax enters the task grid → Mitigation: DOM API construction must be used; value assignment cannot inject elements or attributes regardless of string content
- **XSS via CSV import**: Malicious field values in an uploaded file reach the task grid via the CSV parse path → Mitigation: the same DOM API construction must apply; no string sanitisation is required because the rendering mechanism is safe by construction

### Security Controls

- All task row construction must use DOM API calls (`createElement`, `setAttribute`, `element.value =`); `innerHTML` must not be used for user-supplied values — see [ADR-0014](../../adr/0014-dom-api-over-innerhtml.md)
- The exact-structure invariant (8 inputs + 1 button per task div) must be verified by property-based security tests — see [UI Property-Based Security Tests](../90-testing/ui-property-based-security-tests.md)

## Configuration

| Constant | Value |
|---|---|
| `MAX_TASKS` | 100 |

## Usage Examples

### Adding tasks for a typical review programme

```text
Task Name: Supplier Security Review  | Skip %: 0  | Work O/E/P: 8 / 32 / 96 hrs  | Wait O/E/P: 0 / 2 / 5 days
Task Name: Vulnerability Assessment  | Skip %: 0  | Work O/E/P: 24 / 64 / 120 hrs | Wait O/E/P: 1 / 3 / 7 days
Task Name: Supplier Follow-up        | Skip %: 60 | Work O/E/P: 8 / 24 / 64 hrs   | Wait O/E/P: 0 / 1 / 3 days
```

The 60% skip probability on the follow-up task reflects that not every instance requires one.

### Representing a task with high uncertainty

```text
Task Name: Legal Review  | Skip %: 0  | Work O/E/P: 4 / 16 / 80 hrs  | Wait O/E/P: 5 / 15 / 40 days
```

A wide pessimistic range (80 hrs work, 40 days wait) reflects genuine uncertainty; the PERT distribution will cluster outcomes near the expected values but preserve the tail.

## Validation & Error Handling

- Rows with an empty task name or any missing work effort field must be excluded from the simulation run without surfacing an error — the run must proceed on the remaining valid rows
- Attempting to add a task when at the limit must have no effect
- Work effort values are not required to form a valid range; an inverted range (pessimistic < optimistic) must be accepted and passed to the simulation engine, which handles it by returning the expected value when the range is zero or negative

## Testing

### Test Cases

- A newly added task div has exactly 8 inputs followed by 1 button, for any combination of input values
- No inline event handler attributes appear on any element in the task subtree for any task name, including strings containing `<`, `>`, `"`, `'`, and XSS payload patterns
- Add Task button is disabled and limit message is visible when 100 tasks are present
- Add Task button re-enables and limit message hides after a task is removed from a full list
- Row with an empty task name: excluded from simulation, no error shown

### Manual Testing Steps

1. Load the application — confirm three pre-populated tasks are present
2. Click Add Task — confirm a new empty row appears
3. Add tasks until the 100th — confirm Add Task disables and limit message appears
4. Remove one task — confirm Add Task re-enables and message hides
5. Enter `<img src=x onerror=alert(1)>` as a task name and run — confirm no alert fires and the value is treated as plain text

## Performance Considerations

Adding and removing task rows is O(1); the task grid never grows large enough for DOM manipulation to be a concern. The 100-task limit bounds the grid size and ensures the simulation itself remains tractable — see [Simulation Complexity Limits](../02-simulate/simulation-complexity-limits.md).

## Known Limitations

- Tasks have no reorder capability; they execute in the order they appear in the grid
- An inverted effort range (pessimistic < optimistic) is accepted without warning

## Future Enhancements

- Allow tasks to be reordered by drag-and-drop
- Warn when a task has an inverted effort range (pessimistic less than optimistic)
- Support named task templates that can be inserted into the grid from a preset library

## Related Documentation

- [Foundation — Tasks: Work and Wait](../../foundation.md#tasks-work-and-wait)
- [Foundation — Three-Point Estimation](../../foundation.md#three-point-estimation)
- [Simulation Parameters](./simulation-parameters.md)
- [CSV Import/Export](../04-exchange/csv-import-export.md)
- [UI Property-Based Security Tests](../90-testing/ui-property-based-security-tests.md)
- [ADR-0014: DOM API over innerHTML](../../adr/0014-dom-api-over-innerhtml.md)
