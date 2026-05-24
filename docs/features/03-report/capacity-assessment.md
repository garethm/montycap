# Feature: Capacity Assessment

## Overview

The Capacity Assessment is a plain-language message that appears immediately below the Effort Analysis grid. It translates the over-capacity risk percentage into a risk level and provides guidance appropriate to that level — making it easier to communicate the headline finding without requiring the reader to interpret the raw percentage themselves.

## User Story

As a capacity planner, I want the simulation to tell me in plain language whether my capacity budget looks adequate so that I can quickly judge whether action is needed without doing the interpretation myself.

## Functionality

### Risk Classification

The over-capacity risk percentage (the proportion of simulation runs in which total effort exceeded the available capacity budget) is mapped to one of three risk levels:

| Risk level | Threshold | Indicator |
|---|---|---|
| Low | ≤ 5% | ✅ Good Capacity |
| Moderate | 6–20% | ⚠️ Moderate Risk |
| High | > 20% | ⚠️ Capacity Risk |

### Message Content

Each risk level produces a distinct message:

**Low (≤ 5%)**
> Good Capacity: Only *X*% chance of exceeding available hours. Reasonable buffer for unexpected work.

**Moderate (6–20%)**
> Moderate Risk: *X*% chance of exceeding available hours. Monitor closely and have contingency plans.

**High (> 20%)**
> Capacity Risk: *X*% chance of exceeding available hours. Consider reducing scope or increasing capacity.

The message is visually styled to match the risk level — the high and moderate messages use a warning style; the low message uses a positive style.

### Risk Level in the Executive Summary

The same risk classification appears again in the Executive Summary's Resource Requirements card, under the label "Capacity Risk Level". There it is colour-coded rather than carrying a full message, providing a compact status indicator for stakeholder-facing communication.

### Relationship to the Over Capacity Risk Metric

The Capacity Assessment does not introduce new information — it is a presentation layer over the Over Capacity Risk percentage shown in the [Effort Analysis](./effort-analysis.md) grid. The percentage drives both the metric value and the assessment message from the same source.

## Known Limitations

- The risk thresholds (5% and 20%) are fixed. There is no way to adjust them to match a particular organisation's risk tolerance.
- The guidance text is generic. It does not suggest which specific tasks to descope or how much additional capacity would be needed to reach a lower risk level.
- A programme at exactly 20.0% receives a Moderate classification rather than High; the boundary behaviour is consistent but not surfaced to the user.

## Future Enhancements

- Allow the risk thresholds to be configured to match organisational standards.
- Add specific guidance based on the gap between confidence-level effort and available capacity (e.g. "You are *X* hours over budget at your chosen confidence level").

## Related Documentation

- [Foundation — Reading the Results](../../foundation.md#reading-the-results)
- [Foundation — Capacity: Budget and Throughput](../../foundation.md#capacity-budget-and-throughput)
- [Report Structure](./report-structure.md)
- [Effort Analysis](./effort-analysis.md) — the over-capacity risk percentage that this message is based on
- [Simulation Parameters](../01-configure/simulation-parameters.md) — the `capacity` parameter determines what counts as "over capacity"
