import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CODES, validate } from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => readFileSync(resolve(here, 'fixtures', name), 'utf8');
const VALID = fixture('valid-todo.yaml');

const codes = (source: string) => validate(source).diagnostics.map((d) => d.code);

describe('validate: valid documents', () => {
  it('accepts the valid fixture with zero diagnostics', () => {
    const result = validate(VALID);
    expect(result.diagnostics).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('accepts the equivalent JSON document identically', () => {
    const json = JSON.stringify(validate(VALID).parsed!.data, null, 2);
    const result = validate(json);
    expect(result.diagnostics).toEqual([]);
    expect(result.valid).toBe(true);
  });
});

describe('validate: schema layer', () => {
  it('rejects an unquoted numeric maias header', () => {
    const result = validate(VALID.replace('maias: "0.2"', 'maias: 0.2'));
    expect(result.valid).toBe(false);
    expect(codes(VALID.replace('maias: "0.2"', 'maias: 0.2'))).toContain(CODES.SCHEMA);
  });

  it('rejects unknown keys without x_ prefix (typo protection)', () => {
    const result = validate(VALID.replace('description: All tasks, newest first.', 'descripton: typo'));
    expect(result.valid).toBe(false);
  });

  it('rejects malformed paths', () => {
    const result = validate(VALID.replace('path: /settings/about', 'path: settings/About'));
    expect(result.valid).toBe(false);
  });

  it('reports line numbers for schema errors', () => {
    const broken = VALID.replace('path: /settings/about', 'path: About');
    const diag = validate(broken).diagnostics.find((d) => d.code === CODES.SCHEMA);
    expect(diag?.line).toBeGreaterThan(0);
  });
});

describe('validate: lint rules', () => {
  it('E003: flags dangling targets (the register-apple bug class) with line refs', () => {
    const result = validate(fixture('invalid-dangling.yaml'));
    expect(result.valid).toBe(false);
    const dangling = result.diagnostics.filter((d) => d.code === CODES.DANGLING_TARGET);
    expect(dangling.length).toBeGreaterThanOrEqual(1);
    expect(dangling[0].message).toContain('register_apple');
    expect(dangling[0].line).toBeGreaterThan(0);
    // the kebab-case one is caught by the schema pattern
    expect(result.diagnostics.some((d) => d.code === CODES.SCHEMA)).toBe(true);
  });

  it('E003: flags dangling back targets (since 0.2)', () => {
    const broken = VALID.replace('    back:\n      target: home\n', '    back:\n      target: ghost_screen\n');
    const result = validate(broken);
    expect(result.valid).toBe(false);
    const dangling = result.diagnostics.find((d) => d.code === CODES.DANGLING_TARGET);
    expect(dangling?.message).toContain('ghost_screen');
    expect(dangling?.message).toContain('back');
  });

  it('E001: flags duplicate screen ids', () => {
    const dup = VALID.replace('- id: about', '- id: settings');
    expect(codes(dup)).toContain(CODES.DUPLICATE_ID);
  });

  it('E002: flags colliding parameterised paths', () => {
    const collide = VALID.replace('path: /tasks/new', 'path: /tasks/:task_id');
    expect(codes(collide)).toContain(CODES.DUPLICATE_PATH);
  });

  it('E004: flags flow entry_screen not listed in its screens', () => {
    const broken = VALID.replace(
      'entry_screen: settings\n      screens:\n        - settings',
      'entry_screen: settings\n      screens:\n        - home',
    );
    expect(codes(broken)).toContain(CODES.FLOW_ENTRY);
  });

  it('E005: flags unknown screens in flows', () => {
    const broken = VALID.replace(
      '        - settings\n        - about\n',
      '        - settings\n        - about\n        - ghost\n',
    );
    expect(codes(broken)).toContain(CODES.FLOW_UNKNOWN_SCREEN);
  });

  it('E006: flags screens missing from the navigation registry', () => {
    const broken = VALID.replace('        - about\n  flows:', '  flows:');
    expect(codes(broken)).toContain(CODES.UNREGISTERED_SCREEN);
  });

  it('E007: flags screens registered in both groups', () => {
    const broken = VALID.replace('        - task_detail\n', '        - task_detail\n        - home\n');
    expect(codes(broken)).toContain(CODES.DOUBLY_REGISTERED_SCREEN);
  });

  it('E008: flags registry entries for unknown screens', () => {
    const broken = VALID.replace('        - about\n  flows:', '        - about\n        - ghost\n  flows:');
    expect(codes(broken)).toContain(CODES.REGISTRY_UNKNOWN_SCREEN);
  });

  it('E009: flags duplicate flow names', () => {
    const broken = VALID.replace('- name: settings', '- name: main');
    expect(codes(broken)).toContain(CODES.DUPLICATE_FLOW);
  });

  it('W001: warns on missing screen description without invalidating', () => {
    const broken = VALID.replace('    description: Version and legal info.\n', '');
    const result = validate(broken);
    expect(result.valid).toBe(true);
    expect(result.diagnostics.map((d) => d.code)).toContain(CODES.MISSING_DESCRIPTION);
  });

  it('W002/W003: warns on unreachable and orphan screens', () => {
    // Cut the settings→about link: about stays in a flow → unreachable, not orphan.
    const unreachable = VALID.replace('        type: list_item\n        target: about\n', '        type: list_item\n');
    expect(codes(unreachable)).toContain(CODES.UNREACHABLE_SCREEN);

    // Also remove it from its flow → orphan.
    const orphan = unreachable.replace('      screens:\n        - settings\n        - about', '      screens:\n        - settings');
    expect(codes(orphan)).toContain(CODES.ORPHAN_SCREEN);
  });

  it('W004: warns on self-referencing targets', () => {
    const broken = VALID.replace('        target: about\n', '        target: settings\n');
    expect(codes(broken)).toContain(CODES.SELF_TARGET);
  });

  it('W005: warns on unknown element types without x_ prefix', () => {
    const broken = VALID.replace('type: search_bar', 'type: serach_bar');
    const result = validate(broken);
    expect(result.valid).toBe(true);
    expect(result.diagnostics.map((d) => d.code)).toContain(CODES.UNKNOWN_ELEMENT_TYPE);
  });

  it('W006: warns on deep_link without an app scheme', () => {
    const broken = VALID.replace('  links:\n    scheme: todo\n', '');
    expect(codes(broken)).toContain(CODES.DEEP_LINK_NO_SCHEME);
  });

  it('W008: warns on action_sheet screens without presentation', () => {
    const broken = VALID.replace('    type: menu', '    type: action_sheet');
    expect(codes(broken)).toContain(CODES.SHEET_PRESENTATION);
  });

  it('W009: warns on back (0.2 feature) under maias: "0.1" — and not under "0.2"', () => {
    const downgraded = VALID.replace('maias: "0.2"', 'maias: "0.1"');
    const result = validate(downgraded);
    const w009 = result.diagnostics.filter((d) => d.code === CODES.VERSION_FEATURE_MISMATCH);
    expect(w009.length).toBe(3); // one per back-declaring screen in the fixture
    expect(result.valid).toBe(true); // warning, not error
    expect(codes(VALID)).not.toContain(CODES.VERSION_FEATURE_MISMATCH);
  });
});
