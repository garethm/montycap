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

## Security Considerations

### Attack Surface

#### Inbound Data Vectors

- **Simulation output**: All values in the Executive Summary are numbers derived from effort results, timeline results, and workload data. No user-supplied strings are rendered.

#### Outbound Data Vectors

- **DOM rendering**: Scenario values and resource figures are written as text. Scenario names and card headings are pre-defined string literals.

#### Trust Boundaries

- **Simulation to display**: By the time values reach this feature, all user inputs have been consumed and reduced to numeric results. Scenario names are fixed; there is no path for user-controlled text to appear in this section.

### Threat Model

- **XSS via numeric values**: All values are numbers converted to fixed-decimal strings. A number-to-string conversion cannot produce executable markup. Risk: negligible.

### Security Controls

- All DOM construction must use text-safe APIs; numeric values and pre-defined labels must not be injected as HTML — see [ADR: DOM XSS Prevention](../../adr/security/dom-xss-prevention.md).

## Configuration

This feature introduces no configuration constants. The scenario names (Most Likely Outcome, Conservative Planning, Contingency Planning) are fixed labels.

## Usage Examples

### Using the Planning Scenarios card for stakeholder communication

```text
Most Likely Outcome:    410 hrs over 35 days
Conservative Planning:  580 hrs over 52 days   ← commit to this
Contingency Planning:   670 hrs over 68 days   ← hold as reserve
```

The Conservative Planning row is the one to present as the plan. The Contingency row is the budget ceiling — the number to quote when asked "what's the worst case?". The Most Likely row anchors the discussion: if the team consistently beats this, capacity should be reassessed.

### Using the Resource Requirements card

```text
Expected Weekly Capacity:  22 hrs/week
Peak Weekly Demand:        38 hrs/week
Capacity Risk Level:       Moderate
```

The gap between expected (22 hrs/week) and peak (38 hrs/week) indicates uneven weekly demand. The Moderate risk level signals that the programme is within budget in most scenarios but warrants a contingency plan.

## Validation & Error Handling

This feature displays computed values and performs no validation. All scenario values are derived from effort and timeline distributions computed during the simulation run. Resource figures depend on workload data from the confidence-band simulations; if that subset is empty the resource figures may be zero or absent, but the planning scenarios card must still render.

## Testing

> **Incomplete**: Test cases for this section require specific task configurations that produce known percentile values. These need to be defined in a follow-up task.

### Test Cases

- Both cards are present after a simulation run
- Planning Scenarios shows three rows with correct scenario names
- The Conservative Planning row uses the confidence-level percentile values, not P50 or P90
- Resource Requirements shows Expected Weekly Capacity, Peak Weekly Demand, and Capacity Risk Level
- Capacity Risk Level colouring matches the classification shown in the [Capacity Assessment](./capacity-assessment.md) message

### Manual Testing Steps

> **Incomplete**: Specific input configurations to drive known planning scenario values need to be defined.

## Performance Considerations

This feature renders a fixed set of DOM nodes regardless of simulation run count. Performance is not a concern.

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
