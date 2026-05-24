# Feature: Effort Analysis

## Overview

The Effort Analysis section presents a grid of six metrics derived from the simulation's effort distribution. It answers the two core capacity planning questions: how much work does this programme require, and does that fit within the available budget?

## User Story

As a capacity planner, I want to see the spread of effort outcomes across all simulation runs so that I can understand the realistic range of person-hours required and know whether my capacity budget is adequate.

## Functionality

### Metrics Grid

Six metrics are displayed in a grid. All values are in person-hours.

| Metric | What it shows |
|---|---|
| Mean Effort | The average total effort across all simulation runs. Useful as a rough centre-of-mass but sensitive to extreme outcomes. |
| Median (P50) | The midpoint of the effort distribution — half of all runs fell below this value. The most neutral planning figure. |
| *N*% Confidence | The effort value at the user's chosen confidence level. This is the figure a planner should commit to if they want the programme to stay within budget in *N*% of plausible outcomes. The label updates to reflect the current confidence setting. |
| P90 (Worst Case) | The effort value that 90% of runs fell below. A conservative upper bound for contingency planning. |
| Available Capacity | The person-hour budget entered in Simulation Settings. Shown here to give the over-capacity figure immediate context without requiring the user to look elsewhere. |
| Over Capacity Risk | The percentage of simulation runs in which total effort exceeded the available capacity budget. This is the headline risk figure for the programme. |

### Capacity Risk Interpretation

The Over Capacity Risk percentage is the primary signal for whether the programme is resourced adequately:

| Risk percentage | Interpretation |
|---|---|
| ≤ 5% | Comfortable buffer — the capacity budget covers the programme in the large majority of outcomes |
| 6–20% | Moderate risk — the budget may be insufficient; contingency plans are advisable |
| > 20% | High risk — the budget is likely to be exceeded; scope reduction or capacity increase should be considered |

These same thresholds drive the [Capacity Assessment](./capacity-assessment.md) message that appears immediately below the grid.

### Executive Summary

The three effort values most useful for stakeholder communication are also presented in the Executive Summary's Planning Scenarios card, paired with their corresponding timeline values:

| Scenario | Effort value used |
|---|---|
| Most Likely Outcome | P50 |
| Conservative Planning | *N*% Confidence |
| Contingency Planning | P90 |

See [Timeline Analysis](./timeline-analysis.md) for the timeline values that appear alongside these.

### Data Flow

Effort values are derived from the sorted array of total effort outputs across all simulation runs. Percentiles are read by position in that sorted array. The over-capacity risk is computed as the proportion of runs whose total effort exceeded the available capacity value.

## Security Considerations

### Attack Surface

#### Inbound Data Vectors

- **Simulation output**: All six metric values are numbers derived from the sorted effort results array and the capacity parameter. No user-supplied strings reach this section.

#### Outbound Data Vectors

- **DOM rendering**: Metric values are written to the results panel as text. They are numeric strings produced by the application, not user input.

#### Trust Boundaries

- **Simulation to display**: By the time values reach this feature, all user inputs have been consumed and reduced to numeric arrays by the simulation engine. This feature handles only those computed numbers.

### Threat Model

- **XSS via numeric values**: All values are numbers converted to fixed-decimal strings; a number-to-string conversion cannot produce executable markup. Risk: negligible.

### Security Controls

- All DOM construction must use text-safe APIs; numeric values must not be injected as HTML — see [ADR: DOM XSS Prevention](../../adr/security/dom-xss-prevention.md).

## Configuration

This feature introduces no configuration constants. Metric labels are fixed strings. The risk thresholds that classify Over Capacity Risk are defined in the [Capacity Assessment](./capacity-assessment.md) feature.

## Usage Examples

### Reading an effort grid after a run

```text
Mean Effort:          430 hrs
Median (P50):         410 hrs
80% Confidence:       580 hrs
P90 (Worst Case):     670 hrs
Available Capacity:   500 hrs
Over Capacity Risk:   34%
```

This result indicates high risk: 34% of runs exceeded the 500-hour budget. The gap between P50 (410 hrs) and P90 (670 hrs) is wide, suggesting a skewed distribution with a meaningful tail. A planner using 80% confidence should plan for 580 hours — 80 hours over the current budget.

## Validation & Error Handling

This feature displays computed values only and performs no validation. If the simulation produces no results — for example because all task rows were empty — the results panel is not shown and this section does not render.

## Testing

### Test Cases

- Six metric tiles appear in the effort grid after a run
- The confidence metric label reflects the active confidence setting (e.g. "80% Confidence" when confidence is set to 80%)
- Over Capacity Risk is 0% when available capacity exceeds all effort values in the simulation
- Over Capacity Risk is 100% when available capacity is less than all effort values
- The Available Capacity metric matches the value entered in Simulation Settings

### Manual Testing Steps

1. Run with default settings — confirm six metrics appear with labelled values
2. Change confidence to 90% and re-run — confirm the metric label reads "90% Confidence"
3. Set available capacity to 1 and re-run — confirm Over Capacity Risk is close to 100%
4. Set available capacity to a very large number and re-run — confirm Over Capacity Risk is 0%

## Performance Considerations

This feature renders a fixed set of six metric tiles regardless of simulation run count. Performance is not a concern.

## Known Limitations

- P10 is not displayed. It is available from the simulation data but the current design shows only P50, the confidence percentile, and P90.
- Mean and median can diverge significantly on skewed distributions; the grid shows both but does not annotate the difference.
- The confidence-percentile label reads "*N*% Confidence" regardless of what *N* is — there is no guidance indicating whether a given confidence level is appropriate for the user's planning posture.

## Future Enhancements

- Add P10 to the grid to show the optimistic tail alongside the pessimistic one.
- Allow the confidence level to be adjusted after the simulation has run, since all percentile data is already available without re-running.
- Annotate the mean/median comparison when they differ by more than a threshold, flagging a skewed distribution.

## Related Documentation

- [Foundation — Reading the Results](../../foundation.md#reading-the-results)
- [Foundation — Capacity: Budget and Throughput](../../foundation.md#capacity-budget-and-throughput)
- [Report Structure](./report-structure.md)
- [Capacity Assessment](./capacity-assessment.md)
- [Timeline Analysis](./timeline-analysis.md)
- [Simulation Parameters](../01-configure/simulation-parameters.md) — the `confidence` and `capacity` parameters directly shape what this section displays
