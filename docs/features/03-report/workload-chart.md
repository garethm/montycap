# Feature: Workload Chart

## Overview

The Weekly Workload chart shows the average hour-by-hour demand on the team across each week of the programme, for the subset of simulation runs near the chosen confidence level. Unlike the distribution charts — which show how total effort and duration vary across all runs — the workload chart shows the *shape* of demand over time within a representative set of outcomes: when the team will be busiest, and which weeks are likely to exceed the weekly capacity limit.

## User Story

As a capacity planner, I want to see how weekly demand is distributed across the programme's duration so that I can identify pressure points and judge whether the weekly capacity constraint is likely to be breached, and when.

## Functionality

### What the Chart Shows

Each bar represents one week of the programme. Bar height is the average hours required in that week, taken across the confidence-band simulations. A horizontal reference line marks the weekly capacity limit entered in Simulation Settings.

Bars are colour-coded by whether they exceed the weekly limit:
- Bars within the weekly capacity limit are shown in amber
- Bars that exceed it are shown in red

### Confidence-Band Scope

The chart is drawn from the subset of simulation runs whose total timeline falls near the chosen confidence-level percentile, rather than averaging across all runs. This reflects a deliberate design choice: averaging across all runs would blend short programmes with long ones, obscuring the week-by-week shape of any individual outcome. The confidence-band subset gives a realistic picture of what demand looks like in the planning scenario the user has committed to.

The chart heading states the confidence level and the number of simulations that contributed to it.

### Resource Requirements Summary

The average weekly hours and peak weekly hours derived from this chart are also displayed in the Executive Summary's Resource Requirements card, providing a compact version of the same information for stakeholder communication.

### What to Look For

A chart where most bars are well below the reference line and no bars are red indicates the programme is unlikely to breach weekly capacity in the chosen planning scenario. A chart with several red bars — particularly consecutive ones — signals a sustained period of overload that may require rescheduling, additional resource, or scope reduction.

The position of the peaks within the programme also matters: front-loaded demand means pressure early; back-loaded demand suggests the programme accelerates in later weeks.

## Security Considerations

### Attack Surface

#### Inbound Data Vectors

- **Simulation output**: The chart receives an array of weekly hour values and a weekly capacity limit — all numeric. No user-supplied strings are passed to the chart renderer.

#### Outbound Data Vectors

- **Canvas rendering**: Chart.js renders to an HTML `<canvas>` element. Canvas output is a rasterised image; it cannot contain executable content.

#### Trust Boundaries

- **Simulation to chart renderer**: Only numeric data reaches Chart.js. Week labels ("Week 1", "Week 2", …) are generated programmatically from array indices; they are not user-supplied.

### Threat Model

- **Injection via chart data**: The chart receives only numeric values and programmatically generated labels. There is no path from user-supplied strings to chart rendering in this feature. Risk: negligible.

### Security Controls

- Chart data must consist only of numeric values and programmatically generated labels; no user-supplied strings must be passed to the chart renderer.

## Configuration

This feature introduces no configuration constants beyond those defined in [Simulation Parameters](../01-configure/simulation-parameters.md). The weekly capacity reference line reflects the Max Weekly Capacity parameter at the time of the run.

## Usage Examples

### Reading the workload chart

A chart where all bars are amber and none exceed the reference line indicates the programme is unlikely to breach weekly capacity in the chosen planning scenario. Consecutive red bars indicate a sustained overload period — a signal to consider rescheduling, adding capacity for those weeks, or reducing scope.

A front-loaded chart (tall bars early, lower bars later) suggests the programme starts under pressure and eases off. A back-loaded chart suggests pressure builds toward the end of the programme.

## Validation & Error Handling

This feature renders a chart from pre-computed workload data and performs no validation. If the confidence-band subset contains no simulations — which can occur when the confidence level is set very high and few runs fall within the band — the chart is skipped silently and the heading still appears. Prior chart instances must be destroyed before new ones are created to prevent resource accumulation across runs.

## Testing

> **Incomplete**: Test cases for this section require specific task configurations and parameter values that reliably produce over-capacity weeks. These need to be defined in a follow-up task.

### Test Cases

- Chart renders after a simulation run with at least one task
- Bars exceeding the weekly capacity reference line are shown in red; bars within the limit are shown in amber
- The reference line appears at the weekly capacity value from Simulation Settings
- The chart heading shows the confidence level and the number of contributing simulations
- Re-running the simulation replaces the chart; no stale chart from a previous run remains

### Manual Testing Steps

> **Incomplete**: Specific input configurations to produce over-capacity weeks in the chart need to be defined.

## Performance Considerations

The number of bars in the chart is bounded by the maximum programme duration across the confidence-band simulations. In practice this is at most a few hundred weeks for any realistic programme, which is well within Chart.js canvas rendering capabilities. Prior chart instances must be destroyed before creating new ones to avoid memory accumulation across runs.

## Known Limitations

- The chart covers weeks from the start of the programme to the maximum week across the confidence-band simulations. If individual runs in the band have very different durations, later weeks may average across a diminishing subset of active runs, making those bars less representative.
- The weekly capacity reference line reflects the parameter value at the time of the run; if the value has been changed since, it will not match.
- The chart shows average demand per week, not the full distribution of weekly demand. A week that averages at capacity may still exceed it in some of the contributing simulations.

## Future Enhancements

- Show a range band (e.g. P25–P75) around each weekly bar to convey the variability within the confidence-band simulations.
- Allow the user to switch between the full-run average and the confidence-band view.
- Add a second reference line at a lower "comfortable" capacity level to distinguish weeks that are merely busy from those that are genuinely at risk.

## Related Documentation

- [Foundation — Capacity: Budget and Throughput](../../foundation.md#capacity-budget-and-throughput)
- [Foundation — Reading the Results](../../foundation.md#reading-the-results)
- [Report Structure](./report-structure.md)
- [Effort Analysis](./effort-analysis.md)
- [Capacity Assessment](./capacity-assessment.md)
- [Distribution Charts](./distribution-charts.md)
- [Simulation Parameters](../01-configure/simulation-parameters.md) — the `confidence` and `weeklyCapacity` parameters directly shape what this chart displays
