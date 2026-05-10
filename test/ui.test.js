// @vitest-environment happy-dom
import { describe, it, beforeEach, expect } from 'vitest';
import fc from 'fast-check';
import { addTaskFromData, parseCSV, buildCSV } from '../src/ui.js';

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
});
