// @vitest-environment happy-dom
import { describe, it, beforeEach, expect } from 'vitest';
import fc from 'fast-check';
import { addTaskFromData, parseCSV, buildCSV, sanitizeCsvCell, unsanitizeCsvCell } from '../src/ui.js';

const EVENT_HANDLER_ATTRS = [
    'onabort', 'onblur', 'onchange', 'onclick', 'onclose', 'oncontextmenu',
    'ondblclick', 'onerror', 'onfocus', 'oninput', 'onkeydown', 'onkeypress',
    'onkeyup', 'onload', 'onmousedown', 'onmousemove', 'onmouseout',
    'onmouseover', 'onmouseup', 'onreset', 'onresize', 'onscroll',
    'onselect', 'onsubmit', 'onunload',
];

const EXPECTED_TAG_NAMES = new Set(['INPUT', 'BUTTON']);

function hasEventHandlerAttribute(element) {
    return EVENT_HANDLER_ATTRS.some(attr => element.hasAttribute(attr));
}


function taskDivChildren(taskDiv) {
    return [...taskDiv.children];
}

const CSV_HEADERS = ['Task Name', 'Skip %', 'Work Opt', 'Work Exp', 'Work Pess', 'Wait Opt', 'Wait Exp', 'Wait Pess'];

function makeCSV(name) {
    return Papa.unparse({ fields: CSV_HEADERS, data: [[name, '0', '1', '2', '3', '0', '0', '0']] });
}

beforeEach(() => {
    document.body.innerHTML = '<div id="tasks"></div>';
});

describe('addTaskFromData', () => {
    it('children are exactly 8 inputs followed by 1 button for any name', () => {
        fc.assert(fc.property(fc.string(), (name) => {
            document.body.innerHTML = '<div id="tasks"></div>';
            addTaskFromData(name, '0', '1', '2', '3', '0', '0', '0');
            const children = taskDivChildren(document.querySelector('.task-input'));
            return (
                children.length === 9 &&
                children.slice(0, 8).every(el => el.tagName === 'INPUT') &&
                children[8].tagName === 'BUTTON'
            );
        }));
    });

    it('no event handler attributes on any input element for any name', () => {
        fc.assert(fc.property(fc.string(), (name) => {
            document.body.innerHTML = '<div id="tasks"></div>';
            addTaskFromData(name, '0', '1', '2', '3', '0', '0', '0');
            const inputs = document.querySelectorAll('.task-input input');
            return [...inputs].every(el => !hasEventHandlerAttribute(el));
        }));
    });
});

describe('parseCSV', () => {
    it('only input and button elements appear in task divs for any name', () => {
        fc.assert(fc.property(fc.string().filter(s => !s.includes('\n')), (name) => {
            document.body.innerHTML = '<div id="tasks"></div>';
            parseCSV(makeCSV(name));
            const taskDiv = document.querySelector('.task-input');
            if (!taskDiv) return true;
            return taskDivChildren(taskDiv).every(el => EXPECTED_TAG_NAMES.has(el.tagName));
        }));
    });

    it('no event handler attributes on any input element for any name', () => {
        fc.assert(fc.property(fc.string().filter(s => !s.includes('\n')), (name) => {
            document.body.innerHTML = '<div id="tasks"></div>';
            parseCSV(makeCSV(name));
            const inputs = document.querySelectorAll('.task-input input');
            return [...inputs].every(el => !hasEventHandlerAttribute(el));
        }));
    });

    it('preserves task name containing a comma', () => {
        parseCSV(makeCSV('Design, build, test'));
        const nameInput = document.querySelector('.task-input input');
        expect(nameInput.value).toBe('Design, build, test');
    });

    it('preserves task name containing a double-quote', () => {
        parseCSV(makeCSV('Say "hello"'));
        const nameInput = document.querySelector('.task-input input');
        expect(nameInput.value).toBe('Say "hello"');
    });

    it('accepts CRLF line endings', () => {
        const crlf = CSV_HEADERS.join(',') + '\r\n' + '"My task",0,1,2,3,0,0,0\r\n';
        parseCSV(crlf);
        const nameInput = document.querySelector('.task-input input');
        expect(nameInput.value).toBe('My task');
    });
});

const EXPORT_HEADERS = 'Task Name,Skip %,Work Optimistic (hrs),Work Expected (hrs),Work Pessimistic (hrs),Wait Optimistic (days),Wait Expected (days),Wait Pessimistic (days)';
const SIMPLE_TASK = ['My task', '10', '1', '2', '3', '0.5', '1', '2'];

describe('buildCSV', () => {
    it('first row is the header', () => {
        const rows = buildCSV([]).split('\r\n');
        expect(rows[0]).toBe(EXPORT_HEADERS);
    });

    it('produces one data row per task', () => {
        const csv = buildCSV([SIMPLE_TASK, SIMPLE_TASK]);
        const rows = csv.split('\r\n').filter(r => r.length > 0);
        expect(rows).toHaveLength(3); // header + 2 data rows
    });

    it('plain name and numeric fields round-trip through Papa.parse', () => {
        const csv = buildCSV([SIMPLE_TASK]);
        const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
        expect(parsed.data[0]['Task Name']).toBe('My task');
        expect(parsed.data[0]['Skip %']).toBe('10');
    });

    it('task name containing a comma round-trips correctly', () => {
        const csv = buildCSV([['Design, build, test', '0', '1', '2', '3', '0', '0', '0']]);
        const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
        expect(parsed.data[0]['Task Name']).toBe('Design, build, test');
    });

    // RFC 4180 compliance — these will fail until the PapaParse implementation lands
    it('uses CRLF line terminators (RFC 4180)', () => {
        const csv = buildCSV([SIMPLE_TASK]);
        expect(csv).toContain('\r\n');
    });

    it('escapes double-quotes in task names as "" (RFC 4180)', () => {
        const csv = buildCSV([['Say "hello"', '0', '1', '2', '3', '0', '0', '0']]);
        const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
        expect(parsed.data[0]['Task Name']).toBe('Say "hello"');
    });

    it.each(['=', '+', '-', '@', '\t', '\r', "'"])('sanitizes task name starting with %s', (prefix) => {
        const csv = buildCSV([[`${prefix}DANGEROUS`, '0', '1', '2', '3', '0', '0', '0']]);
        const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
        expect(parsed.data[0]['Task Name']).toBe(`'${prefix}DANGEROUS`);
    });

    it('does not alter task names that do not start with an injection prefix', () => {
        const csv = buildCSV([['Normal task', '0', '1', '2', '3', '0', '0', '0']]);
        const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
        expect(parsed.data[0]['Task Name']).toBe('Normal task');
    });
});

describe('sanitizeCsvCell', () => {
    it.each(['=', '+', '-', '@', '\t', '\r', "'"])('prepends a quote to values starting with %s', (prefix) => {
        expect(sanitizeCsvCell(`${prefix}cmd`)).toBe(`'${prefix}cmd`);
    });

    it('does not alter safe values', () => {
        expect(sanitizeCsvCell('My task')).toBe('My task');
        expect(sanitizeCsvCell('')).toBe('');
        expect(sanitizeCsvCell('hello world')).toBe('hello world');
    });

    it('does not alter numeric values', () => {
        expect(sanitizeCsvCell(42)).toBe(42);
    });
});

// Characters that spreadsheet readers treat as formula starters.
const INJECTION_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];
// Full set of characters that trigger escaping on export. Extends INJECTION_PREFIXES with the
// escape character itself so the scheme round-trips cleanly with no ambiguous zone.
const ESCAPE_REQUIRED_PREFIXES = [...INJECTION_PREFIXES, "'"];
const startsWithEscapePrefix = s => ESCAPE_REQUIRED_PREFIXES.some(p => s.startsWith(p));

describe('sanitizeCsvCell (property-based)', () => {
    it('result never starts with a formula-execution character', () => {
        // The escape character \''\'' may appear at the start of the output — that is intentional.
        // Only formula-execution characters (INJECTION_PREFIXES) must never appear unescaped.
        fc.assert(fc.property(fc.string(), (s) => {
            const result = sanitizeCsvCell(s);
            return typeof result !== 'string' || !INJECTION_PREFIXES.some(p => result.startsWith(p));
        }));
    });

    it('output is the same length as input or exactly one character longer', () => {
        fc.assert(fc.property(fc.string(), (s) => {
            const result = sanitizeCsvCell(s);
            return typeof result !== 'string' ||
                result.length === s.length || result.length === s.length + 1;
        }));
    });

    it('strings not starting with an escape-required prefix are returned unchanged', () => {
        fc.assert(fc.property(
            fc.string().filter(s => !startsWithEscapePrefix(s)),
            (s) => sanitizeCsvCell(s) === s
        ));
    });

    it('strings starting with an escape-required prefix gain exactly one leading quote', () => {
        fc.assert(fc.property(
            fc.constantFrom(...ESCAPE_REQUIRED_PREFIXES).chain(p => fc.string().map(rest => p + rest)),
            (s) => sanitizeCsvCell(s) === "'" + s
        ));
    });

    it('non-string values pass through unchanged', () => {
        fc.assert(fc.property(
            fc.oneof(fc.integer(), fc.float({ noNaN: true }), fc.boolean()),
            (v) => sanitizeCsvCell(v) === v
        ));
    });
});

describe('unsanitizeCsvCell (property-based)', () => {
    it('is a left-inverse of sanitize for all strings', () => {
        // Including \''\'' in ESCAPE_REQUIRED_PREFIXES eliminates any ambiguous zone:
        // a name starting with \'\'= exports as \'\'\'= and restores to \'\'=, so the
        // round-trip is identity for every possible input without exception.
        fc.assert(fc.property(fc.string(), (s) => unsanitizeCsvCell(sanitizeCsvCell(s)) === s));
    });

    it('strings not starting with the escape digraph pass through unchanged', () => {
        // The escape digraph is \'\'<escape-required-prefix>. Anything else is untouched.
        fc.assert(fc.property(
            fc.string().filter(s => !(s.length > 1 && s[0] === "'" && startsWithEscapePrefix(s.slice(1)))),
            (s) => unsanitizeCsvCell(s) === s
        ));
    });
});

describe('CSV injection round-trip', () => {
    it('task name starting with = survives export then import unchanged', () => {
        const original = '=HYPERLINK("http://evil.example","click")';
        const csv = buildCSV([[original, '0', '1', '2', '3', '0', '0', '0']]);
        parseCSV(csv);
        const nameInput = document.querySelector('.task-input input[type="text"]');
        expect(nameInput.value).toBe(original);
    });

    it('task name starting with apostrophe round-trips correctly', () => {
        const original = "'twas a dark night";
        const csv = buildCSV([[original, '0', '1', '2', '3', '0', '0', '0']]);
        parseCSV(csv);
        const nameInput = document.querySelector('.task-input input[type="text"]');
        expect(nameInput.value).toBe(original);
    });
});
