# Feature: Capacity-Constrained Scheduling

## Overview

After effort values are sampled for each task in each programme instance, the scheduler places all work items into a shared calendar subject to the weekly capacity constraint. Work items are positioned at the earliest available slot that does not exceed the weekly capacity limit; items that cannot fit in a given week are pushed forward until capacity is available. Tasks that require more than one day's worth of capacity are split into sub-day chunks before scheduling so that each chunk fits within a single day. The final timeline for a simulation run is the day when the last item finishes, including any trailing wait time.

## User Story

As a capacity planner, I want the simulation to model the scheduling impact of limited weekly capacity so that the timeline output reflects how long the work will actually take when the team can only contribute a fixed number of hours per week — not just how many person-hours are required in total.

## Functionality

### Why Scheduling Matters

Total effort and calendar duration are related but different. A programme requiring 400 person-hours could complete in ten weeks at 40 hours per week, or twenty weeks at 20 hours per week, even though the effort is the same. When multiple parallel instances share the same weekly capacity, contention for that capacity further stretches the calendar. The scheduler models this explicitly: each simulation run produces a timeline that reflects when all work can realistically be completed, not just how much work there is.

### Task Chunking

Before scheduling, each work item is compared against the daily capacity limit — the maximum hours that can be completed in a single working day, derived from the weekly capacity and a five-day working week. If a task's sampled effort exceeds this limit, it is split into a sequence of chunks, each no larger than the daily limit.

Chunking preserves the task's total effort. A 20-hour task with a daily limit of 8 hours produces three chunks: 8 hours, 8 hours, and 4 hours. The chunks are scheduled sequentially — a later chunk cannot begin until the preceding chunk has completed.

Wait time is associated with the final chunk only. If a task is split, the wait period begins after the last chunk of work is done, not after each intermediate chunk.

Tasks that fit within the daily capacity are not chunked.

### Capacity Allocation

All work items from all programme instances in a single run share one weekly capacity pool. The scheduler tracks how many hours have been allocated in each week across all instances combined. Before placing a work item, it checks whether the item fits within the remaining capacity for the weeks it would occupy.

Work that spans a week boundary has its hours distributed proportionally across the weeks it touches, based on how many working days fall in each. A task beginning on Thursday and completing the following Tuesday would have roughly two-fifths of its hours counted against the first week and three-fifths against the second.

### Placement and Deferral

Each work item is placed at its earliest permissible start day — the later of the item's natural start (when the previous task in the same series finished) and the day its preceding chunk completed. The scheduler then checks whether the weekly capacity allows placement there:

- If there is sufficient capacity, the item is placed and the weekly usage is updated
- If there is insufficient capacity, the start day is advanced and the check is repeated:
  - Small items that fit within a single day are advanced by one day at a time
  - Larger items are advanced to the start of the next complete week

This continues until a valid slot is found or a fallback limit is reached.

### Fallback for Heavily Constrained Configurations

If a valid slot cannot be found within a fixed number of advancement attempts, the item is placed at the current candidate start day regardless of capacity. This prevents the scheduler from looping indefinitely when the configuration is severely oversubscribed (for example, a large number of parallel instances relative to weekly capacity). The placed item will exceed the weekly capacity limit for that week; the resulting timeline is still recorded, but the weekly hours in the affected weeks will be above the configured limit.

This condition is most likely to arise when the complexity budget warning has been dismissed and the run involves a very high programme quantity. The workload chart will show the oversubscribed weeks in red.

### Wait Time and the Timeline

Wait time is calendar time during which the team is not working on a task — an external review, a stakeholder response, or a scheduled pause. After a task's work chunks are all placed, the wait time is added to determine when the *next* task in the same series can begin. Wait time does not consume capacity; other series can use that capacity freely during the wait period.

The total timeline for a run is the latest day across all scheduled items, where each item's contribution is its scheduled completion day plus its associated wait time.

### Task and Series Ordering

Within a programme instance (series), tasks execute in the order they appear in the task grid. Task N in a series cannot begin until task N-1 is fully complete, including its wait time. There is no parallel execution within a single series.

Across series, work is interleaved freely — the scheduler places items from all series into the shared capacity pool, and items from different series may occupy the same week. The order in which series are processed follows their index, but the greedy placement approach means earlier series do not have a meaningful scheduling advantage over later ones in most configurations.

### Data Flow

For each simulation run:

1. Effort sampling produces a work effort (hours) and wait time (days) for each non-skipped task in each series
2. Tasks exceeding the daily capacity limit are split into chunks; others remain whole
3. All work items — chunks and whole tasks — across all series are sorted by series, task order within the series, and chunk order within the task
4. Each item is placed at the earliest available slot that fits within the weekly capacity; if no slot is found within the attempt limit, the item is placed at the current candidate position
5. After each item is placed, the weekly usage map is updated and the series's progress marker is advanced
6. Once all items are placed, the total timeline is read as the maximum scheduled completion day plus any trailing wait time across all items
7. The resulting schedule is stored alongside the timeline for use by the workload chart

## Security Considerations

### Attack Surface

#### Inbound Data Vectors

- **Sampled effort values**: Work effort and wait time values arrive from the effort sampling stage as numbers. No user-supplied strings are involved at this stage.
- **Simulation parameters**: Weekly capacity and hours per day are parsed from numeric form fields before reaching the scheduler.

#### Outbound Data Vectors

- **Scheduled timeline**: The timeline value is a number (days). It contributes to the sorted results array and is later rendered as a formatted decimal string in the report.
- **Work schedule**: The schedule produced for each run is a numeric data structure used to generate the workload chart. No user-supplied strings are carried into chart rendering.

#### Trust Boundaries

- **Effort sampling to scheduler**: Only numeric values (hours, days, indices) cross this boundary. No string content is forwarded.

### Threat Model

- **Infinite loop via adversarial inputs**: A very high programme quantity relative to weekly capacity could cause the placement loop to run for a very long time → Mitigation: a fixed attempt limit ensures the loop terminates; the item is placed unconditionally once the limit is reached.
- **Numeric overflow via extreme values**: Very large effort values or very high programme quantities could produce very large timeline numbers → Mitigation: JavaScript numbers handle values well beyond any realistic planning input; no clamping is required.

### Security Controls

- The placement loop must terminate unconditionally within a fixed number of attempts, regardless of input values.
- All scheduled values must be numbers; no user-supplied strings must be included in the work schedule passed to the chart.

## Configuration

| Parameter | Source | Role in scheduling |
|---|---|---|
| Max Weekly Capacity (hrs) | Simulation Settings | The total hours available per week across all series; the primary constraint |
| Hours per Work Day | Simulation Settings | Used to convert person-hours to working days, and to derive the daily capacity limit for chunking |
| Program Quantity | Simulation Settings | Determines how many series compete for the shared weekly capacity |

The daily capacity limit used for chunking is derived from weekly capacity divided by five and is not separately configurable.

## Usage Examples

### Single instance, well within capacity

```text
Weekly capacity: 40 hrs
Programme quantity: 1
Tasks: 3 tasks, sampled efforts of 12, 20, and 8 hours (daily limit: 8 hrs)

Task 1 (12 hrs, 2 chunks):  chunk 1 → days 0–1, chunk 2 → days 1–2.5
Task 2 (20 hrs, 3 chunks):  placed sequentially after task 1
Task 3 (8 hrs, 1 chunk):    placed after task 2

Each week stays well within 40 hrs; no deferral needed.
```

### Multiple instances competing for capacity

```text
Weekly capacity: 40 hrs
Programme quantity: 5
Each instance: 3 tasks totalling ~40 hours sampled effort

Week 1: instances 1–3 fill the 40-hour pool; instances 4–5 are deferred to week 2
Week 2: deferred work from instances 4–5 is placed; further tasks from all instances compete
Timeline is longer than (total effort / weekly capacity) would suggest, due to contention.
```

### Wait time extending the calendar

```text
Task: 8 hrs work (placed in week 1), 10 days wait
Next task in same series: earliest start is day 10 (8 hrs / 8 hrs per day + 10 days wait = day 11)

During days 1–11, the team's capacity is free for other series.
The calendar duration of the series extends by 10 days; total effort is unaffected.
```

### Fallback placement for an oversubscribed configuration

```text
Weekly capacity: 10 hrs
Programme quantity: 20
Many items contend for a small weekly pool.

After the attempt limit is exhausted for a given item, the item is placed
at the current candidate position even though that week is already at capacity.
The workload chart will show the affected weeks in red.
```

## Validation & Error Handling

- The placement loop must not run indefinitely; it must terminate at the attempt limit and force placement at the current position
- A work item with zero or negative hours must be treated as schedulable immediately without consuming any capacity
- If a run produces no scheduled items (all tasks were skipped), the timeline must be handled gracefully — the maximum of an empty set must not cause an error

## Testing

### Test Cases

- A task requiring more than one day's capacity is split into chunks whose individual hours each fit within the daily limit
- Chunks of the same task are scheduled sequentially; the second chunk does not begin before the first ends
- Wait time does not appear in the weekly capacity usage — weeks during a wait are not marked as consumed
- With a single instance and generous capacity, the total timeline matches effort divided by hours per day plus any wait time (no deferral)
- With high programme quantity relative to weekly capacity, the timeline is longer than effort alone would imply
- After the attempt limit is reached, the scheduler places the item rather than looping further
- The timeline is computed as the latest scheduled completion plus trailing wait, not just the latest scheduled completion

### Manual Testing Steps

1. Set weekly capacity to 8 hrs and hours per day to 8, add one task with work effort 40 / 40 / 40 hrs, run — confirm the timeline is approximately 5 days (five chunks of 8 hrs across five consecutive days)
2. Set programme quantity to 10, same configuration — confirm the timeline increases relative to a single instance, reflecting capacity contention
3. Add a task with a wait of 0 / 10 / 10 days and a second task after it, run — confirm the second task's start is delayed by the wait period of the first
4. Set weekly capacity to 8 hrs and programme quantity to 20, run — confirm the simulation completes and results are produced (no hang); check the workload chart for red bars indicating oversubscribed weeks

## Performance Considerations

- Scheduling is O(n²) in the worst case due to the linear scan over placed items when resolving chunk predecessors; for typical task counts (tens to low hundreds of items per run) this is not a concern
- The attempt limit bounds the per-item placement cost; no item can cause more than that many iterations regardless of configuration
- The weekly usage map is keyed by week number and allocated lazily; it imposes no cost for weeks with no work

## Known Limitations

- Working weeks are modelled as five consecutive days; there is no representation of public holidays, part-week schedules, or irregular capacity patterns
- The scheduler is greedy: each item is placed as early as possible. It does not globally optimise for minimum timeline or even load distribution. A different task ordering could sometimes produce a shorter timeline
- Tasks execute in the order they appear in the task grid. There is no way to specify that a task may overlap with the preceding one, or to mark a dependency that skips intermediate tasks
- The attempt limit means that heavily oversubscribed configurations can silently exceed the weekly capacity for some weeks; the workload chart is the only signal that this has occurred
- The daily capacity limit for chunking is always weekly capacity divided by five. There is no way to specify a different daily limit independently

## Future Enhancements

- Support non-uniform weekly capacity (e.g. weeks with holidays, ramp-up periods, or variable team availability)
- Expose the placement attempt limit as a configuration option for users running extreme programme quantities
- Investigate whether a smarter placement strategy (e.g. earliest-deadline-first) would reduce timeline variance across runs

## Related Documentation

- [Foundation — Capacity: Budget and Throughput](../../foundation.md#capacity-budget-and-throughput)
- [Foundation — Programme Quantity](../../foundation.md#programme-quantity)
- [Foundation — Tasks: Work and Wait](../../foundation.md#tasks-work-and-wait)
- [Effort Sampling](./effort-sampling.md) — produces the work effort and wait time values that this feature schedules
- [Simulation Parameters](../01-configure/simulation-parameters.md) — the `weeklyCapacity`, `hoursPerDay`, and `programQuantity` parameters that govern the scheduler
- [Timeline Analysis](../03-report/timeline-analysis.md) — the report section that presents the timeline distribution produced by this feature
- [Workload Chart](../03-report/workload-chart.md) — visualises the week-by-week capacity usage produced by the schedule
- [Simulation Engine Property-Based Tests](../90-testing/simulation-engine-property-based-tests.md) — tests that verify scheduling invariants across random inputs
