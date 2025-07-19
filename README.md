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

1. Open `src/index.html` in your web browser
2. Configure your simulation settings:
   - Available capacity (person-days)
   - Number of simulation runs (default: 10,000)
   - Confidence level (default: 80%)
3. Add tasks with their estimates:
   - Task name and quantity
   - Skip percentage (for optional tasks)
   - Optimistic, expected, and pessimistic effort estimates
4. Click "Run Monte Carlo Simulation" to see results

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

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Visualization**: Chart.js for distribution charts
- **Statistics**: Custom implementation of Beta/PERT distributions
- **File Handling**: FileReader API for CSV import/export

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

## Contributing

This is a single-file application. To contribute:
1. Fork the repository
2. Make changes to `src/index.html`
3. Test in multiple browsers
4. Submit a pull request

## Support

For issues and feature requests, please use the GitHub issue tracker.
