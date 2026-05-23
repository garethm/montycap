# Feature: Simulation Parameters

## Overview

Six parameters in the Simulation Settings panel control how the Monte Carlo runs and what the results mean. They fall into three groups: capacity (total budget and weekly throughput), simulation fidelity (run count and programme quantity), and output calibration (confidence level and working hours per day). For the conceptual meaning of each, see [Foundation](../../foundation.md).

## User Story

As a capacity planner, I want to configure the simulation to reflect my team's actual capacity and the confidence threshold appropriate for my planning posture so that the results are directly comparable to my constraints.

## Functionality

### Parameters

| Label | ID | Default | Min | Max | Description |
|---|---|---|---|---|---|
| Available Capacity (person-hours) | `capacity` | 800 | 1 | — | Total person-hour budget; basis for the over-capacity risk percentage |
| Program Quantity | `programQuantity` | 3 | 1 | 100 | Number of parallel instances to simulate per run |
| Simulation Runs | `simulations` | 1000 | 100 | 25,000 | Number of Monte Carlo iterations |
| Confidence Level (%) | `confidence` | 80 | 50 | 99 | Percentile for highlighted results and the workload chart |
| Hours per Work Day | `hoursPerDay` | 8 | 1 | 24 | Converts person-hours to calendar days for timeline output |
| Max Weekly Capacity (hrs) | `weeklyCapacity` | 40 | 1 | — | Maximum hours available per week; scheduling throughput constraint |

For the distinction between `capacity` (budget) and `weeklyCapacity` (throughput), and the role of `programQuantity`, see [Foundation](../../foundation.md#capacity-budget-and-throughput).

### User Interface

All six parameters must appear in a Simulation Settings panel above the task grid. `programQuantity` and `simulations` must each have a hidden inline error message that becomes visible when the value exceeds its hard limit; the Run button must be disabled until the value is corrected. The remaining four parameters must enforce basic bounds via the HTML `min` attribute.

The simulation must run automatically a short delay after page load using the default values and the pre-populated tasks, so a result is visible without any user interaction.

### Data Flow

1. On Run, all six parameter values must be read and parsed
2. `programQuantity`, `hoursPerDay`, and `weeklyCapacity` must be passed into the simulation engine on every iteration — they govern how individual runs execute
3. `capacity`, `simulations`, and `confidence` must be applied in post-simulation calculations — they do not affect how runs execute, only how results are interpreted
4. `capacity` must be compared against each run's total effort to compute the over-capacity percentage; `confidence` must select the percentile values highlighted in the results panel

## Security Considerations

### Attack Surface

#### Inbound Data Vectors

- **User inputs**: Six numeric fields; values must be parsed to numbers before use

#### Outbound Data Vectors

- None — parameter values must be consumed within the simulation and must not be written to storage or included in any export

#### Trust Boundaries

- **Browser to application**: `simulations` and `programQuantity` must be validated in JavaScript before the simulation loop runs, in addition to HTML `max` attributes, since attributes can be bypassed via browser DevTools

### Threat Model

- **DoS via large parameter values**: Extreme `simulations` or `programQuantity` values could lock the browser tab → Mitigation: hard limits must be enforced in JavaScript; see [Simulation Complexity Limits](../02-simulate/simulation-complexity-limits.md)

## Configuration

Hard limits must be defined as named constants:

| Constant | Value |
|---|---|
| `MAX_SIMULATIONS` | 25,000 |
| `MAX_PROGRAM_QUANTITY` | 100 |

## Usage Examples

### Conservative planning for a small team

```text
Available Capacity:   400 person-hours
Program Quantity:     1
Simulation Runs:      1000
Confidence Level:     90%
Hours per Work Day:   6
Max Weekly Capacity:  30 hrs/week
```

Single-instance programme, 90th-percentile confidence, part-time workstream.

### Portfolio view across multiple instances

```text
Available Capacity:   2400 person-hours
Program Quantity:     10
Simulation Runs:      1000
Confidence Level:     80%
Hours per Work Day:   8
Max Weekly Capacity:  40 hrs/week
```

Ten parallel instances sharing a standard 40-hour weekly capacity.

## Validation & Error Handling

- `simulations` above 25,000: input must be styled invalid, inline error must be shown, Run must be disabled
- `programQuantity` above 100: same behaviour
- Other parameters: HTML `min` attribute only; no additional JavaScript enforcement required
- A non-numeric or empty field must not crash the application; results will be degenerate if fields are missing — all fields should contain valid numbers before running

## Known Limitations

- `capacity` and `weeklyCapacity` have no upper bound
- There is no validation that `hoursPerDay` and `weeklyCapacity` are mutually consistent
- Parameters are not persisted between page loads; defaults are restored on every reload

## Future Enhancements

- Persist parameter values in `localStorage` so they survive page reloads
- Warn when the weekly capacity implies a lower daily rate than `hoursPerDay` suggests

## Related Documentation

- [Foundation — Capacity: Budget and Throughput](../../foundation.md#capacity-budget-and-throughput)
- [Foundation — Programme Quantity](../../foundation.md#programme-quantity)
- [Foundation — Reading the Results](../../foundation.md#reading-the-results)
- [Task Management](./task-management.md)
- [Simulation Complexity Limits](../02-simulate/simulation-complexity-limits.md)
