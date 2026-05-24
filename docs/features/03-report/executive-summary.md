# Feature: Executive Summary

## Overview

The Executive Summary appears at the bottom of the report. It reframes the simulation output as three named planning scenarios and two resource figures, making the results easier to communicate to stakeholders who may not be familiar with percentile statistics. It draws on data already present in the report sections above; it does not introduce new computations.

## User Story

As a capacity planner, I want the key findings presented as named scenarios rather than raw percentiles so that I can share the results with stakeholders who are not familiar with Monte Carlo output.

## Functionality

### Structure

The Executive Summary contains two cards displayed side by side.

```
┌─────────────────────────────┬─────────────────────────────┐
│  Planning Scenarios         │  Resource Requirements      │
│                             │                             │
│  Most Likely Outcome        │  Expected Weekly Capacity   │
│  Conservative Planning      │  Peak Weekly Demand         │
│  Contingency Planning       │  Capacity Risk Level        │
└─────────────────────────────┴─────────────────────────────┘
```

### Planning Scenarios Card

Three scenarios are shown, each pairing an effort value (person-hours) with a timeline value (business days):

| Scenario name | Effort value | Timeline value |
|---|---|---|
| Most Likely Outcome | P50 effort | P50 timeline |
| Conservative Planning | *N*% confidence effort | *N*% confidence timeline |
| Contingency Planning | P90 effort | P90 timeline |

The scenario names are fixed strings. They are intended to map to recognisable planning postures: P50 for the most neutral estimate, the confidence-level percentile for the committed plan, and P90 for a reserve or contingency allowance.

The confidence-level values in the Conservative Planning row reflect whatever confidence level is set in Simulation Settings. Choosing a higher confidence level (e.g. 90%) produces a more cautious conservative plan than a lower one (e.g. 70%).

### Resource Requirements Card

Three figures are shown:

| Label | Value | Source |
|---|---|---|
| Expected Weekly Capacity | Average hours per week across the programme | Derived from the workload chart data |
| Peak Weekly Demand | Highest hours required in any single week | Derived from the workload chart data |
| Capacity Risk Level | High, Moderate, or Low | Same classification as the [Capacity Assessment](./capacity-assessment.md) message |

The Capacity Risk Level is colour-coded to match its severity, giving a compact visual status for use in stakeholder documents or screenshots.

### Relationship to Other Report Sections

The Executive Summary does not introduce new values. Every figure it presents is derived from data already shown in the report:

- The three scenario effort values come from the [Effort Analysis](./effort-analysis.md) grid
- The three scenario timeline values come from the [Timeline Analysis](./timeline-analysis.md) grid
- The resource figures come from the [Workload Chart](./workload-chart.md)
- The risk level comes from the [Capacity Assessment](./capacity-assessment.md)

Its purpose is synthesis and presentation, not additional analysis.

## Known Limitations

- The scenario names are fixed. "Conservative Planning" is used for the confidence-level percentile regardless of what that percentile is; at an unusually low confidence level (e.g. 60%) the label is misleading.
- The two-card layout assumes the user always wants both planning scenarios and resource requirements. There is no way to show one without the other.
- The resource figures (expected weekly capacity, peak demand) are derived from the confidence-band workload data; they reflect the chosen planning scenario, not the average across all runs.

## Future Enhancements

- Allow the scenario names to be customised to match an organisation's terminology.
- Add a copy-to-clipboard or export option for the executive summary card content.
- Reflect the chosen confidence level in the Conservative Planning label (e.g. "80% Confidence Plan").

## Related Documentation

- [Foundation — Reading the Results](../../foundation.md#reading-the-results)
- [Report Structure](./report-structure.md)
- [Effort Analysis](./effort-analysis.md)
- [Timeline Analysis](./timeline-analysis.md)
- [Capacity Assessment](./capacity-assessment.md)
- [Workload Chart](./workload-chart.md)
- [Simulation Parameters](../01-configure/simulation-parameters.md) — the `confidence` parameter determines which percentile the Conservative Planning row uses
