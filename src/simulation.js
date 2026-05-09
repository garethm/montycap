function betaDistribution(alpha, beta) {
    const gamma1 = gammaRandom(alpha);
    const gamma2 = gammaRandom(beta);
    return gamma1 / (gamma1 + gamma2);
}

function gammaRandom(shape) {
    // Marsaglia and Tsang method
    if (shape < 1) {
        return gammaRandom(shape + 1) * Math.pow(Math.random(), 1 / shape);
    }

    const d = shape - 1/3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
        let x, v;
        do {
            x = normalRandom();
            v = 1 + c * x;
        } while (v <= 0);

        v = v * v * v;
        const u = Math.random();

        if (u < 1 - 0.0331 * x * x * x * x) {
            return d * v;
        }

        if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
            return d * v;
        }
    }
}

function normalRandom() {
    // Box-Muller transform
    const u = Math.random();
    const v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function generateTaskEffortHelper(optimistic, expected, pessimistic) {
    const range = pessimistic - optimistic;
    if (range <= 0) return expected;

    const mu = (optimistic + 4 * expected + pessimistic) / 6;
    const sigma = (pessimistic - optimistic) / 6;
    const variance = sigma * sigma;

    const muNorm = (mu - optimistic) / range;
    const varianceNorm = variance / (range * range);

    const temp = muNorm * (1 - muNorm) / varianceNorm - 1;
    const alpha = muNorm * temp;
    const beta = (1 - muNorm) * temp;

    const safeAlpha = Math.max(0.5, alpha);
    const safeBeta = Math.max(0.5, beta);

    const betaValue = betaDistribution(safeAlpha, safeBeta);
    return optimistic + betaValue * range;
}

function generateTaskEffort(optimistic, expected, pessimistic, skipPercentage = 0) {
    if (skipPercentage > 0) {
        if (Math.random() < (skipPercentage / 100)) {
            return 0;
        }
    }
    return generateTaskEffortHelper(optimistic, expected, pessimistic);
}

function simulateProgram(tasks, programQuantity, hoursPerDay = 8, weeklyCapacity = 40) {
    const workItems = [];
    let totalEffort = 0;
    const dailyCapacity = weeklyCapacity / 5;

    for (let series = 0; series < programQuantity; series++) {
        let seriesTime = 0;

        for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
            const task = tasks[taskIndex];

            if (task.skipPercentage > 0 && Math.random() < (task.skipPercentage / 100)) {
                continue;
            }

            const workEffortHours = generateTaskEffortHelper(task.work.optimistic, task.work.expected, task.work.pessimistic);
            const waitTimeDays = generateTaskEffortHelper(task.wait.optimistic, task.wait.expected, task.wait.pessimistic);

            const taskChunks = chunkTask({
                series: series,
                taskIndex: taskIndex,
                task: task.name,
                hours: workEffortHours,
                waitDays: waitTimeDays,
                earliestStart: seriesTime
            }, dailyCapacity, hoursPerDay);

            workItems.push(...taskChunks);
            seriesTime += (workEffortHours / hoursPerDay) + waitTimeDays;
            totalEffort += workEffortHours;
        }
    }

    const { scheduledItems, finalTimeline } = scheduleWithCapacityConstraints(workItems, weeklyCapacity, hoursPerDay);

    return {
        totalEffort: totalEffort,
        totalTime: finalTimeline,
        workSchedule: scheduledItems
    };
}

function chunkTask(taskItem, dailyCapacity, hoursPerDay = 8) {
    const maxChunkSize = Math.min(dailyCapacity, taskItem.hours);

    if (taskItem.hours <= maxChunkSize) {
        return [taskItem];
    }

    const chunks = [];
    let remainingHours = taskItem.hours;
    let chunkIndex = 0;
    let currentStart = taskItem.earliestStart;
    const totalChunks = Math.ceil(taskItem.hours / maxChunkSize);

    while (remainingHours > 0) {
        const chunkHours = Math.min(remainingHours, maxChunkSize);

        chunks.push({
            series: taskItem.series,
            taskIndex: taskItem.taskIndex,
            task: `${taskItem.task} (${chunkIndex + 1}/${totalChunks})`,
            hours: chunkHours,
            waitDays: chunkIndex === totalChunks - 1 ? taskItem.waitDays : 0,
            earliestStart: currentStart,
            isChunk: true,
            originalTask: taskItem.task,
            chunkIndex: chunkIndex,
            totalChunks: totalChunks
        });

        remainingHours -= chunkHours;
        chunkIndex++;
        currentStart += chunkHours / hoursPerDay;
    }

    return chunks;
}

function scheduleWithCapacityConstraints(workItems, weeklyCapacity, hoursPerDay) {
    workItems.sort((a, b) => {
        if (a.series !== b.series) return a.series - b.series;
        if (a.taskIndex !== b.taskIndex) return a.taskIndex - b.taskIndex;
        if (a.chunkIndex !== undefined && b.chunkIndex !== undefined) return a.chunkIndex - b.chunkIndex;
        return a.earliestStart - b.earliestStart;
    });

    const weeklyUsage = {};
    const scheduledItems = [];
    const seriesProgress = {};

    for (const item of workItems) {
        if (item.isChunk && item.chunkIndex > 0) {
            const previousChunks = scheduledItems.filter(si =>
                si.series === item.series &&
                si.taskIndex === item.taskIndex &&
                si.chunkIndex === item.chunkIndex - 1
            );

            if (previousChunks.length > 0) {
                item.earliestStart = Math.max(item.earliestStart, previousChunks[0].scheduledEnd);
            }
        }

        const seriesKey = item.series;
        if (seriesProgress[seriesKey]) {
            item.earliestStart = Math.max(item.earliestStart, seriesProgress[seriesKey]);
        }

        const scheduledItem = scheduleWorkItem(item, weeklyUsage, weeklyCapacity, hoursPerDay);
        scheduledItems.push(scheduledItem);
        seriesProgress[seriesKey] = scheduledItem.scheduledEnd + scheduledItem.waitDays;
    }

    const finalTimeline = Math.max(...scheduledItems.map(item => item.scheduledEnd + item.waitDays));

    return { scheduledItems, finalTimeline };
}

function scheduleWorkItem(item, weeklyUsage, weeklyCapacity, hoursPerDay) {
    let startDay = item.earliestStart;
    const workDays = item.hours / hoursPerDay;
    let attempts = 0;
    const maxAttempts = 52;

    while (attempts < maxAttempts) {
        if (canScheduleInPeriod(startDay, workDays, item.hours, weeklyUsage, weeklyCapacity)) {
            allocateCapacity(startDay, workDays, item.hours, weeklyUsage);
            break;
        } else {
            if (item.isChunk && item.hours <= weeklyCapacity / 5) {
                startDay += 1;
            } else {
                const currentWeek = Math.floor(startDay / 5);
                startDay = (currentWeek + 1) * 5;
            }
            attempts++;
        }
    }

    if (attempts >= maxAttempts) {
        console.warn(`Task '${item.task}' could not be scheduled within capacity constraints: requires ${item.hours} hours. Forcing schedule.`);
        allocateCapacity(startDay, workDays, item.hours, weeklyUsage);
    }

    return {
        series: item.series,
        taskIndex: item.taskIndex,
        task: item.task,
        scheduledStart: startDay,
        scheduledEnd: startDay + workDays,
        hours: item.hours,
        waitDays: item.waitDays,
        isChunk: item.isChunk,
        chunkIndex: item.chunkIndex,
        originalTask: item.originalTask
    };
}

function canScheduleInPeriod(startDay, workDays, hours, weeklyUsage, weeklyCapacity) {
    if (workDays <= 0 || hours <= 0) return true;

    const endDay = startDay + workDays;
    const startWeek = Math.floor(startDay / 5);
    const endWeek = Math.floor(endDay / 5);

    for (let week = startWeek; week <= endWeek; week++) {
        const weekStart = Math.max(startDay, week * 5);
        const weekEnd = Math.min(endDay, (week + 1) * 5);
        const workDaysInWeek = weekEnd - weekStart;

        if (workDaysInWeek <= 0) continue;

        const hoursInWeek = (workDaysInWeek / workDays) * hours;
        const tolerance = 0.01;
        const currentUsage = weeklyUsage[week] || 0;

        if (currentUsage + hoursInWeek > weeklyCapacity + tolerance) {
            return false;
        }
    }

    return true;
}

function allocateCapacity(startDay, workDays, hours, weeklyUsage) {
    if (workDays <= 0 || hours <= 0) return;

    const endDay = startDay + workDays;
    const startWeek = Math.floor(startDay / 5);
    const endWeek = Math.floor(endDay / 5);

    for (let week = startWeek; week <= endWeek; week++) {
        const weekStart = Math.max(startDay, week * 5);
        const weekEnd = Math.min(endDay, (week + 1) * 5);
        const workDaysInWeek = weekEnd - weekStart;

        if (workDaysInWeek <= 0) continue;

        const hoursInWeek = (workDaysInWeek / workDays) * hours;
        weeklyUsage[week] = (weeklyUsage[week] || 0) + hoursInWeek;
    }
}

function findConfidenceRangeSimulations(simulationData, confidenceTimeline, confidence) {
    const confidenceIndex = Math.floor(simulationData.length * confidence / 100);
    const rangeSize = Math.max(Math.floor(simulationData.length * 0.02), 5);

    const startIndex = Math.max(0, confidenceIndex - Math.floor(rangeSize / 2));
    const endIndex = Math.min(simulationData.length - 1, startIndex + rangeSize - 1);
    const rangeSimulations = simulationData.slice(startIndex, endIndex + 1);

    console.log('Confidence Range:', {
        targetIndex: confidenceIndex,
        rangeStart: startIndex,
        rangeEnd: endIndex,
        simulationsUsed: rangeSimulations.length,
        timelineRange: `${rangeSimulations[0]?.timeline.toFixed(1)} - ${rangeSimulations[rangeSimulations.length-1]?.timeline.toFixed(1)} days`,
        effortRange: `${Math.min(...rangeSimulations.map(s => s.effort)).toFixed(1)} - ${Math.max(...rangeSimulations.map(s => s.effort)).toFixed(1)} hours`
    });

    return rangeSimulations;
}

function calculateAggregatedWorkloadDistribution(confidenceSimulations, confidence, weeklyCapacity, debugInfo) {
    if (!confidenceSimulations || confidenceSimulations.length === 0) {
        return { weeklyHours: [], maxWeek: 0, weeklyCapacity: weeklyCapacity, simulationCount: 0 };
    }

    const allWorkloads = confidenceSimulations.map(sim =>
        calculateSingleWorkloadDistribution(sim.workSchedule)
    );

    const maxWeek = Math.max(...allWorkloads.map(w => w.maxWeek));
    const weeklyHoursSums = new Array(maxWeek).fill(0);
    const weeklyHoursCounts = new Array(maxWeek).fill(0);

    allWorkloads.forEach(workload => {
        workload.weeklyHours.forEach((hours, week) => {
            if (week < maxWeek) {
                weeklyHoursSums[week] += hours;
                weeklyHoursCounts[week] += 1;
            }
        });
    });

    const weeklyHours = weeklyHoursSums.map((sum, week) =>
        weeklyHoursCounts[week] > 0 ? sum / weeklyHoursCounts[week] : 0
    );

    const totalWorkloadHours = weeklyHours.reduce((sum, hours) => sum + hours, 0);
    console.log('Workload Total Check:', {
        weeklyHoursSum: totalWorkloadHours.toFixed(1),
        targetEffort: debugInfo.averageEffort,
        difference: (totalWorkloadHours - parseFloat(debugInfo.averageEffort)).toFixed(1)
    });

    return {
        weeklyHours: weeklyHours,
        maxWeek: maxWeek,
        confidence: confidence,
        weeklyCapacity: weeklyCapacity,
        simulationCount: confidenceSimulations.length,
        totalHours: totalWorkloadHours
    };
}

function calculateSingleWorkloadDistribution(targetSchedule) {
    if (!targetSchedule || targetSchedule.length === 0) {
        return { weeklyHours: [], maxWeek: 0 };
    }

    const maxDay = Math.max(...targetSchedule.map(item => item.scheduledEnd + item.waitDays));
    const maxWeek = Math.ceil(maxDay / 5);
    const weeklyHours = new Array(maxWeek).fill(0);

    targetSchedule.forEach(workItem => {
        const startWeek = Math.floor(workItem.scheduledStart / 5);
        const endWeek = Math.floor(workItem.scheduledEnd / 5);

        if (startWeek === endWeek) {
            weeklyHours[startWeek] += workItem.hours;
        } else {
            const totalWorkDays = workItem.scheduledEnd - workItem.scheduledStart;

            for (let week = startWeek; week <= endWeek; week++) {
                const weekStart = Math.max(workItem.scheduledStart, week * 5);
                const weekEnd = Math.min(workItem.scheduledEnd, (week + 1) * 5);
                const workDaysInWeek = weekEnd - weekStart;
                const hoursInWeek = (workDaysInWeek / totalWorkDays) * workItem.hours;
                weeklyHours[week] += hoursInWeek;
            }
        }
    });

    return { weeklyHours, maxWeek };
}
