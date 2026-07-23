import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { format, parse, validate } from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const VALID = readFileSync(resolve(here, 'fixtures', 'valid-todo.yaml'), 'utf8');

const fmt = (text: string) => format(parse(text).parsed!);

describe('canonical formatter (R6.2, spec ch. 11)', () => {
  it('is idempotent: fmt(fmt(x)) == fmt(x)', () => {
    const once = fmt(VALID);
    const twice = fmt(once);
    expect(twice).toBe(once);
  });

  it('output stays valid and keeps comments', () => {
    const out = fmt(VALID);
    const result = validate(out);
    expect(result.diagnostics).toEqual([]);
    expect(out).toContain('#  MAIN');
  });

  it('restores canonical key order', () => {
    const shuffled = VALID.replace(
      '  - id: about\n    title: About\n    type: informational\n    path: /settings/about\n',
      '  - path: /settings/about\n    id: about\n    type: informational\n    title: About\n',
    );
    const out = fmt(shuffled);
    expect(out).toContain('  - id: about\n    title: About\n    type: informational\n    path: /settings/about\n');
  });

  it('drops default values and legacy None placeholders', () => {
    const noisy = VALID.replace(
      '  - id: about\n    title: About\n',
      '  - id: about\n    deep_link: false\n    auth: none\n    actions:\n      - None\n    title: About\n',
    );
    const out = fmt(noisy);
    expect(out).not.toContain('deep_link: false');
    expect(out).not.toContain('auth: none');
    expect(out).not.toContain('- None');
  });

  it('collapses empty collections recursively (data: {reads: [], writes: []})', () => {
    const noisy = VALID.replace(
      '  - id: about\n    title: About\n',
      '  - id: about\n    data:\n      reads: []\n      writes: []\n    title: About\n',
    );
    const out = fmt(noisy);
    expect(out).not.toContain('reads: []');
    expect(out).not.toMatch(/id: about[\s\S]{0,200}?data:/);
  });

  it('expands inline (flow) collections to block style (spec §11.1)', () => {
    const inline = VALID.replace('      reads:\n        - tasks\n', '      reads: [tasks]\n');
    const out = fmt(inline);
    expect(out).not.toMatch(/\[\s*tasks\s*\]/);
    expect(out).toContain('      reads:\n        - tasks');
    expect(fmt(out)).toBe(out);
  });

  it('orders screens by flow membership', () => {
    // Move `about` (settings flow) before `home` (main flow) — fmt puts it back.
    const parsed = parse(VALID).parsed!;
    const screens = parsed.ydoc.getIn(['screens']) as { items: unknown[] };
    screens.items.unshift(screens.items.pop());
    const out = format(parsed);
    const order = [...out.matchAll(/^ {2}- id: ([a-z_]+)$/gm)].map((m) => m[1]);
    expect(order).toEqual(['home', 'task_detail', 'task_new', 'settings', 'about']);
  });

  it('keeps the version header double-quoted', () => {
    expect(fmt(VALID)).toContain('maias: "0.2"');
  });

  it('canonicalises JSON input as ordered JSON', () => {
    const json = JSON.stringify(parse(VALID).parsed!.data);
    const out = fmt(json);
    expect(out.trimStart().startsWith('{')).toBe(true);
    const keys = Object.keys(JSON.parse(out));
    expect(keys).toEqual(['maias', 'app', 'screens']);
    expect(validate(out).diagnostics).toEqual([]);
  });
});

describe('schema copy stays in sync with the canonical spec artifact', () => {
  it('src/maias-schema.gen.ts embeds exactly schema/maias.schema.json', async () => {
    const canonical = JSON.parse(readFileSync(resolve(here, '../../../schema/maias.schema.json'), 'utf8'));
    const { MAIAS_SCHEMA } = await import('../src/maias-schema.gen.js');
    expect(MAIAS_SCHEMA).toEqual(canonical);
  });
});
