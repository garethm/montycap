# Monte Carlo Capacity Planning Tool

A web-based Monte Carlo simulation tool for capacity planning that helps estimate project completion times and resource requirements using probabilistic modeling.

## Features

- **Monte Carlo Simulation**: Run thousands of simulations to model uncertainty in task completion times
- **PERT/Beta Distribution**: Uses realistic task effort distributions with optimistic, expected, and pessimistic estimates
- **Capacity Analysis**: Evaluates risk of exceeding available capacity with visual indicators
- **Task Management**: Add, remove, and configure multiple tasks with different quantities
- **Skip Probability**: Model optional tasks with configurable skip percentages
- **Data Import/Export**: Load tasks from CSV files and export configurations
- **Visual Results**: Interactive charts showing effort distribution and capacity thresholds
- **Confidence Intervals**: Configurable confidence levels for planning scenarios

## Getting Started

```bash
git clone <repo-url>
cd montycap
npm install --ignore-scripts
npm test
npm run build
```

Then open `web/index.html` in your web browser.

> `web/index.html` is assembled from source files in `src/` and is not checked into git — you must run `npm run build` before opening the app for the first time and after any changes to `src/`.

Once open:

1. Configure your simulation settings:
   - Available capacity (person-days)
   - Number of simulation runs (default: 10,000)
   - Confidence level (default: 80%)
2. Add tasks with their estimates:
   - Task name and quantity
   - Skip percentage (for optional tasks)
   - Optimistic, expected, and pessimistic effort estimates
3. Click "Run Monte Carlo Simulation" to see results

## Usage

### Task Configuration

Each task requires:
- **Name**: Descriptive task name
- **Quantity**: Number of times this task will be performed
- **Skip %**: Probability the task can be skipped (0-95%)
- **Optimistic**: Best-case effort estimate
- **Expected**: Most likely effort estimate
- **Pessimistic**: Worst-case effort estimate

### Results Interpretation

The simulation provides:
- **Mean Effort**: Average effort across all simulations
- **Median (P50)**: 50th percentile effort estimate
- **Confidence Level**: Effort estimate at your chosen confidence level
- **P90**: 90th percentile (worst-case planning scenario)
- **Over Capacity Risk**: Percentage chance of exceeding available capacity

### Capacity Risk Indicators

- **🟢 Good Capacity**: <5% risk of exceeding capacity
- **🟡 Moderate Risk**: 5-20% risk of exceeding capacity
- **🔴 High Risk**: >20% risk of exceeding capacity

## File Format

CSV files should follow this format:
```csv
Task Name,Quantity,Skip %,Optimistic,Expected,Pessimistic
"Supplier Security Review",5,0,1,4,12
"Vulnerability Assessment",1,0,3,8,15
"Supplier Follow-up",1,60,1,3,8
```

### CSV injection mitigation

When exporting, task names that begin with a spreadsheet formula character (`=`, `+`, `-`, `@`, tab, carriage return) are prefixed with a single quote (`'`) to prevent spreadsheet applications from executing them as formulas when the file is opened.

In **Google Sheets** and **LibreOffice Calc** the leading `'` acts as a silent text-mode prefix and is not displayed in the cell. In **Microsoft Excel** it appears as a literal character, so a task named `=My formula` will display as `'=My formula` — the formula is blocked but there is a minor visual artefact.

If you import an exported CSV back into the tool the leading `'` is stripped automatically, so task names round-trip correctly. Note that this is a defence-in-depth measure: a hand-crafted CSV can still contain formula strings, so you should only open CSV files from sources you trust.

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Visualization**: Chart.js for distribution charts
- **Statistics**: Custom implementation of Beta/PERT distributions
- **File Handling**: FileReader API for CSV import/export
- **Build**: Node.js script assembling `src/` into `web/index.html`
- **Testing**: vitest + fast-check (property-based tests), happy-dom for DOM tests
- **Linting**: ESLint, html-validate

## Statistical Methods

The tool uses:
- **PERT Distribution**: Program Evaluation and Review Technique for task effort modeling
- **Beta Distribution**: Underlying probability distribution for realistic effort estimates
- **Monte Carlo Method**: Repeated random sampling to model uncertainty
- **Marsaglia-Tsang Algorithm**: For generating gamma random variables

## Browser Compatibility

Works in modern browsers supporting:
- ES6+ JavaScript features
- HTML5 File API
- Canvas API (for charts)
- CSS Grid and Flexbox

## License

MIT License - see LICENSE file for details

## Documentation

- **[Contributing Guide](docs/development/CONTRIBUTING.md)**: How to contribute to this project
- **[Security Policy](docs/development/SECURITY.md)**: Security considerations and vulnerability reporting
- **[Architecture Decisions](docs/adr/)**: Technical decisions and their rationale
- **[Feature Documentation](docs/features/)**: Detailed feature specifications

## Contributing

1. Fork the repository and clone your fork
2. Create a branch: `git checkout -b <type>/<short-description>` (types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`)
3. Install dependencies: `npm install --ignore-scripts`
4. Install pre-commit hooks: `pipx install pre-commit && pre-commit install` (or `pip install pre-commit && pre-commit install`)
5. Edit source files in `src/` — do not edit `web/index.html` directly
6. Run tests: `npm test`
7. Build: `npm run build`
8. Test in multiple browsers
9. Submit a pull request

New direct dependencies require an ADR before being added to `package.json` — see [ADR-0005](docs/adr/0005-dependency-decision-policy.md).

For detailed contribution guidelines, see [CONTRIBUTING.md](docs/development/CONTRIBUTING.md).

## Support

For issues and feature requests, please use the GitHub issue tracker.
