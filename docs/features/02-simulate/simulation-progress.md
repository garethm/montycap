# Feature: Simulation Progress

## Overview

Provides visual feedback while a simulation run is in progress: a progress bar showing percentage completion, and a disabled Run button labelled "Running…". The simulation executes in small batches, yielding to the browser between each batch so the page remains responsive and the progress display can update. When the run finishes — or fails — the UI returns to its ready state.

## User Story

As a capacity planner, I want clear feedback while the simulation runs so that I know the tool is working, can see how far through it is, and am not tempted to click Run again or assume the page has frozen.

## Functionality

### Core Features

- While a simulation run is in progress, the Run button must be disabled and its label must change to "Running…"
- A progress bar must be visible during the run, advancing from 0% to 100% as runs complete
- The progress percentage must be displayed numerically alongside the bar
- The progress bar must advance incrementally throughout the run, not jump from 0% to 100% at the end
- The page must remain responsive during the run — the user must be able to scroll, interact with other browser tabs, and observe the progress display updating
- When the run completes, the progress bar must be hidden and the Run button must return to its active, correctly labelled state
- If the run fails, the same restoration must occur and an error message must be shown

### Automatic Run on Page Load

The simulation runs automatically a short time after the page loads, using the default parameter values and the pre-populated example tasks. The same progress display applies to this initial run; a result is visible to the user without any interaction.

### Incremental Progress

Progress advances in proportion to how many simulation runs have completed. The display updates after each internal batch of runs, so on a short run a few visible steps occur; on a longer run the bar advances more smoothly. The display must never show progress jumping backwards.

### User Interface

The progress container — comprising the progress bar and its percentage label — must be hidden when no run is in progress and visible only during an active run. The Run button and the progress container are both in the settings area above the results panel.

```
┌────────────────────────────────────────────────┐
│  [Run button — disabled, reads "Running…"]     │
│  ┌──────────────────────────────────────┐  42% │
│  │████████████████░░░░░░░░░░░░░░░░░░░░│      │
│  └──────────────────────────────────────┘      │
└────────────────────────────────────────────────┘
```

### Data Flow

1. The user clicks Run (or the page load timer fires)
2. The Run button is disabled and re-labelled; the progress container becomes visible
3. Simulation runs are executed in batches; after each batch the progress percentage is recomputed as `(batches completed / total batches) × 100` and the display is updated
4. Between batches, control is briefly returned to the browser, allowing the progress display to render and the page to remain interactive
5. After the final batch, results are displayed
6. The progress container is hidden and the Run button is restored — regardless of whether the run succeeded or failed

## Security Considerations

### Attack Surface

#### Inbound Data Vectors

- No user-supplied data reaches this feature. Progress values are computed internally from the count of completed and total batches.

#### Outbound Data Vectors

- **DOM rendering**: The progress bar width and percentage label are set from internally computed numeric values. No user-supplied strings are written to the DOM by this feature.

#### Trust Boundaries

- **Simulation to progress display**: Progress values are integers derived from batch counts. There is no path from external input to the progress display.

### Threat Model

- **Injection via progress values**: Progress is a computed percentage between 0 and 100; it is not derived from user input and cannot carry executable content. Risk: negligible.

### Security Controls

- Progress percentage values must be computed from internal counters only; no user-supplied data must influence the progress display.

## Configuration

This feature introduces no named configuration constants. The internal batch size governs how frequently the progress display updates but is not user-configurable and does not affect simulation results.

## Usage Examples

### A short run (1,000 simulations)

```text
User clicks Run.
Button reads "Running…" and is disabled.
Progress bar appears. Advances in ~10 visible steps.
Bar reaches 100% and disappears.
Results panel appears. Button reads "Run Timeline & Capacity Simulation" and is active.
```

### A long run near the complexity budget

```text
User clicks "Run anyway" after seeing the advisory warning.
Button reads "Running…" and is disabled.
Progress bar appears and advances gradually — the user can scroll and switch tabs.
Bar reaches 100% and disappears.
Results panel appears. Button is restored.
```

### An error during the run

```text
User clicks Run.
An unexpected error occurs mid-run.
An alert describes the error.
The progress bar is hidden. The button is restored to its active state.
The user can correct the configuration and run again.
```

## Validation & Error Handling

- The Run button must be restored to its active state whether the run completes normally or throws an error; it must never remain permanently disabled
- If an error occurs, an alert must inform the user and the progress container must be hidden so the UI does not appear stuck
- The progress percentage must be clamped to the range 0–100; it must not display a value outside this range

## Testing

### Test Cases

- Run button reads "Running…" and is disabled immediately after clicking Run
- Progress bar is visible during the run and hidden before and after
- Progress bar advances at least once before reaching 100% on a run of 200 or more simulations
- Progress never decreases during a run
- Run button is restored to its active state after a successful run
- Run button is restored to its active state after a run that throws an error
- On page load, the progress display appears and the results populate without the user clicking Run

### Manual Testing Steps

1. Load the application — confirm the progress bar is hidden on load, then briefly appears as the automatic run executes, then hides once results appear
2. Click Run — confirm the button immediately reads "Running…" and cannot be clicked again
3. Set simulations to 5,000 and click Run — confirm the progress bar visibly advances in multiple steps before completing
4. Confirm the page remains scrollable and the progress percentage updates visually during the run
5. Confirm that after the run the button reads "Run Timeline & Capacity Simulation" and is active

## Performance Considerations

- Yielding to the browser between batches introduces a small overhead per batch; this is intentional and keeps the page responsive
- The frequency of progress updates is proportional to run count: a 1,000-run simulation yields roughly ten times; a 10,000-run simulation yields roughly one hundred times. The overhead per yield is a few milliseconds and does not materially affect total runtime
- The progress bar itself is a simple DOM width update; it introduces no meaningful rendering cost

## Known Limitations

- The progress bar advances in steps, not continuously. On short runs the steps are large and the bar appears to jump; on longer runs the steps are smaller and the advance appears smoother
- The simulation runs on the browser's main thread. Although the page remains interactive between batches, the browser cannot render other animations or handle events during each batch
- There is no cancel button; a run in progress must complete before the user can change parameters and run again

## Future Enhancements

- Move the simulation loop to a Web Worker so the main thread is never blocked, even within a batch
- Add a cancel button that aborts the current run and restores the UI immediately
- Show an estimated time remaining alongside the progress percentage, based on the elapsed time per batch

## Related Documentation

- [Simulation Parameters](../01-configure/simulation-parameters.md) — the `simulations` and `programQuantity` parameters that determine how long a run takes
- [Simulation Complexity Limits](./simulation-complexity-limits.md) — the advisory warning that precedes long runs; the progress display is the feedback mechanism during those runs
- [Report Structure](../03-report/report-structure.md) — the results panel that appears when the run completes
