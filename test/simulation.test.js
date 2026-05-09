import { describe, it } from 'vitest';
import fc from 'fast-check';
import {
    betaDistribution,
    gammaRandom,
    normalRandom,
    generateTaskEffortHelper,
    generateTaskEffort,
    canScheduleInPeriod,
    allocateCapacity,
} from '../src/simulation.js';

// Arbitrary for a positive parameter value (alpha, beta, shape)
const positiveParam = fc.double({ min: 0.5, max: 20, noNaN: true, noDefaultInfinity: true });

// Arbitrary for an ordered (opt, exp, pess) triple with opt < pess
const pertTriple = fc
    .tuple(
        fc.double({ min: 0.1, max: 500, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.1, max: 500, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.1, max: 500, noNaN: true, noDefaultInfinity: true })
    )
    .map(vals => vals.sort((a, b) => a - b))
    .filter(([opt, , pess]) => pess > opt);

describe('betaDistribution', () => {
    it('always returns a value in [0, 1]', () => {
        fc.assert(fc.property(positiveParam, positiveParam, (alpha, beta) => {
            const result = betaDistribution(alpha, beta);
            return result >= 0 && result <= 1;
        }));
    });
});

describe('gammaRandom', () => {
    it('always returns a positive finite value', () => {
        fc.assert(fc.property(positiveParam, (shape) => {
            const result = gammaRandom(shape);
            return result > 0 && isFinite(result);
        }));
    });

    it('also works for shape < 1', () => {
        fc.assert(fc.property(
            fc.double({ min: 0.01, max: 0.99, noNaN: true, noDefaultInfinity: true }),
            (shape) => {
                const result = gammaRandom(shape);
                return result > 0 && isFinite(result);
            }
        ));
    });
});

describe('normalRandom', () => {
    it('always returns a finite value', () => {
        fc.assert(fc.property(fc.constant(null), () => {
            const result = normalRandom();
            return isFinite(result);
        }));
    });
});

describe('generateTaskEffortHelper', () => {
    it('always returns a value within [optimistic, pessimistic]', () => {
        fc.assert(fc.property(pertTriple, ([opt, exp, pess]) => {
            const result = generateTaskEffortHelper(opt, exp, pess);
            return result >= opt && result <= pess;
        }));
    });

    it('returns expected when optimistic equals pessimistic', () => {
        fc.assert(fc.property(
            fc.double({ min: 0.1, max: 500, noNaN: true, noDefaultInfinity: true }),
            (value) => {
                const result = generateTaskEffortHelper(value, value, value);
                return result === value;
            }
        ));
    });
});

describe('generateTaskEffort', () => {
    it('returns 0 or a value within [optimistic, pessimistic]', () => {
        fc.assert(fc.property(
            pertTriple,
            fc.integer({ min: 0, max: 95 }),
            ([opt, exp, pess], skipPct) => {
                const result = generateTaskEffort(opt, exp, pess, skipPct);
                return result === 0 || (result >= opt && result <= pess);
            }
        ));
    });

    it('always returns 0 when skipPercentage is 100', () => {
        fc.assert(fc.property(pertTriple, ([opt, exp, pess]) => {
            return generateTaskEffort(opt, exp, pess, 100) === 0;
        }));
    });

    it('never returns 0 when skipPercentage is 0', () => {
        fc.assert(fc.property(pertTriple, ([opt, exp, pess]) => {
            return generateTaskEffort(opt, exp, pess, 0) > 0;
        }));
    });
});

describe('canScheduleInPeriod', () => {
    it('always returns true for zero-work items', () => {
        fc.assert(fc.property(
            fc.double({ min: 0, max: 100, noNaN: true }),
            fc.double({ min: 1, max: 80, noNaN: true }),
            (startDay, weeklyCapacity) => {
                return canScheduleInPeriod(startDay, 0, 0, {}, weeklyCapacity);
            }
        ));
    });

    it('returns false when weekly usage already equals capacity', () => {
        fc.assert(fc.property(
            fc.double({ min: 1, max: 40, noNaN: true, noDefaultInfinity: true }),
            (weeklyCapacity) => {
                const usage = { 0: weeklyCapacity };
                return !canScheduleInPeriod(0, 1, 1, usage, weeklyCapacity);
            }
        ));
    });
});

describe('allocateCapacity', () => {
    it('increases total weekly usage by exactly the hours allocated', () => {
        fc.assert(fc.property(
            fc.double({ min: 1, max: 40, noNaN: true, noDefaultInfinity: true }),
            fc.double({ min: 1, max: 8, noNaN: true, noDefaultInfinity: true }),
            (hours, hoursPerDay) => {
                const usage = {};
                const workDays = hours / hoursPerDay;
                allocateCapacity(0, workDays, hours, usage);
                const totalAllocated = Object.values(usage).reduce((sum, h) => sum + h, 0);
                return Math.abs(totalAllocated - hours) < 0.001;
            }
        ));
    });

    it('is a no-op for zero hours', () => {
        fc.assert(fc.property(fc.constant(null), () => {
            const usage = {};
            allocateCapacity(0, 0, 0, usage);
            return Object.keys(usage).length === 0;
        }));
    });
});
