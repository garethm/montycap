# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a single-file Monte Carlo simulation tool for capacity planning. The entire application is contained in `src/index.html` as a self-contained web application that runs in the browser.

## Commands

Since this is a client-side HTML application, there are no build, test, or lint commands. The application runs directly in the browser by opening `src/index.html`.

### Development Tools
- HTML validation: `npx html-validate src/index.html`
- Note: Tools installed with npm must be run using `npx` prefix

### Development Workflow
- Open `src/index.html` in a web browser to run the application
- Make changes directly to the HTML file
- Refresh the browser to see changes
- Test across multiple browsers for compatibility

### Testing
- Manual testing by opening `src/index.html` in different browsers
- Test with various task configurations and simulation parameters
- Verify CSV import/export functionality
- Test edge cases with extreme values

## Architecture

### Single-File Architecture
The application uses a monolithic single-file structure with:
- **HTML**: Structure and UI components (lines 1-165)
- **CSS**: Embedded styles for responsive design (lines 7-164)
- **JavaScript**: Application logic and simulation engine (lines 244-652)

### Key Components

#### Monte Carlo Simulation Engine
- **PERT Distribution**: Uses Beta distribution for task effort modeling
- **Statistical Functions**: Custom implementation of gamma and normal distributions
- **Marsaglia-Tsang Algorithm**: For generating gamma random variables (lines 274-301)
- **Skip Logic**: Handles optional tasks with configurable skip percentages

#### Core Functions
- `generateTaskEffort()`: Main simulation function handling task effort generation
- `runSimulation()`: Orchestrates the entire Monte Carlo simulation
- `betaDistribution()` & `gammaRandom()`: Statistical distribution generators
- `displayResults()`: Renders simulation results with capacity analysis

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
- **Chart.js**: External CDN library for data visualization
- **Browser APIs**: FileReader for CSV processing, Canvas for charts

### Key Features
- Real-time Monte Carlo simulation with configurable parameters
- PERT/Beta distribution for realistic task effort modeling
- Capacity risk analysis with visual indicators
- Interactive task management with quantity and skip probability
- CSV import/export for task configurations
- Responsive design with CSS Grid

## Development Notes

### Code Style
- Vanilla JavaScript (ES6+) with no framework dependencies
- Inline CSS using CSS Grid and Flexbox for responsive design
- Functional programming approach for statistical calculations
- Event-driven UI updates

### Browser Compatibility
- Requires modern browser supporting ES6+, HTML5 File API, and Canvas
- No server-side components or build process required
- Self-contained with external CDN dependency only for Chart.js

### Statistical Implementation
- Uses proper PERT distribution with Beta parameters
- Implements Marsaglia-Tsang method for gamma distribution
- Box-Muller transform for normal random number generation
- Handles edge cases in statistical calculations with safe parameter bounds
