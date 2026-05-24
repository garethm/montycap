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

All displayed values are numbers computed from simulation output. No user-supplied strings appear in this section.

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
