import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  addScreen,
  orphanScreens,
  parse,
  reachableScreens,
  removeScreen,
  renameScreen,
  validate,
  whatLinksHere,
} from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const VALID = readFileSync(resolve(here, 'fixtures', 'valid-todo.yaml'), 'utf8');

const parseValid = () => parse(VALID).parsed!;

describe('round-trip fidelity (R1.6, R6.1)', () => {
  it('parse → serialise preserves comments and content', () => {
    const out = parseValid().toString();
    expect(out).toContain('#  MAIN');
    expect(out).toContain('# inline comment survives edits');
    expect(validate(out).diagnostics).toEqual([]);
  });

  it('parse → rename → serialise changes only the renamed references', () => {
    const parsed = parseValid();
    const result = renameScreen(parsed, 'task_detail', 'task_details');
    expect(result.ok).toBe(true);
    // id + registry + flow + list_item target + data-free references
    expect(result.changes).toBeGreaterThanOrEqual(4);

    const out = parsed.toString();
    expect(out).toContain('#  MAIN'); // comments survive
    expect(out).toContain('# inline comment survives edits');
    expect(out).not.toContain('task_detail\n'); // no stale references
    expect(validate(out).diagnostics).toEqual([]); // still fully valid → nothing dangles

    // Minimal diff: every changed content line mentions the rename.
    // (Comment lines may be re-indented by the serialiser; they are not content.)
    const before = VALID.split('\n');
    const changed = out
      .split('\n')
      .filter((line) => !before.includes(line) && !line.trimStart().startsWith('#'));
    expect(changed.length).toBeGreaterThan(0);
    for (const line of changed) expect(line).toContain('task_details');
  });
});

describe('graph utilities (R6.1)', () => {
  it('computes reachability from primary nav and flow entries', () => {
    const doc = parseValid().data;
    const reachable = reachableScreens(doc);
    expect(reachable).toEqual(new Set(['home', 'settings', 'task_detail', 'task_new', 'about']));
    expect(orphanScreens(doc)).toEqual([]);
  });

  it('answers "what links here" with source and kind', () => {
    const doc = parseValid().data;
    const refs = whatLinksHere(doc, 'task_new');
    expect(refs.map((r) => [r.from, r.kind]).sort()).toEqual([
      ['home', 'element'],
      ['home', 'state_element'],
      ['task_detail', 'navigation.secondary'],
    ]);
  });
});

describe('edit operations (R6.1)', () => {
  it('renameScreen refuses collisions and invalid ids', () => {
    expect(renameScreen(parseValid(), 'home', 'settings').ok).toBe(false);
    expect(renameScreen(parseValid(), 'home', 'Home-Screen').ok).toBe(false);
    expect(renameScreen(parseValid(), 'ghost', 'anything').ok).toBe(false);
  });

  it('addScreen registers and validates cleanly', () => {
    const parsed = parseValid();
    const result = addScreen(
      parsed,
      {
        id: 'help',
        title: 'Help',
        type: 'informational',
        path: '/settings/help',
        description: 'FAQ and contact.',
      },
      { flow: 'settings' },
    );
    expect(result.ok).toBe(true);
    const out = parsed.toString();
    const validation = validate(out);
    // New screen is registered and in a flow; only expected finding is unreachability (nothing links to it yet).
    expect(validation.valid).toBe(true);
    expect(validation.diagnostics.map((d) => d.code)).toEqual(['MAIAS-W002']);
  });

  it('removeScreen is safe by default and cascades when asked', () => {
    const blocked = removeScreen(parseValid(), 'task_new');
    expect(blocked.ok).toBe(false);
    expect(blocked.inboundRefs.length).toBe(3);

    const parsed = parseValid();
    const removed = removeScreen(parsed, 'task_new', { cascade: true });
    expect(removed.ok).toBe(true);
    const out = parsed.toString();
    expect(out).not.toContain('task_new');
    expect(validate(out).diagnostics).toEqual([]);
  });
});
