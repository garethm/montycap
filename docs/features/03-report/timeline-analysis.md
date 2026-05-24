# Feature: Timeline Analysis

## Overview

The Timeline Analysis section presents a grid of four metrics derived from the simulation's calendar-duration distribution. It answers the scheduling question: when will this programme realistically complete?

## User Story

As a capacity planner, I want to see the spread of calendar durations across all simulation runs so that I can commit to a realistic completion date with confidence.

## Functionality

### Metrics Grid

Four metrics are displayed in a grid. All values are in business days.

| Metric | What it shows |
|---|---|
| Mean Timeline | The average calendar duration across all simulation runs. |
| Median (P50) | The midpoint of the timeline distribution — half of all runs completed within this many days. The most neutral planning figure. |
| *N*% Confidence | The duration that *N*% of runs completed within. This is the figure a planner should commit to when they want the programme to finish on time in *N*% of plausible outcomes. The label updates to reflect the current confidence setting. |
| P90 (Worst Case) | The duration that 90% of runs fell below. A conservative upper bound for scheduling contingency. |

### Relationship to Effort

Timeline and effort are related but distinct. A programme can take longer on the calendar than effort alone would suggest because:

- Parallel instances contend for shared weekly capacity, creating queuing delays
- Wait time — external dependencies such as supplier responses or stakeholder reviews — adds calendar time without consuming team capacity

A programme with modest total effort can still have a long calendar duration if weekly capacity is constrained or wait times are high. Both dimensions should be reviewed together. See [Foundation — Tasks: Work and Wait](../../foundation.md#tasks-work-and-wait) and [Foundation — Capacity: Budget and Throughput](../../foundation.md#capacity-budget-and-throughput).

### Executive Summary

The three timeline values most useful for stakeholder communication are paired with their corresponding effort values in the Executive Summary's Planning Scenarios card:

| Scenario | Timeline value used |
|---|---|
| Most Likely Outcome | P50 |
| Conservative Planning | *N*% Confidence |
| Contingency Planning | P90 |

See [Effort Analysis](./effort-analysis.md) for the effort values that appear alongside these.

### Data Flow

Timeline values are derived from the sorted array of total calendar duration outputs across all simulation runs. Percentiles are read by position in that sorted array. Calendar duration is measured in business days, converted from person-hours using the Hours per Work Day parameter.

## Security Considerations

### Attack Surface

#### Inbound Data Vectors

- **Simulation output**: All four metric values are numbers derived from the sorted timeline results array. No user-supplied strings reach this section.

#### Outbound Data Vectors

- **DOM rendering**: Metric values are written to the results panel as text. They are numeric strings produced by the application, not user input.

#### Trust Boundaries

- **Simulation to display**: By the time values reach this feature, all user inputs have been consumed and reduced to numeric arrays by the simulation engine. This feature handles only those computed numbers.

### Threat Model

- **XSS via numeric values**: All values are numbers converted to fixed-decimal strings; a number-to-string conversion cannot produce executable markup. Risk: negligible.

### Security Controls

- All DOM construction must use text-safe APIs; numeric values must not be injected as HTML — see [ADR: DOM XSS Prevention](../../adr/security/dom-xss-prevention.md).

## Configuration

This feature introduces no configuration constants. Metric labels are fixed strings.

## Usage Examples

### Reading a timeline grid after a run

```text
Mean Timeline:      38 days
Median (P50):       35 days
80% Confidence:     52 days
P90 (Worst Case):   68 days
```

This result suggests committing to 52 business days for an 80% confidence plan, with 68 days held as a contingency ceiling. The gap between P50 (35 days) and P90 (68 days) is nearly double, indicating that tail outcomes significantly stretch the calendar — worth investigating whether wait-time variance or weekly capacity constraints are the primary driver.

## Validation & Error Handling

This feature displays computed values only and performs no validation. If the simulation produces no results — for example because all task rows were empty — the results panel is not shown and this section does not render.

## Testing

### Test Cases

- Four metric tiles appear in the timeline grid after a run
- The confidence metric label reflects the active confidence setting
- Timeline values are in business days and are consistent with the Hours per Work Day parameter — halving the parameter must roughly double the day counts
- All four values are non-negative

### Manual Testing Steps

1. Run with default settings — confirm four metrics appear with labelled values
2. Change confidence to 70% and re-run — confirm the metric label reads "70% Confidence" and the value is lower than the previous confidence-level result
3. Change Hours per Work Day from 8 to 4 and re-run — confirm day values approximately double

## Performance Considerations

This feature renders a fixed set of four metric tiles regardless of simulation run count. Performance is not a concern.

## Known Limitations

- P10 is not displayed; the current design shows only P50, the confidence percentile, and P90.
- Calendar duration is expressed in business days but does not account for specific calendars, holidays, or non-working periods.
- The timeline distribution reflects scheduling under the weekly capacity constraint but does not model dependencies between instances — instances are assumed to be independent.

## Future Enhancements

- Add P10 to the grid to show the optimistic tail.
- Allow the confidence level to be adjusted after the simulation has run.
- Offer an option to display duration in calendar weeks rather than business days.

## Related Documentation

- [Foundation — Reading the Results](../../foundation.md#reading-the-results)
- [Foundation — Tasks: Work and Wait](../../foundation.md#tasks-work-and-wait)
- [Foundation — Capacity: Budget and Throughput](../../foundation.md#capacity-budget-and-throughput)
- [Report Structure](./report-structure.md)
- [Effort Analysis](./effort-analysis.md)
- [Simulation Parameters](../01-configure/simulation-parameters.md) — the `confidence` and `hoursPerDay` parameters directly shape what this section displays
