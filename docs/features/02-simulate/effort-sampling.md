# Feature: Effort Sampling

## Overview

On each simulation run, every task produces a sampled work effort and a sampled wait time by drawing independently from a PERT distribution fitted to the task's three-point estimates. Tasks with a non-zero skip probability may be omitted entirely in a given run, contributing neither work nor wait. The same sampling mechanism applies to both work effort and wait time, and each task in each programme instance is sampled independently.

## User Story

As a capacity planner, I want the simulation to draw realistic effort values from the range I described so that the distribution of outcomes reflects the true uncertainty in my estimates — clustering near the most likely outcome but preserving the tail of difficult scenarios.

## Functionality

### PERT Distribution Sampling

For each non-skipped task in each run, both work effort and wait time are sampled from a PERT distribution fitted to the task's three-point estimates.

The PERT distribution is a scaled Beta distribution. Its key property is that outcomes cluster around a weighted mean — `(optimistic + 4 × expected + pessimistic) / 6` — rather than around the arithmetic midpoint of the range. This gives the expected estimate four times the weight of the extreme estimates, reflecting the assumption that the expected case is the most carefully considered. The result is a distribution that:

- Produces outcomes within the [optimistic, pessimistic] range
- Has its mode at the expected value
- Has an asymmetric tail toward the pessimistic end when the expected value is closer to optimistic than to pessimistic

Work effort and wait time for the same task are sampled independently. A run may produce a low work effort and a high wait time for the same task, or any other combination.

### Skip Logic

When a task has a non-zero skip percentage, a random check is performed at the start of each task evaluation for each programme instance in each run. If the check indicates the task is skipped:

- The task contributes **zero work effort** and **zero wait time** for that instance
- The task is absent from the schedule for that instance
- No PERT sampling occurs for that instance

The skip check is independent for every instance in a multi-quantity run. In a run with ten parallel instances, a task with a 60% skip probability will typically be absent from around six of the ten instances, with the exact count varying by run.

### Work Effort vs. Wait Time

Work effort and wait time are sampled by the same mechanism but represent different things downstream:

| Component | Unit | What it affects |
|---|---|---|
| Work effort | Person-hours | Consumes team capacity; counts toward total effort; drives the effort distribution |
| Wait time | Days | Adds calendar duration for that instance; does not consume capacity |

For the conceptual distinction between work effort and wait time, see [Foundation — Tasks: Work and Wait](../../foundation.md#tasks-work-and-wait).

### Zero and Inverted Ranges

When the pessimistic estimate equals the optimistic estimate (range is zero), no distribution can be fitted. The expected value is returned directly, and no random sampling occurs.

When the pessimistic estimate is less than the optimistic estimate (an inverted range), the same applies: the expected value is returned. An inverted range is accepted without error; the result is deterministic for that task.

### Extreme PERT Ratios

When the expected value is very close to one end of the optimistic–pessimistic range, the fitted Beta distribution parameters become small. Parameters below a safe threshold are raised to that threshold before sampling. This keeps the distribution well-behaved at the cost of a slight shift relative to what a strict PERT parameterisation would produce for highly skewed inputs. In practice this matters only when the expected value is extremely close to the optimistic or pessimistic bound.

### Data Flow

For each series (programme instance) in each simulation run:

1. Each task is evaluated in order
2. If the task has a skip percentage, a random check determines whether the task is present in this instance
3. For a present task, work effort is sampled from the PERT distribution fitted to the work estimates
4. Wait time is sampled from the PERT distribution fitted to the wait estimates
5. The sampled work effort is passed to the scheduler; the sampled wait time is used to delay the earliest start of the next task in the same series
6. The work effort accumulates into the run's total effort figure

## Security Considerations

### Attack Surface

#### Inbound Data Vectors

- **Numeric task inputs**: Optimistic, expected, and pessimistic values are parsed from numeric form fields. They arrive as numbers, not strings.

#### Outbound Data Vectors

- **Simulation results**: Sampled values contribute to numeric result arrays. They are not rendered to the DOM directly; they flow through the results calculation and appear as formatted numbers in the report.

#### Trust Boundaries

- **Form inputs to simulation engine**: By the time task estimates reach the sampling logic, they have been parsed to numbers. No string content is carried through.

### Threat Model

- **Numerical instability via extreme inputs**: An adversarially chosen set of estimates (e.g. pessimistic far larger than expected) could push the Beta distribution parameters to very small values → Mitigation: parameters are raised to a safe minimum before sampling, keeping the distribution well-behaved regardless of input values.
- **Infinite loop in distribution sampling**: The Beta distribution is generated via a rejection-sampling algorithm; pathological inputs could theoretically cause many rejections → Mitigation: the safe minimum on distribution parameters ensures the algorithm converges in a small number of iterations for any valid input.

### Security Controls

- Distribution parameters must be raised to a safe minimum before sampling to prevent numerical instability for any combination of three-point estimates.
- Sampled values must not be written directly to the DOM; they must flow through the results computation and be rendered as formatted numeric strings.

## Configuration

This feature introduces no user-configurable constants. The safe minimum for Beta distribution parameters is an internal implementation detail, not a tunable value.

## Usage Examples

### A task with moderate uncertainty

```text
Work: Optimistic 8 hrs / Expected 24 hrs / Pessimistic 64 hrs
Wait: Optimistic 1 day / Expected 3 days / Pessimistic 10 days
Skip: 0%
```

Each run draws a work effort from roughly 8–64 hours, with the distribution clustering near the PERT mean of 27 hours. Wait time is drawn independently from 1–10 days, clustering near 3.5 days. Both components vary between runs.

### A task with a skip probability

```text
Work: Optimistic 4 hrs / Expected 8 hrs / Pessimistic 24 hrs
Wait: Optimistic 0 days / Expected 0 days / Pessimistic 0 days
Skip: 60%
```

In roughly 60% of runs (per programme instance), this task is absent entirely — contributing no hours and no wait. In the remaining 40% of runs it contributes a sampled work effort drawn from 4–24 hours.

### A deterministic task

```text
Work: Optimistic 8 hrs / Expected 8 hrs / Pessimistic 8 hrs
```

Because the range is zero, all three estimates are equal and every run returns exactly 8 hours for this task. No random sampling occurs.

### A task with an inverted range

```text
Work: Optimistic 40 hrs / Expected 20 hrs / Pessimistic 10 hrs
```

The pessimistic estimate is less than the optimistic estimate. The range is treated as zero and the expected value — 20 hours — is returned every run. No warning is shown; the task behaves deterministically.

## Validation & Error Handling

- A zero or negative range must be detected before sampling; the expected value must be returned directly without attempting to fit a distribution
- An inverted range (pessimistic less than optimistic) must be treated identically to a zero range
- Distribution parameters must be raised to a safe minimum before any sampling call; the sampling algorithm must not be invoked with parameters that could cause numerical instability
- Tasks with missing work estimates are excluded from the simulation run before sampling is attempted — see [Task Management](../01-configure/task-management.md)

## Testing

### Test Cases

- A task with a wide range produces different effort values across repeated runs
- A task with optimistic equal to pessimistic returns the expected value on every run
- A task with a 100% skip rate (if permitted by the UI) is never present in any run
- A task with a 0% skip rate is always present
- Work effort and wait time for the same task are not identical across runs (i.e. they are sampled independently)
- A task with a very skewed range (expected close to optimistic) does not produce errors or infinite loops
- An inverted range (pessimistic less than optimistic) returns the expected value

### Manual Testing Steps

1. Add a single task with a wide range (e.g. Work O/E/P: 1 / 10 / 100 hrs), run 1,000 simulations, and confirm the effort distribution chart shows a spread of outcomes rather than a single spike
2. Set all three work estimates to the same value (e.g. 8 / 8 / 8), run, and confirm the effort distribution chart shows a narrow spike at that value
3. Set a task's skip percentage to 60%, run 1,000 simulations, and confirm the effort chart shows a spike at zero (skipped runs) alongside the distribution of active runs
4. Set a task's pessimistic estimate below its optimistic estimate, run, and confirm no error occurs and results are produced

## Performance Considerations

- Sampling is O(1) per task per run; the total sampling cost scales with `simulations × programQuantity × tasks`
- The rejection-sampling algorithm used for Beta distribution generation typically completes in a small number of iterations. Safe parameter bounds ensure it does not degrade for any valid input
- No caching or pre-computation of distribution parameters occurs between runs; each run samples afresh

## Known Limitations

- For highly skewed three-point estimates (expected very close to optimistic or pessimistic), the safe minimum on Beta distribution parameters shifts the effective distribution slightly away from what strict PERT parameterisation would produce
- An inverted range is accepted without warning and treated as a zero-range deterministic task; the user is not notified that their estimates may be misconfigured — see [Task Management — Known Limitations](../01-configure/task-management.md#known-limitations)
- Work effort and wait time are sampled independently. In reality they may be correlated for some task types (a task that takes longer to complete may also wait longer for a response). This correlation is not modelled.

## Future Enhancements

- Warn when a task has an inverted range so users can identify misconfigured estimates
- Support alternative distribution shapes (triangular, uniform) for users whose uncertainty does not fit the PERT model
- Allow correlation to be specified between work effort and wait time for tasks where the two are expected to co-vary

## Related Documentation

- [Foundation — Three-Point Estimation](../../foundation.md#three-point-estimation)
- [Foundation — Tasks: Work and Wait](../../foundation.md#tasks-work-and-wait)
- [Foundation — Optional Tasks](../../foundation.md#optional-tasks)
- [Task Management](../01-configure/task-management.md) — where three-point estimates and skip percentages are entered
- [Capacity-Constrained Scheduling](./capacity-constrained-scheduling.md) — how the sampled work effort values are placed into a calendar schedule
- [Simulation Engine Property-Based Tests](../90-testing/simulation-engine-property-based-tests.md) — tests that verify sampling invariants across random inputs
