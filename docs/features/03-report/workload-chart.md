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
