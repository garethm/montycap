import { simulateProgram, findConfidenceRangeSimulations, calculateAggregatedWorkloadDistribution } from './simulation.js';

let chart = null; // Keep for backward compatibility
let effortChart = null;
let timelineChart = null;
let workloadChart = null;

const MAX_TASKS = 100;
const MAX_SIMULATIONS = 25000;
const MAX_PROGRAM_QUANTITY = 100;
const COMPLEXITY_BUDGET = 5000000;

function addTask() {
    const tasksDiv = document.getElementById('tasks');
    if (tasksDiv.querySelectorAll('.task-input').length >= MAX_TASKS) return;
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-input';
    taskDiv.innerHTML = `
                <input type="text" placeholder="Task name">
                <input type="number" placeholder="Skip %" min="0" max="95" step="5" value="0" title="% chance task can be skipped">
                <input type="number" placeholder="Work Opt" min="0.1" step="0.1" title="Work effort optimistic (hours)">
                <input type="number" placeholder="Work Exp" min="0.1" step="0.1" title="Work effort expected (hours)">
                <input type="number" placeholder="Work Pess" min="0.1" step="0.1" title="Work effort pessimistic (hours)">
                <input type="number" placeholder="Wait Opt" min="0" step="0.1" value="0" title="Wait time optimistic">
                <input type="number" placeholder="Wait Exp" min="0" step="0.1" value="0" title="Wait time expected">
                <input type="number" placeholder="Wait Pess" min="0" step="0.1" value="0" title="Wait time pessimistic">
                <button class="remove-btn" onclick="removeTask(this)">Remove</button>
            `;
    tasksDiv.appendChild(taskDiv);
    updateTaskLimitUI();
}

function removeTask(button) {
    button.parentElement.remove();
    updateTaskLimitUI();
}

function updateTaskLimitUI() {
    const tasksDiv = document.getElementById('tasks');
    const atLimit = tasksDiv.querySelectorAll('.task-input').length >= MAX_TASKS;
    const btn = document.getElementById('addTaskBtn');
    const msg = document.getElementById('taskLimitMessage');
    if (btn) btn.disabled = atLimit;
    if (msg) msg.style.display = atLimit ? 'inline' : 'none';
}

function updateProgress(percentage) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    if (progressBar && progressText) {
        progressBar.style.width = percentage + '%';
        progressText.textContent = Math.round(percentage) + '%';
    }
}

let skipBudgetCheck = false;

function getComplexityOps() {
    const simulations = parseInt(document.getElementById('simulations').value) || 0;
    const programQuantity = parseInt(document.getElementById('programQuantity').value) || 0;
    const taskCount = document.querySelectorAll('.task-input').length;
    return simulations * programQuantity * taskCount;
}

function showComplexityWarning(ops) {
    const warning = document.getElementById('complexityWarning');
    if (!warning) return;
    const opsM = (ops / 1000000).toFixed(1);
    warning.innerHTML = `This configuration (~${opsM}M operations) may take a long time. Reduce simulation runs, program quantity, or tasks — or <button onclick="runAnyway()">Run anyway</button>`;
    warning.style.display = 'block';
}

function hideComplexityWarning() {
    const warning = document.getElementById('complexityWarning');
    if (warning) warning.style.display = 'none';
}

function runAnyway() {
    skipBudgetCheck = true;
    runSimulation();
}

function validateInputLimits() {
    const checks = [
        { id: 'simulations', max: MAX_SIMULATIONS, errorId: 'simulationsError' },
        { id: 'programQuantity', max: MAX_PROGRAM_QUANTITY, errorId: 'programQuantityError' },
    ];
    let valid = true;
    for (const { id, max, errorId } of checks) {
        const input = document.getElementById(id);
        const errSpan = document.getElementById(errorId);
        const value = parseInt(input.value);
        const over = value > max;
        input.classList.toggle('input-error', over);
        if (errSpan) errSpan.style.display = over ? 'block' : 'none';
        if (over) valid = false;
    }
    const runButton = document.getElementById('runButton');
    if (runButton) runButton.disabled = !valid;
    return valid;
}

async function runSimulation() {
    if (!validateInputLimits()) return;

    const ops = getComplexityOps();
    if (!skipBudgetCheck && ops > COMPLEXITY_BUDGET) {
        showComplexityWarning(ops);
        return;
    }
    skipBudgetCheck = false;
    hideComplexityWarning();

    const runButton = document.getElementById('runButton');
    const progressContainer = document.getElementById('progressContainer');

    runButton.disabled = true;
    runButton.textContent = 'Running...';
    progressContainer.style.display = 'block';

    try {
        await runSimulationAsync();
    } catch (error) {
        console.error('Simulation error:', error);
        alert('Simulation encountered an error. Please try again.');
    } finally {
        runButton.disabled = !validateInputLimits();
        runButton.textContent = 'Run Timeline & Capacity Simulation';
        progressContainer.style.display = 'none';
    }
}

async function runSimulationAsync() {
    const capacity = parseFloat(document.getElementById('capacity').value);
    const programQuantity = parseInt(document.getElementById('programQuantity').value);
    const simulations = parseInt(document.getElementById('simulations').value);
    const confidence = parseFloat(document.getElementById('confidence').value);
    const hoursPerDay = parseFloat(document.getElementById('hoursPerDay').value);
    const weeklyCapacity = parseFloat(document.getElementById('weeklyCapacity').value);

    const tasks = [];
    document.querySelectorAll('.task-input').forEach(taskDiv => {
        const inputs = taskDiv.querySelectorAll('input');
        const name = inputs[0].value;
        const skipPercentage = parseFloat(inputs[1].value) || 0;
        const workOptimistic = parseFloat(inputs[2].value);
        const workExpected = parseFloat(inputs[3].value);
        const workPessimistic = parseFloat(inputs[4].value);
        const waitOptimistic = parseFloat(inputs[5].value) || 0;
        const waitExpected = parseFloat(inputs[6].value) || 0;
        const waitPessimistic = parseFloat(inputs[7].value) || 0;

        if (name && workOptimistic && workExpected && workPessimistic) {
            tasks.push({
                name,
                skipPercentage,
                work: { optimistic: workOptimistic, expected: workExpected, pessimistic: workPessimistic },
                wait: { optimistic: waitOptimistic, expected: waitExpected, pessimistic: waitPessimistic }
            });
        }
    });

    if (simulations > MAX_SIMULATIONS || programQuantity > MAX_PROGRAM_QUANTITY) {
        alert('Simulation parameters exceed allowed limits. Please correct the highlighted fields.');
        return;
    }

    if (tasks.length === 0) {
        alert('Please add at least one task');
        return;
    }

    const effortResults = [];
    const timelineResults = [];
    const capacityResults = [];
    const simulationData = [];

    const batchSize = 100;
    const totalBatches = Math.ceil(simulations / batchSize);

    for (let batch = 0; batch < totalBatches; batch++) {
        const batchStart = batch * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, simulations);

        for (let i = batchStart; i < batchEnd; i++) {
            const simulation = simulateProgram(tasks, programQuantity, hoursPerDay, weeklyCapacity);
            effortResults.push(simulation.totalEffort);
            timelineResults.push(simulation.totalTime);
            capacityResults.push(capacity - simulation.totalEffort);

            simulationData.push({
                index: i,
                effort: simulation.totalEffort,
                timeline: simulation.totalTime,
                workSchedule: simulation.workSchedule
            });
        }

        const progress = ((batch + 1) / totalBatches) * 100;
        updateProgress(progress);

        if (batch < totalBatches - 1) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }

    simulationData.sort((a, b) => a.timeline - b.timeline);
    effortResults.sort((a, b) => a - b);
    timelineResults.sort((a, b) => a - b);
    capacityResults.sort((a, b) => a - b);

    const effortMean = effortResults.reduce((sum, val) => sum + val, 0) / effortResults.length;
    const timelineMean = timelineResults.reduce((sum, val) => sum + val, 0) / timelineResults.length;

    const effortP10 = effortResults[Math.floor(effortResults.length * 0.1)];
    const effortP50 = effortResults[Math.floor(effortResults.length * 0.5)];
    const effortP90 = effortResults[Math.floor(effortResults.length * 0.9)];
    const effortConfidenceIndex = Math.floor(effortResults.length * confidence / 100);
    const effortConfidenceValue = effortResults[effortConfidenceIndex];

    const timelineP10 = timelineResults[Math.floor(timelineResults.length * 0.1)];
    const timelineP50 = timelineResults[Math.floor(timelineResults.length * 0.5)];
    const timelineP90 = timelineResults[Math.floor(timelineResults.length * 0.9)];
    const timelineConfidenceIndex = Math.floor(timelineResults.length * confidence / 100);
    const timelineConfidenceValue = timelineResults[timelineConfidenceIndex];

    const overCapacityCount = effortResults.filter(r => r > capacity).length;
    const overCapacityPercent = (overCapacityCount / effortResults.length) * 100;

    const confidenceSimulations = findConfidenceRangeSimulations(simulationData, timelineConfidenceValue, confidence);

    const debugInfo = {
        targetTimeline: timelineConfidenceValue,
        targetEffort: effortConfidenceValue,
        actualSimulations: confidenceSimulations.map(s => ({
            effort: s.effort.toFixed(1),
            timeline: s.timeline.toFixed(1)
        })),
        averageEffort: (confidenceSimulations.reduce((sum, s) => sum + s.effort, 0) / confidenceSimulations.length).toFixed(1)
    };
    console.log('Workload Debug:', debugInfo);

    const workloadData = calculateAggregatedWorkloadDistribution(confidenceSimulations, confidence, weeklyCapacity, debugInfo);

    displayResults({
        effort: {
            mean: effortMean.toFixed(1),
            p10: effortP10.toFixed(1),
            p50: effortP50.toFixed(1),
            p90: effortP90.toFixed(1),
            confidenceValue: effortConfidenceValue.toFixed(1)
        },
        timeline: {
            mean: timelineMean.toFixed(1),
            p10: timelineP10.toFixed(1),
            p50: timelineP50.toFixed(1),
            p90: timelineP90.toFixed(1),
            confidenceValue: timelineConfidenceValue.toFixed(1)
        },
        confidence: confidence,
        capacity: capacity,
        overCapacityPercent: overCapacityPercent.toFixed(1),
        effortResults: effortResults,
        timelineResults: timelineResults,
        capacityResults: capacityResults,
        workloadData: workloadData
    });
}

function displayResults(data) {
    const resultsDiv = document.getElementById('results');

    let capacityMessage = '';
    if (data.overCapacityPercent > 20) {
        capacityMessage = `<div class="capacity-warning">
                    <strong>⚠️ Capacity Risk:</strong> ${data.overCapacityPercent}% chance of exceeding available hours.
                    Consider reducing scope or increasing capacity.
                </div>`;
    } else if (data.overCapacityPercent > 5) {
        capacityMessage = `<div class="capacity-warning">
                    <strong>⚠️ Moderate Risk:</strong> ${data.overCapacityPercent}% chance of exceeding available hours.
                    Monitor closely and have contingency plans.
                </div>`;
    } else {
        capacityMessage = `<div class="capacity-good">
                    <strong>✅ Good Capacity:</strong> Only ${data.overCapacityPercent}% chance of exceeding available hours.
                    Reasonable buffer for unexpected work.
                </div>`;
    }

    resultsDiv.innerHTML = `
                <div class="results">
                    <h3>Simulation Results</h3>

                    <h4>Effort Analysis (person-hours)</h4>
                    <div class="results-grid">
                        <div class="metric">
                            <div class="metric-value">${data.effort.mean}</div>
                            <div class="metric-label">Mean Effort (hrs)</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${data.effort.p50}</div>
                            <div class="metric-label">Median (P50) hrs</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${data.effort.confidenceValue}</div>
                            <div class="metric-label">${data.confidence}% Confidence (hrs)</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${data.effort.p90}</div>
                            <div class="metric-label">P90 (Worst Case) hrs</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${data.capacity}</div>
                            <div class="metric-label">Available Capacity (hrs)</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${data.overCapacityPercent}%</div>
                            <div class="metric-label">Over Capacity Risk</div>
                        </div>
                    </div>
                    ${capacityMessage}

                    <h4>Timeline Analysis (days)</h4>
                    <div class="results-grid">
                        <div class="metric">
                            <div class="metric-value">${data.timeline.mean}</div>
                            <div class="metric-label">Mean Timeline</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${data.timeline.p50}</div>
                            <div class="metric-label">Median (P50)</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${data.timeline.confidenceValue}</div>
                            <div class="metric-label">${data.confidence}% Confidence</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${data.timeline.p90}</div>
                            <div class="metric-label">P90 (Worst Case)</div>
                        </div>
                    </div>

                    <div class="distribution-chart">
                        <canvas id="effortChart"></canvas>
                    </div>

                    <div class="distribution-chart">
                        <canvas id="timelineChart"></canvas>
                    </div>

                    <h4>Weekly Workload (${data.confidence}% Confidence Case - ${data.workloadData.simulationCount} simulations)</h4>
                    <div class="distribution-chart">
                        <canvas id="workloadChart"></canvas>
                    </div>

                    <div class="executive-summary">
                        <h3>Executive Summary</h3>
                        <div class="summary-grid">
                            <div class="summary-card">
                                <h4>Planning Scenarios</h4>
                                <div class="scenario-item">
                                    <span class="scenario-label">Most Likely Outcome:</span>
                                    <span class="scenario-value">${data.effort.p50} hours over ${data.timeline.p50} business days</span>
                                </div>
                                <div class="scenario-item">
                                    <span class="scenario-label">Conservative Planning:</span>
                                    <span class="scenario-value">${data.effort.confidenceValue} hours over ${data.timeline.confidenceValue} business days</span>
                                </div>
                                <div class="scenario-item">
                                    <span class="scenario-label">Contingency Planning:</span>
                                    <span class="scenario-value">${data.effort.p90} hours over ${data.timeline.p90} business days</span>
                                </div>
                            </div>

                            <div class="summary-card">
                                <h4>Resource Requirements</h4>
                                <div class="scenario-item">
                                    <span class="scenario-label">Expected Weekly Capacity:</span>
                                    <span class="scenario-value">${(data.workloadData.totalHours / data.workloadData.maxWeek).toFixed(1)} hours/week</span>
                                </div>
                                <div class="scenario-item">
                                    <span class="scenario-label">Peak Weekly Demand:</span>
                                    <span class="scenario-value">${Math.max(...data.workloadData.weeklyHours).toFixed(1)} hours</span>
                                </div>
                                <div class="scenario-item">
                                    <span class="scenario-label">Capacity Risk Level:</span>
                                    <span class="scenario-value risk-${data.overCapacityPercent > 20 ? 'high' : data.overCapacityPercent > 5 ? 'medium' : 'low'}">
                                        ${data.overCapacityPercent > 20 ? 'High' : data.overCapacityPercent > 5 ? 'Moderate' : 'Low'} (${data.overCapacityPercent}% chance of exceeding capacity)
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

    resultsDiv.style.display = 'block';
    createCharts(data.effortResults, data.timelineResults, data.capacity, data.workloadData);
}

function createCharts(effortResults, timelineResults, capacity, workloadData) {
    createEffortChart(effortResults, capacity);
    createTimelineChart(timelineResults);
    createWorkloadChart(workloadData);
}

function createEffortChart(results, capacity) {
    const ctx = document.getElementById('effortChart').getContext('2d');

    if (effortChart) {
        effortChart.destroy();
    }

    const histogram = createHistogram(results, 50);

    effortChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: histogram.labels,
            datasets: [{
                label: 'Frequency',
                data: histogram.data,
                backgroundColor: 'rgba(52, 152, 219, 0.6)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Total Effort Distribution (person-hours)'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Total Effort (person-hours)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Frequency'
                    }
                }
            }
        }
    });
}

function createTimelineChart(results) {
    const ctx = document.getElementById('timelineChart').getContext('2d');

    if (timelineChart) {
        timelineChart.destroy();
    }

    const histogram = createHistogram(results, 50);

    timelineChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: histogram.labels,
            datasets: [{
                label: 'Frequency',
                data: histogram.data,
                backgroundColor: 'rgba(46, 204, 113, 0.6)',
                borderColor: 'rgba(46, 204, 113, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Total Timeline Distribution'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Total Timeline (days)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Frequency'
                    }
                }
            }
        }
    });
}

function createHistogram(results, bins) {
    const min = Math.min(...results);
    const max = Math.max(...results);
    const binSize = (max - min) / bins;
    const histogram = new Array(bins).fill(0);

    results.forEach(value => {
        const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
        histogram[binIndex]++;
    });

    const labels = [];
    for (let i = 0; i < bins; i++) {
        labels.push((min + i * binSize).toFixed(1));
    }

    return { labels, data: histogram };
}

function createWorkloadChart(workloadData) {
    const ctx = document.getElementById('workloadChart').getContext('2d');

    if (workloadChart) {
        workloadChart.destroy();
    }

    if (!workloadData || !workloadData.weeklyHours || workloadData.weeklyHours.length === 0) {
        return;
    }

    const labels = [];
    for (let i = 0; i < workloadData.weeklyHours.length; i++) {
        labels.push(`Week ${i + 1}`);
    }

    const capacityLimits = new Array(workloadData.weeklyHours.length).fill(workloadData.weeklyCapacity);

    workloadChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Hours Required',
                data: workloadData.weeklyHours.map(h => h.toFixed(1)),
                backgroundColor: workloadData.weeklyHours.map(h =>
                    h > workloadData.weeklyCapacity ? 'rgba(231, 76, 60, 0.6)' : 'rgba(230, 126, 34, 0.6)'
                ),
                borderColor: workloadData.weeklyHours.map(h =>
                    h > workloadData.weeklyCapacity ? 'rgba(231, 76, 60, 1)' : 'rgba(230, 126, 34, 1)'
                ),
                borderWidth: 1
            }, {
                label: 'Weekly Capacity Limit',
                data: capacityLimits,
                type: 'line',
                borderColor: 'rgba(192, 57, 43, 1)',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Weekly Capacity Requirements (${workloadData.confidence}% Confidence - ${workloadData.simulationCount} simulations)`
                },
                legend: {
                    display: true
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Week'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Hours Required'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

function loadFromFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a file first');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = e.target.result;
        if (file.name.endsWith('.csv')) {
            parseCSV(data);
        }
    };

    if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
    }
}

export function parseCSV(data) {
    const result = Papa.parse(data, { header: true, skipEmptyLines: true });

    document.getElementById('tasks').innerHTML = '';

    const headers = result.meta.fields;
    for (const row of result.data) {
        const values = headers.map(h => row[h] ?? '');
        if (values.length >= 8 && values[0]) {
            addTaskFromData(values[0], values[1], values[2], values[3], values[4], values[5], values[6], values[7]);
        }
    }
}

export function addTaskFromData(name, skipPercentage, workOpt, workExp, workPess, waitOpt, waitExp, waitPess) {
    const tasksDiv = document.getElementById('tasks');
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-input';

    const inputSpecs = [
        [name,           { type: 'text' }],
        [skipPercentage, { type: 'number', min: '0', max: '95', step: '5' }],
        [workOpt,        { type: 'number', min: '0.1', step: '0.1' }],
        [workExp,        { type: 'number', min: '0.1', step: '0.1' }],
        [workPess,       { type: 'number', min: '0.1', step: '0.1' }],
        [waitOpt,        { type: 'number', min: '0', step: '0.1' }],
        [waitExp,        { type: 'number', min: '0', step: '0.1' }],
        [waitPess,       { type: 'number', min: '0', step: '0.1' }],
    ];

    for (const [value, attrs] of inputSpecs) {
        const input = document.createElement('input');
        for (const [attr, val] of Object.entries(attrs)) {
            input.setAttribute(attr, val);
        }
        input.value = value;
        taskDiv.appendChild(input);
    }

    const button = document.createElement('button');
    button.className = 'remove-btn';
    button.textContent = 'Remove';
    button.addEventListener('click', function() { removeTask(this); });
    taskDiv.appendChild(button);

    tasksDiv.appendChild(taskDiv);
    updateTaskLimitUI();
}

const CSV_EXPORT_HEADERS = ['Task Name', 'Skip %', 'Work Optimistic (hrs)', 'Work Expected (hrs)', 'Work Pessimistic (hrs)', 'Wait Optimistic (days)', 'Wait Expected (days)', 'Wait Pessimistic (days)'];

export function buildCSV(tasks) {
    return Papa.unparse({ fields: CSV_EXPORT_HEADERS, data: tasks }, { newline: '\r\n' });
}

function exportToFile() {
    const tasks = [];
    document.querySelectorAll('.task-input').forEach(taskDiv => {
        const inputs = taskDiv.querySelectorAll('input');
        const name = inputs[0].value;
        const skipPercentage = inputs[1].value;
        const workOpt = inputs[2].value;
        const workExp = inputs[3].value;
        const workPess = inputs[4].value;
        const waitOpt = inputs[5].value;
        const waitExp = inputs[6].value;
        const waitPess = inputs[7].value;

        if (name) {
            tasks.push([name, skipPercentage, workOpt, workExp, workPess, waitOpt, waitExp, waitPess]);
        }
    });

    const csvContent = buildCSV(tasks);

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timeline_planning_tasks.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

window.addEventListener('load', function() {
    document.getElementById('simulations').addEventListener('input', validateInputLimits);
    document.getElementById('programQuantity').addEventListener('input', validateInputLimits);
    setTimeout(runSimulation, 500);
});
