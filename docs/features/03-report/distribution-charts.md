# Feature: Distribution Charts

## Overview

Two histogram charts appear between the Timeline Analysis grid and the Weekly Workload chart. They show the full shape of the effort and timeline distributions across all simulation runs, complementing the percentile metrics by revealing how spread out outcomes are and whether the distribution has a long tail.

## User Story

As a capacity planner, I want to see the full distribution of simulation outcomes as a chart so that I can judge whether results are tightly clustered or spread across a wide range, and whether there are outlying scenarios I need to plan for.

## Functionality

### Effort Distribution Chart

The effort distribution chart shows how frequently each effort range occurred across all simulation runs. The horizontal axis represents total effort in person-hours; the vertical axis represents how many runs produced an outcome in each range.

The chart answers questions such as:
- Is there a clear most-likely outcome, or is effort spread across a broad range?
- Is there a tail of high-effort runs that the P90 figure is capturing?
- How far apart are the typical and worst-case outcomes?

### Timeline Distribution Chart

The timeline distribution chart has the same structure, with total calendar duration in business days on the horizontal axis. It reveals the shape of the timeline distribution independently from effort — a programme with moderate effort variance can still show a wide timeline distribution if weekly capacity is constrained.

### Relationship to the Metrics Grids

The percentile metrics in the [Effort Analysis](./effort-analysis.md) and [Timeline Analysis](./timeline-analysis.md) sections read specific points off these distributions. The charts make the underlying distributions visible, so the user can see what lies between those points — for example, whether the gap between P50 and P90 represents a gradual slope or a sharp jump.

### Bin Resolution

Each chart divides the full range of outcomes into 50 equal-width bins. With a typical run count of 1,000 or more, this provides enough resolution to reveal the distribution shape without excessive noise.

## Security Considerations

### Attack Surface

#### Inbound Data Vectors

- **Simulation output**: Both charts receive numeric arrays (effort results and timeline results). No user-supplied strings are passed to the chart renderer.

#### Outbound Data Vectors

- **Canvas rendering**: Chart.js renders to an HTML `<canvas>` element. Canvas output is a rasterised image; it cannot contain executable content.

#### Trust Boundaries

- **Simulation to chart renderer**: Only numeric data reaches Chart.js. Axis labels are numeric strings derived from the data range; they are not user-supplied.

### Threat Model

- **Injection via chart data**: Chart.js receives numeric arrays and renders them to canvas. There is no path from user-supplied strings to chart rendering in this feature. Risk: negligible.

### Security Controls

- Chart data must consist only of numeric values derived from simulation output; no user-supplied strings must be passed to the chart renderer.

## Configuration

| Constant | Value | Purpose |
|---|---|---|
| Histogram bins | 50 | Number of equal-width bins used for both charts |

## Usage Examples

### Reading an effort distribution chart

A chart where the bars cluster tightly around a central value indicates low variance — most simulation runs produced similar effort totals. A chart with a long right tail indicates that while most outcomes are moderate, a significant minority involve much higher effort; the P90 metric captures the start of that tail.

### Reading a timeline distribution chart

The same principles apply. A bimodal distribution (two clusters of bars) may indicate that the programme frequently completes in two distinct phases of duration, often caused by a capacity bottleneck that either clears quickly or persists.

## Validation & Error Handling

This feature renders charts from pre-computed simulation output and performs no validation. If the simulation produces no results, the results panel is not shown and these charts are not rendered. Prior chart instances must be destroyed before new ones are created to prevent resource accumulation across runs.

## Testing

> **Incomplete**: Test cases for this section require specific task configurations that produce recognisable distribution shapes (e.g. narrow vs. wide, symmetric vs. skewed). These need to be defined in a follow-up task.

### Test Cases

- Both charts render after a simulation run
- The effort chart uses effort data and the timeline chart uses timeline data (the two charts must not show identical data)
- Re-running the simulation replaces both charts; no stale chart from a previous run remains

### Manual Testing Steps

> **Incomplete**: Specific input configurations to drive identifiable distribution shapes need to be defined.

## Performance Considerations

Chart.js renders to canvas, which is well-suited to rendering bar charts with 50 bins and 1,000+ data points. Prior chart instances must be explicitly destroyed before creating new ones to avoid memory accumulation across runs. At the scale of simulation outputs this application handles, render time is imperceptible.

## Known Limitations

- Bin width is fixed at 1/50th of the outcome range. A very narrow distribution with a few extreme outliers can result in most bars clustering at one end with a long sparse tail.
- The charts do not mark the percentile values or the confidence-level value on the chart itself; those figures appear only in the metrics grids above.
- The available capacity budget is not shown as a reference line on the effort chart; that context is provided by the Effort Analysis grid and the [Capacity Assessment](./capacity-assessment.md) message instead.

## Future Enhancements

- Overlay markers for P50, the confidence-level percentile, and P90 on each chart to connect the visual distribution to the headline metrics.
- Add a reference line at the available capacity value on the effort chart.
- Allow the bin count to be adjusted for users who want more or less granularity.

## Related Documentation

- [Foundation — Reading the Results](../../foundation.md#reading-the-results)
- [Report Structure](./report-structure.md)
- [Effort Analysis](./effort-analysis.md)
- [Timeline Analysis](./timeline-analysis.md)
- [Workload Chart](./workload-chart.md)
