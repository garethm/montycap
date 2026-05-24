# Feature: Report Structure

## Overview

After a simulation run completes, a results report appears below the task grid. The report is divided into named sections in a fixed order, presenting the simulation output from the most specific (raw percentile metrics) to the most synthesised (executive summary planning scenarios). Every run replaces the entire report with freshly computed output.

## User Story

As a capacity planner, I want the simulation output to appear in a consistently structured report so that I can navigate to the same sections in the same order regardless of which parameters I changed between runs.

## Functionality

### Report Visibility

The report area is not visible when the page loads. It becomes visible the first time a simulation run completes. Subsequent runs replace the report content in full — there is no partial update and no values from a prior run persist into the current display.

Because the simulation runs automatically on page load using the default parameters and pre-populated tasks, a result is present without any user interaction.

### Section Structure

The report contains seven sections in a fixed top-to-bottom order:

```
┌─────────────────────────────────────────┐
│  Simulation Results                     │
│                                         │
│  Effort Analysis (person-hours)         │
│  ┌───────────────────────────────────┐  │
│  │  metrics grid (6 values)          │  │
│  └───────────────────────────────────┘  │
│  [capacity assessment message]          │
│                                         │
│  Timeline Analysis (days)               │
│  ┌───────────────────────────────────┐  │
│  │  metrics grid (4 values)          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [effort distribution chart]            │
│  [timeline distribution chart]          │
│                                         │
│  Weekly Workload                        │
│  [workload bar chart]                   │
│                                         │
│  ┌─────────────────┬─────────────────┐  │
│  │  Planning       │  Resource       │  │
│  │  Scenarios      │  Requirements   │  │
│  └─────────────────┴─────────────────┘  │
└─────────────────────────────────────────┘
```

| Section | Purpose |
|---|---|
| Effort Analysis | Person-hour percentiles and over-capacity risk — see [Effort Analysis](./effort-analysis.md) |
| Capacity Assessment | Plain-language risk message below the effort grid — see [Capacity Assessment](./capacity-assessment.md) |
| Timeline Analysis | Calendar-day percentiles — see [Timeline Analysis](./timeline-analysis.md) |
| Distribution charts | Histograms of effort and timeline outcomes — see [Distribution Charts](./distribution-charts.md) |
| Weekly Workload chart | Week-by-week capacity demand — see [Workload Chart](./workload-chart.md) |
| Executive Summary | Named planning scenarios and resource figures — see [Executive Summary](./executive-summary.md) |

### Section Headings

Each section carries a fixed heading. The workload chart heading incorporates the active confidence level and the number of simulations that contributed to it; all other headings are static.

### Replacement Behaviour

Every run replaces the entire report in a single operation. The UI must not leave partially-updated content visible to the user if a run completes while a previous run's output is still displayed.

## Security Considerations

### Attack Surface

The report area renders only values derived from simulation computation. No user-supplied strings (such as task names) appear anywhere in the report structure.

### Threat Model

- **Stale content across runs**: Updating only part of the report on a new run could leave prior values visible alongside new ones. Mitigation: the full report is replaced atomically on each run.

## Configuration

This feature introduces no configuration constants. The section order, heading text, and replacement behaviour are fixed and cannot be changed through parameters or settings.

## Usage Examples

### Navigating the report after a run

After clicking Run (or after the automatic run on page load), scroll past the task grid to reach the results. The sections appear top-to-bottom in the order shown in the layout diagram: Effort Analysis first, Executive Summary last. Each re-run replaces all sections simultaneously, so there is no need to scroll back to the top to check for stale values.

## Validation & Error Handling

This feature performs no validation. All validation of simulation inputs takes place before results are passed to the display layer — see [Simulation Parameters](../01-configure/simulation-parameters.md) and [Simulation Complexity Limits](../02-simulate/simulation-complexity-limits.md). If the simulation produces no results (for example, because all task rows were empty), the results panel must not be shown.

## Testing

### Test Cases

- Results panel is not visible on page load before the automatic run completes
- Results panel becomes visible after the first simulation run
- All seven sections appear in the documented order after a run
- Running the simulation a second time replaces all section content; no values from the previous run remain visible
- If all task rows are empty, the results panel must not be shown

### Manual Testing Steps

1. Load the page — confirm the results area below the task grid is not visible before the automatic run completes
2. After the run completes, scroll down — confirm all seven sections are present in order: Effort Analysis, capacity assessment message, Timeline Analysis, effort chart, timeline chart, workload chart, Executive Summary
3. Change a simulation parameter and click Run — confirm all section values update and no old values are visible alongside new ones

## Performance Considerations

The results panel is rebuilt in full on each run. The number of DOM nodes created is fixed regardless of simulation run count — the panel always contains the same sections with the same structure. Rebuild time is imperceptible at the scale of outputs this application handles.

## Known Limitations

- The section order is fixed; there is no user control over which sections appear or in what order.
- The report has no print-specific layout; printed output reflects the screen presentation.

## Future Enhancements

- A print or export view that renders only the executive summary as a standalone document.
- Collapsible sections for users who want to focus on specific parts of the report.

## Related Documentation

- [Foundation — Reading the Results](../../foundation.md#reading-the-results)
- [Effort Analysis](./effort-analysis.md)
- [Timeline Analysis](./timeline-analysis.md)
- [Capacity Assessment](./capacity-assessment.md)
- [Distribution Charts](./distribution-charts.md)
- [Workload Chart](./workload-chart.md)
- [Executive Summary](./executive-summary.md)
- [Simulation Parameters](../01-configure/simulation-parameters.md) — the confidence level setting shapes the highlighted metrics and chart headings throughout the report
