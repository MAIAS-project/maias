import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { run } from '../src/main.js';

const here = dirname(fileURLToPath(import.meta.url));
const VALID_FIXTURE = resolve(here, '../../core/test/fixtures/valid-todo.yaml');
const INVALID_FIXTURE = resolve(here, '../../core/test/fixtures/invalid-dangling.yaml');

function exec(argv: string[]) {
  const out: string[] = [];
  const err: string[] = [];
  const code = run(argv, { out: (l) => out.push(l), err: (l) => err.push(l) });
  return { code, out: out.join('\n'), err: err.join('\n') };
}

describe('maias validate (R2.1, R2.4)', () => {
  it('exits 0 on a valid file', () => {
    const { code, out } = exec(['validate', VALID_FIXTURE]);
    expect(code).toBe(0);
    expect(out).toContain('valid (0 warnings)');
  });

  it('exits non-zero with file:line:col human output on an invalid file', () => {
    const { code, out } = exec(['validate', INVALID_FIXTURE]);
    expect(code).toBe(1);
    expect(out).toMatch(/invalid-dangling\.yaml:\d+:\d+ error MAIAS-E003 .*register_apple/);
    expect(out).toContain('invalid —');
  });

  it('emits the stable JSON shape with --json', () => {
    const { code, out } = exec(['validate', INVALID_FIXTURE, '--json']);
    expect(code).toBe(1);
    const parsed = JSON.parse(out);
    expect(parsed.valid).toBe(false);
    expect(parsed.diagnostics[0]).toMatchObject({
      code: expect.stringMatching(/^MAIAS-/),
      severity: expect.stringMatching(/^(error|warning)$/),
      message: expect.any(String),
      path: expect.any(Array),
    });
  });

  it('exits 2 on usage and IO errors', () => {
    expect(exec(['validate']).code).toBe(2);
    expect(exec(['validate', '/nonexistent.yaml']).code).toBe(2);
    expect(exec(['bogus-command']).code).toBe(2);
  });
});

describe('maias fmt (R6.2)', () => {
  it('--check exits 1 on non-canonical, 0 once formatted (idempotence at the CLI level)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'maias-'));
    const file = join(dir, 'doc.yaml');
    const noisy = readFileSync(VALID_FIXTURE, 'utf8').replace(
      '  - id: about\n    title: About\n',
      '  - id: about\n    deep_link: false\n    title: About\n',
    );
    writeFileSync(file, noisy);

    expect(exec(['fmt', file, '--check']).code).toBe(1);
    expect(exec(['fmt', file, '--write']).code).toBe(0);
    expect(exec(['fmt', file, '--check']).code).toBe(0);
    expect(readFileSync(file, 'utf8')).not.toContain('deep_link: false');
  });

  it('refuses to format invalid documents', () => {
    const { code, err } = exec(['fmt', INVALID_FIXTURE]);
    expect(code).toBe(2);
    expect(err).toContain('refusing to format');
  });
});

describe('maias rename (R5.2 support)', () => {
  it('renames with cascade and the file validates clean', () => {
    const dir = mkdtempSync(join(tmpdir(), 'maias-'));
    const file = join(dir, 'doc.yaml');
    writeFileSync(file, readFileSync(VALID_FIXTURE, 'utf8'));

    const { code, out } = exec(['rename', file, 'task_detail', 'task_view']);
    expect(code).toBe(0);
    expect(out).toContain("'task_detail' → 'task_view'");
    expect(readFileSync(file, 'utf8')).not.toContain('task_detail');
    expect(exec(['validate', file]).code).toBe(0);
  });

  it('refuses collisions and missing screens', () => {
    const dir = mkdtempSync(join(tmpdir(), 'maias-'));
    const file = join(dir, 'doc.yaml');
    writeFileSync(file, readFileSync(VALID_FIXTURE, 'utf8'));
    expect(exec(['rename', file, 'home', 'settings']).code).toBe(1);
    expect(exec(['rename', file, 'ghost', 'anything']).code).toBe(1);
    expect(exec(['rename', file]).code).toBe(2);
  });
});
