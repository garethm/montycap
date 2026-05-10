# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a single-file Monte Carlo simulation tool for capacity planning. The application runs in the browser as a self-contained `web/index.html`, assembled from source files in `src/` via a build step.

## Git Branch Policy

Before starting any work, check the current branch with `git branch` and verify it is appropriate for the task being requested. If the branch name does not match the work (e.g. the branch is named for a previous unrelated fix), create a new branch first:

```
git checkout main
git pull
git checkout -b <type>/<short-description>
```

Branch naming convention: `<type>/<short-description>` where type is one of `feat`, `fix`, `refactor`, `test`, `docs`, or `chore`. Keep branches focused on a single concern — do not mix unrelated changes on one branch.

## Commands

### Build
```
npm run build
```
Assembles `src/template.html`, `src/simulation.js`, and `src/ui.js` into `web/index.html`.

`web/index.html` is gitignored — always run the build before opening the app in a browser.

### Test
```
npm test
```
Runs property-based tests in `test/` using vitest and fast-check.

### Development Tools
- JavaScript lint: `npx eslint src/simulation.js src/ui.js`
- HTML validation: `npx html-validate web/index.html`
- Note: Tools installed with npm must be run using `npx` prefix

### Development Workflow
1. Edit files in `src/`
2. Run `npm run build`
3. Open `web/index.html` in a web browser to test
- Test across multiple browsers for compatibility

### Testing
- Manual testing by opening `web/index.html` in different browsers
- Test with various task configurations and simulation parameters
- Verify CSV import/export functionality
- Test edge cases with extreme values

## Architecture

### Source Structure
- **`src/simulation.js`**: Pure simulation functions — no DOM dependencies. Safe to test in Node.js.
- **`src/ui.js`**: DOM-coupled UI functions — reads form inputs, renders results, manages charts.
- **`src/template.html`**: HTML structure and CSS with a `/* @@BUILD_JS@@ */` placeholder for JS injection.
- **`scripts/build.js`**: Concatenates simulation.js and ui.js into the template placeholder to produce `web/index.html`.
- **`web/index.html`**: Built artifact, gitignored — do not edit manually.

### Key Components

#### Monte Carlo Simulation Engine
- **PERT Distribution**: Uses Beta distribution for task effort modeling
- **Statistical Functions**: Custom implementation of gamma and normal distributions
- **Marsaglia-Tsang Algorithm**: For generating gamma random variables (`gammaRandom`, line 7)
- **Skip Logic**: Handles optional tasks with configurable skip percentages

#### Core Functions in `src/simulation.js`
- `generateTaskEffort()`: Task effort generation with skip logic
- `simulateProgram()`: Orchestrates a single simulation run
- `betaDistribution()` & `gammaRandom()`: Statistical distribution generators
- `scheduleWithCapacityConstraints()`: Capacity-aware work scheduling

#### Core Functions in `src/ui.js`
- `runSimulation()`: Orchestrates the entire Monte Carlo simulation
- `displayResults()`: Renders simulation results with capacity analysis
- `createCharts()`: Chart.js chart creation for distributions and workload

#### UI Components
- **Task Management**: Dynamic task input grid with add/remove functionality
- **Settings Panel**: Simulation parameters (capacity, runs, confidence level)
- **Results Display**: Metrics grid with capacity risk indicators
- **Chart Visualization**: Chart.js integration for distribution histogram

#### Data Handling
- **CSV Import/Export**: File handling for task configurations
- **Browser Storage**: No persistence - all data is session-based
- **File Format**: CSV with columns: Task Name, Quantity, Skip %, Optimistic, Expected, Pessimistic

### Dependencies
- **Chart.js**: CDN library for data visualization
- **PapaParse**: CDN library for CSV parsing and serialisation
- **Browser APIs**: FileReader for CSV processing, Canvas for charts

External dependencies are loaded via CDN rather than bundled, to keep the output a single self-contained HTML file.

### Key Features
- Real-time Monte Carlo simulation with configurable parameters
- PERT/Beta distribution for realistic task effort modeling
- Capacity risk analysis with visual indicators
- Interactive task management with quantity and skip probability
- CSV import/export for task configurations
- Responsive design with CSS Grid

## Development Notes

### Code Style
- Vanilla JavaScript (ES6+) — no bundled dependencies; external libraries loaded via CDN
- Inline CSS using CSS Grid and Flexbox for responsive design
- Functional programming approach for statistical calculations
- Event-driven UI updates

### Browser Compatibility
- Requires modern browser supporting ES6+, HTML5 File API, and Canvas
- No server-side components or build process required
- Self-contained single HTML file; Chart.js and PapaParse loaded via CDN

### Statistical Implementation
- Uses proper PERT distribution with Beta parameters
- Implements Marsaglia-Tsang method for gamma distribution
- Box-Muller transform for normal random number generation
- Handles edge cases in statistical calculations with safe parameter bounds
