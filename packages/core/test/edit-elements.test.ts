import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { editElements, format, parse, validate, type ElementOp } from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const VALID = readFileSync(resolve(here, 'fixtures', 'valid-todo.yaml'), 'utf8');

const parseValid = () => parse(VALID).parsed!;

// Refusals must leave the document untouched. The serialiser re-indents some
// comment lines (they are not content — see roundtrip-edit.test.ts), so the
// byte-identity baseline is an untouched parse → serialise, not the raw file.
const BASELINE = parseValid().toString();

/** Apply ops to a fresh fixture parse, assert success, return the serialised YAML. */
function apply(screenId: string, ops: ElementOp[]): string {
  const parsed = parseValid();
  const result = editElements(parsed, screenId, ops);
  expect(result.ok, result.reason).toBe(true);
  expect(result.changes).toBe(ops.length);
  return parsed.toString();
}

/** Assert the op batch is refused and the document is byte-identical to the input. */
function refuse(screenId: string, ops: ElementOp[], reasonPart: string): void {
  const parsed = parseValid();
  const result = editElements(parsed, screenId, ops);
  expect(result.ok).toBe(false);
  expect(result.changes).toBe(0);
  expect(result.reason).toContain(reasonPart);
  expect(parsed.toString()).toBe(BASELINE);
}

describe('editElements — default list (R6.5)', () => {
  it('inserts at an index, in canonical key order', () => {
    const out = apply('home', [
      { op: 'insert', index: 1, element: { label: 'Filter', type: 'chips', target: 'settings' } },
    ]);
    expect(out).toContain('      - label: Filter\n        type: chips\n        target: settings\n');
    // Lands between the search bar and the first list item.
    expect(out.indexOf('label: Filter')).toBeGreaterThan(out.indexOf('type: search_bar'));
    expect(out.indexOf('label: Filter')).toBeLessThan(out.indexOf('label: Buy milk'));
    expect(validate(out).diagnostics).toEqual([]);
  });

  it('insert at list length appends', () => {
    const out = apply('home', [{ op: 'insert', index: 4, element: { label: 'Footer', type: 'caption' } }]);
    expect(out.indexOf('label: Footer')).toBeGreaterThan(out.indexOf('type: x_todo_confetti'));
    expect(validate(out).diagnostics).toEqual([]);
  });

  it('update patches only the given keys; x_ fields and siblings survive', () => {
    const out = apply('home', [
      { op: 'update', index: 2, expect: { type: 'button' }, set: { label: 'New task' } },
    ]);
    expect(out).toContain('label: New task');
    expect(out).not.toContain('label: Add task\n        type: button'); // old label gone (state copy remains)
    expect(out).toContain('x_analytics: tap_add'); // untouched sibling x_ field
    expect(out).toContain('presentation: modal');
    expect(validate(out).diagnostics).toEqual([]);
  });

  it('update adds a key in canonical position and null deletes a key', () => {
    const out = apply('home', [
      { op: 'update', index: 0, set: { target: 'task_new', presentation: null } },
    ]);
    // target emitted after type (canonical item order).
    expect(out).toContain('      - label: Search tasks\n        type: search_bar\n        target: task_new\n');
    expect(validate(out).diagnostics).toEqual([]);

    const dropped = apply('home', [{ op: 'update', index: 2, set: { presentation: null } }]);
    const homeBlock = dropped.slice(dropped.indexOf('- id: home'), dropped.indexOf('- id: task_detail'));
    expect(homeBlock).not.toContain('presentation: modal');
    expect(homeBlock).toContain('x_analytics: tap_add'); // sibling keys survive the deletion
    expect(validate(dropped).diagnostics).toEqual([]);
  });

  it('removes an element without touching its neighbours', () => {
    const out = apply('home', [{ op: 'remove', index: 1, expect: { label: 'Buy milk' } }]);
    expect(out).not.toContain('Buy milk');
    expect(out).toContain('type: search_bar');
    expect(out).toContain('x_analytics: tap_add');
    // Removing the only element targeting task_detail leaves it unreachable — expected, and only that.
    const validation = validate(out);
    expect(validation.valid).toBe(true);
    expect(validation.diagnostics.map((d) => d.code)).toEqual(['MAIAS-W002']);
  });

  it('moves an element to a final index', () => {
    const out = apply('home', [{ op: 'move', index: 0, to: 2, expect: { type: 'search_bar' } }]);
    expect(out.indexOf('type: search_bar')).toBeGreaterThan(out.indexOf('label: Buy milk'));
    expect(out.indexOf('type: search_bar')).toBeLessThan(out.indexOf('type: x_todo_confetti'));
    expect(validate(out).diagnostics).toEqual([]);
  });

  it('creates a missing elements key at its canonical key position', () => {
    // Empty the list (key drops per omit-empty), then insert — the key must come back before states.
    const out = apply('home', [
      { op: 'remove', index: 3 },
      { op: 'remove', index: 2 },
      { op: 'remove', index: 1 },
      { op: 'remove', index: 0 },
      { op: 'insert', index: 0, element: { label: 'Fresh start', type: 'empty_state' } },
    ]);
    expect(out).toContain('elements:\n      - label: Fresh start\n        type: empty_state\n');
    const home = out.slice(out.indexOf('- id: home'), out.indexOf('- id: task_detail'));
    expect(home.indexOf('elements:')).toBeGreaterThan(home.indexOf('description:'));
    expect(home.indexOf('elements:')).toBeLessThan(home.indexOf('states:'));
    // Dropping home's links makes task_detail unreachable — expected, and only that.
    const validation = validate(out);
    expect(validation.valid).toBe(true);
    expect(validation.diagnostics.map((d) => d.code)).toEqual(['MAIAS-W002']);
  });

  it('removing the last element omits the elements key (spec §11.1)', () => {
    const out = apply('about', [{ op: 'remove', index: 0 }]);
    const about = out.slice(out.indexOf('- id: about'));
    expect(about).not.toContain('elements:');
    expect(about).toContain('target: settings'); // back link untouched
    expect(validate(out).valid).toBe(true);
  });
});

describe('editElements — state lists (R6.5)', () => {
  it('edits a state list independently of the default list', () => {
    const out = apply('home', [
      { op: 'update', state: 'empty', index: 1, expect: { type: 'button' }, set: { label: 'Create your first task' } },
      { op: 'insert', state: 'empty', index: 0, element: { label: 'Import tasks', type: 'link', target: 'task_new' } },
      { op: 'move', state: 'empty', index: 0, to: 1 },
    ]);
    expect(out).toContain('label: Create your first task');
    expect(out).toContain('label: Import tasks');
    // Default list untouched.
    expect(out).toContain('label: Add task\n        type: button\n        target: task_new\n        presentation: modal');
    expect(validate(out).diagnostics).toEqual([]);
  });

  it('insert into a documentation-only state creates elements after description', () => {
    const out = apply('home', [
      { op: 'insert', state: 'loading', index: 0, element: { label: 'none', type: 'bullets' } },
    ]);
    expect(out).toContain(
      '      loading:\n        description: Tasks syncing from the server.\n        elements:\n          - label: none\n            type: bullets\n',
    );
    expect(validate(out).diagnostics).toEqual([]);
  });

  it('removing the last state element keeps the state, drops the elements key', () => {
    const out = apply('home', [
      { op: 'remove', state: 'empty', index: 1 },
      { op: 'remove', state: 'empty', index: 0 },
    ]);
    const states = out.slice(out.indexOf('states:'), out.indexOf('data:'));
    expect(states).toContain('description: First run, or all tasks deleted.');
    expect(states).not.toContain('empty_state');
    expect(out).toContain('elements:'); // default lists elsewhere untouched
    expect(validate(out).valid).toBe(true);
  });
});

describe('editElements — round-trip fidelity (R6.5, D10)', () => {
  it('preserves every comment and leaves unrelated lines byte-identical', () => {
    const parsed = parseValid();
    const result = editElements(parsed, 'home', [{ op: 'move', index: 1, to: 2 }]);
    expect(result.ok).toBe(true);

    const out = parsed.toString();
    expect(out).toContain('#  MAIN');
    expect(out).toContain('#  SETTINGS');
    expect(out).toContain('# inline comment survives edits');

    // Every changed content line belongs to the two swapped elements.
    const before = VALID.split('\n');
    const changed = out
      .split('\n')
      .filter((line) => !before.includes(line) && !line.trimStart().startsWith('#'));
    expect(changed).toEqual([]);
    expect(validate(out).diagnostics).toEqual([]);
  });

  it('fmt is idempotent over an edited document', () => {
    const parsed = parseValid();
    editElements(parsed, 'home', [
      { op: 'insert', index: 4, element: { label: 'Tips', type: 'link', target: 'about' } },
      { op: 'update', index: 0, set: { label: 'Search all tasks' } },
    ]);
    const once = format(parsed);
    const twice = format(parse(once).parsed!);
    expect(twice).toBe(once);
  });
});

describe('editElements — largest-example smoke (R6.5)', () => {
  it('one edit on the biggest example document diffs only the intended lines', () => {
    const source = readFileSync(resolve(here, '../../../examples/ecommerce/maias.yaml'), 'utf8');
    const parsed = parse(source).parsed!;
    const baseline = parse(source).parsed!.toString();
    const screen = parsed.data.screens.find((s) => (s.elements?.length ?? 0) >= 2)!;

    const result = editElements(parsed, screen.id, [
      { op: 'update', index: 0, set: { label: 'Smoke-test label' } },
    ]);
    expect(result.ok).toBe(true);

    const out = parsed.toString();
    const before = validate(source);
    const after = validate(out);
    expect(after.valid).toBe(true);
    expect(after.diagnostics.map((d) => d.code)).toEqual(before.diagnostics.map((d) => d.code));

    const baseLines = baseline.split('\n');
    const outLines = out.split('\n');
    expect(outLines.filter((l) => !baseLines.includes(l))).toEqual([
      expect.stringContaining('Smoke-test label'),
    ]);
    expect(baseLines.filter((l) => !outLines.includes(l))).toHaveLength(1);
  });
});

describe('editElements — refusals (R6.5)', () => {
  it('refuses a dangling target on insert and update', () => {
    refuse('home', [{ op: 'insert', index: 0, element: { label: 'Go', type: 'button', target: 'ghost' } }], "target 'ghost'");
    refuse('home', [{ op: 'update', index: 2, set: { target: 'ghost' } }], "target 'ghost'");
  });

  it('refuses out-of-range indices', () => {
    refuse('home', [{ op: 'insert', index: 5, element: { label: 'X', type: 'caption' } }], 'out of range');
    refuse('home', [{ op: 'update', index: 4, set: { label: 'X' } }], 'out of range');
    refuse('home', [{ op: 'remove', index: -1 }], 'non-negative');
    refuse('home', [{ op: 'move', index: 0, to: 4 }], "'to' 4 out of range");
  });

  it('refuses a guard mismatch, reporting what was found', () => {
    refuse('home', [{ op: 'remove', index: 0, expect: { type: 'button' } }], "found type 'search_bar'");
    refuse('home', [{ op: 'update', index: 1, expect: { label: 'Walk dog' }, set: { label: 'X' } }], 'guard mismatch');
  });

  it('refuses an undeclared state', () => {
    refuse(
      'task_detail',
      [{ op: 'insert', state: 'empty', index: 0, element: { label: 'X', type: 'caption' } }],
      "does not declare state 'empty'",
    );
  });

  it('refuses malformed ops', () => {
    refuse('home', [{ op: 'update', index: 0, set: {} }], 'at least one key');
    refuse('home', [{ op: 'update', index: 0, set: { type: null } }], "'type' cannot be deleted");
    refuse('home', [{ op: 'insert', index: 0, element: { label: 'X' } as never }], "non-empty 'type'");
    refuse('ghost', [{ op: 'remove', index: 0 }], "No screen with id 'ghost'");
    expect(editElements(parseValid(), 'home', []).ok).toBe(false);
  });

  it('a failing op mid-batch leaves the document untouched', () => {
    refuse(
      'home',
      [
        { op: 'remove', index: 3 },
        { op: 'insert', index: 0, element: { label: 'OK', type: 'caption' } },
        { op: 'update', index: 9, set: { label: 'boom' } },
      ],
      'op 2 (update)',
    );
  });
});
