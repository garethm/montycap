# Feature: Simulation Complexity Limits

## Overview

Imposes per-input hard limits and a combined complexity budget on the three variables that determine simulation runtime (`simulations × programQuantity × tasks`), preventing accidental browser lock-up without silently misrepresenting the parameters the user configured.

## User Story

As a capacity planner, I want the tool to warn me before I kick off an unreasonably expensive simulation run so that I don't accidentally freeze my browser, while still being able to proceed if I know what I'm doing.

## Functionality

### Core Features

- Hard upper limit on each of the three runtime-scaling inputs: simulations (25,000), program quantity (100), tasks (100)
- A combined complexity budget of 5,000,000 operations (`simulations × programQuantity × tasks`) that triggers an inline warning before the run starts
- The user can dismiss the warning and proceed; the budget is advisory, not a hard block
- Values that exceed a hard limit are rejected (input turns invalid, Run is blocked) rather than silently clamped — the user must trust that results reflect the parameters they set

### User Interface

**Hard limits — input-level rejection:**
- Inputs for simulations and program quantity enforce their maximum values via `max` attributes in HTML and validation checks in JavaScript
- When a value exceeds the limit the input is styled as invalid (red border) and the Run button is disabled until corrected
- The Run button is visually styled as inactive (greyed out, not-allowed cursor) when disabled, so it is clearly distinguishable from an active button
- The Run button's tooltip describes which validation is currently failing (e.g. "Simulation runs exceed the maximum of 25,000"), surfacing the reason without requiring the user to find the error message in the form
- An inline error message also appears adjacent to the offending input explaining the limit

**Task count limit:**
- The Add Task button is disabled once 100 tasks are present
- A message near the button reads "Maximum of 100 tasks reached"

**Complexity budget — inline warning:**
- If the product of all three variables exceeds 5,000,000 at the moment Run is clicked, an inline warning banner appears above the results area (not a blocking alert)
- The banner states the estimated operation count, e.g.: "This configuration (~8M operations) may take a long time. Reduce simulations, program quantity, or tasks — or click Run to proceed."
- The Run button remains active; clicking it again (or a "Run anyway" action in the banner) proceeds
- The progress bar already visible during runs provides feedback that work is in progress

### Data Flow

1. On every input change, a validation function checks each field against its hard limit and recomputes the complexity product
2. If any hard limit is breached, the Run button is disabled and error indicators are shown
3. On Run click, if no hard limits are breached but the budget is exceeded, the warning banner is rendered and the simulation is paused pending user confirmation
4. On confirmation (or if the budget is within range), `runSimulationAsync()` proceeds as normal

## Security Considerations

### Attack Surface

#### Inbound Data Vectors
- **User inputs**: Numeric form fields for simulations, program quantity, and task count — all client-side, no server involved

#### Outbound Data Vectors
- None introduced by this feature

#### Trust Boundaries
- **Browser to application**: Numeric inputs are the only trust boundary. HTML `max` attributes are not sufficient alone — JavaScript validation is required as a second check since attributes can be bypassed via DevTools

### Threat Model

- **DoS via resource exhaustion**: A user (or a page loaded with crafted query parameters in a future feature) submits extreme values → Mitigation: hard limits enforced in JavaScript regardless of HTML attribute state
- **Silent result distortion**: Clamping a value without telling the user would produce results that don't match stated parameters → Mitigation: rejection model ensures the value the user sees is the value used

### Security Controls

- All numeric inputs validated in JavaScript before the simulation loop is entered
- No data leaves the browser; no new network surface introduced

## Implementation Details

### Key Components

- **`src/template.html`**: Add `max` attributes to the simulations and programQuantity inputs; disable Add Task button at limit
- **`src/ui.js` — `addTask()`**: Check task count before inserting; show limit message and disable button when at 100
- **`src/ui.js` — input validation**: Live validation on change events for simulations and programQuantity; set invalid state and disable Run button on breach
- **`src/ui.js` — `runSimulationAsync()`**: Compute complexity product before the simulation loop; render warning banner and await confirmation if budget exceeded

### Code Location

- Simulations input: `src/template.html` line 274
- Program quantity input: `src/template.html` line 270
- `addTask()`: `src/ui.js` line 8
- `runSimulationAsync()`: `src/ui.js` line 60

### Dependencies

- No new external dependencies

## Configuration

| Parameter | Hard Limit | Default | Rationale |
|-----------|-----------|---------|-----------|
| Simulations | 25,000 | 1,000 | Allows high-fidelity runs while bounding worst-case cost |
| Program quantity | 100 | 3 | Permits large parallel program portfolios |
| Tasks | 100 | 3 (initial rows) | Generous ceiling; beyond this the UI becomes unwieldy |
| Complexity budget | 5,000,000 ops | — | Advisory warning threshold; ~300k ops takes ~12s at observed throughput, so 5M is a meaningful signal |

## Validation & Error Handling

- Each numeric input is validated on `input` and `change` events
- A value below `min` or above `max` renders the input invalid and disables Run
- When disabled, the Run button is visually greyed out (not merely unclickable) and its tooltip names the failing validation
- Error messages appear inline adjacent to the relevant input, not in alert dialogs
- The complexity budget warning is an inline banner, not a blocking dialog — the user can proceed
- Rejection (not clamping) is the model for hard limits: the run does not start until the user corrects the value
- CSV imports with more than 100 valid task rows are rejected entirely with an error message; the existing task list is left unchanged so the user does not lose their current work

## Testing

### Test Cases

- simulations set to 25,001: Run button disabled, error shown
- programQuantity set to 101: Run button disabled, error shown
- 101st task added via UI: Add Task button disabled, limit message shown
- CSV imported with > 100 valid task rows: import rejected with an error message, existing tasks unchanged
- CSV imported with ≤ 100 tasks: loads normally, no warning
- All inputs at their maximums (25,000 × 100 × 100 = 250M ops): budget warning shown, Run still available
- simulations = 1,000, programQuantity = 5, tasks = 3 (15,000 ops): no warning, runs normally
- HTML `max` attribute removed via DevTools, value set above limit: JavaScript validation still blocks run
- Complexity warning shown and Run clicked: simulation proceeds with original parameters unchanged

### Manual Testing Steps

1. Set simulations to 25,001 — confirm Run is disabled and error is visible
2. Correct to 25,000 — confirm Run re-enables and error clears
3. Set programQuantity to 101 — confirm Run is disabled and error is visible
4. Correct to 100 — confirm Run re-enables and error clears
5. Add tasks until the 100th — confirm Add Task disables and message appears
6. Import a CSV with more than 100 valid task rows — confirm the import is rejected with an error message and the existing task list is unchanged
7. Set simulations = 25,000, programQuantity = 10, tasks = 20 (5M ops) — click Run, confirm budget warning appears without blocking
8. Click "Run anyway" — confirm simulation starts and progress bar appears
9. Via browser DevTools, remove the `max` attribute from the simulations input, enter 100,000, click Run — confirm JavaScript validation catches it

## Performance Considerations

- Validation runs on input events and is O(1) — negligible cost
- The complexity product is a single multiplication; no simulation work happens until confirmed
- The feature reduces worst-case runtime by orders of magnitude; no new performance cost introduced

## Known Limitations

- The complexity budget is a rough heuristic based on observed throughput with a small number of simple tasks; actual runtime varies with task configuration and device capability
- There is no adaptive throttling or Web Worker offloading — simulation still runs on the main thread

## Future Enhancements

- Move simulation loop to a Web Worker to keep the UI fully responsive during long runs
- Adaptive budget estimate based on a short benchmark run on the user's device
