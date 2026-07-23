import { readFileSync, writeFileSync } from 'node:fs';
import { format, hasErrors, parse, renameScreen, validate, type Diagnostic } from '@maias/core';

export interface Io {
  out(line: string): void;
  err(line: string): void;
}

const USAGE = `maias — tooling for MAIAS (Mobile App Information Architecture Schema) documents

Usage:
  maias validate <file> [--json]     Schema + semantic lint. Exit 1 on errors (warnings pass).
  maias fmt <file> [--write|--check] Canonical formatting. Default prints to stdout;
                                    --write updates the file; --check exits 1 if not canonical.
  maias rename <file> <old> <new>    Rename a screen id, cascading to flows, the navigation
                                    registry, and every target. Writes canonical form.

Spec: docs/spec/ · condensed reference: docs/spec/llms.txt`;

/** Runs the CLI. Returns the process exit code: 0 ok, 1 findings, 2 usage/IO error. */
export function run(argv: string[], io: Io): number {
  const [command, ...rest] = argv;
  switch (command) {
    case 'validate':
      return runValidate(rest, io);
    case 'fmt':
      return runFmt(rest, io);
    case 'rename':
      return runRename(rest, io);
    case undefined:
    case '--help':
    case '-h':
    case 'help':
      io.out(USAGE);
      return command ? 0 : 2;
    default:
      io.err(`Unknown command '${command}'\n\n${USAGE}`);
      return 2;
  }
}

function runValidate(args: string[], io: Io): number {
  const json = args.includes('--json');
  const files = args.filter((a) => !a.startsWith('--'));
  if (files.length === 0) {
    io.err('validate: no file given\n\n' + USAGE);
    return 2;
  }

  let exit = 0;
  for (const file of files) {
    const text = readFile(file, io);
    if (text === undefined) return 2;
    const result = validate(text);
    if (!result.valid) exit = 1;

    if (json) {
      io.out(JSON.stringify({ file, valid: result.valid, diagnostics: result.diagnostics }, null, 2));
    } else {
      for (const d of result.diagnostics) io.out(renderDiagnostic(file, d));
      const errors = result.diagnostics.filter((d) => d.severity === 'error').length;
      const warnings = result.diagnostics.length - errors;
      io.out(
        result.valid
          ? `${file}: valid (${warnings} warning${warnings === 1 ? '' : 's'})`
          : `${file}: invalid — ${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}`,
      );
    }
  }
  return exit;
}

function runFmt(args: string[], io: Io): number {
  const write = args.includes('--write');
  const check = args.includes('--check');
  const files = args.filter((a) => !a.startsWith('--'));
  if (files.length === 0 || (write && check)) {
    io.err('fmt: pass a file and at most one of --write / --check\n\n' + USAGE);
    return 2;
  }

  let exit = 0;
  for (const file of files) {
    const text = readFile(file, io);
    if (text === undefined) return 2;
    const parsed = parse(text);
    if (!parsed.parsed) {
      for (const d of parsed.diagnostics) io.err(renderDiagnostic(file, d));
      return 2;
    }
    // Formatting must not proceed past schema/lint errors it could scramble.
    const validation = validate(parsed.parsed);
    if (hasErrors(validation.diagnostics)) {
      io.err(`${file}: refusing to format an invalid document — run 'maias validate' first`);
      return 2;
    }
    const canonical = format(parsed.parsed);
    if (check) {
      if (canonical !== text) {
        io.out(`${file}: not canonical`);
        exit = 1;
      }
    } else if (write) {
      if (canonical !== text) writeFileSync(file, canonical);
      io.out(`${file}: ${canonical === text ? 'already canonical' : 'formatted'}`);
    } else {
      io.out(canonical);
    }
  }
  return exit;
}

function runRename(args: string[], io: Io): number {
  const [file, oldId, newId] = args.filter((a) => !a.startsWith('--'));
  if (!file || !oldId || !newId) {
    io.err('rename: usage — maias rename <file> <old_id> <new_id>\n\n' + USAGE);
    return 2;
  }
  const text = readFile(file, io);
  if (text === undefined) return 2;
  const parsed = parse(text);
  if (!parsed.parsed) {
    for (const d of parsed.diagnostics) io.err(renderDiagnostic(file, d));
    return 2;
  }
  const result = renameScreen(parsed.parsed, oldId, newId);
  if (!result.ok) {
    io.err(`rename: ${result.reason}`);
    return 1;
  }
  const output = format(parsed.parsed);
  const validation = validate(output);
  writeFileSync(file, output);
  const errors = validation.diagnostics.filter((d) => d.severity === 'error');
  io.out(`${file}: '${oldId}' → '${newId}' (${result.changes} references updated${errors.length ? `, ${errors.length} pre-existing errors remain` : ''})`);
  return 0;
}

function renderDiagnostic(file: string, d: Diagnostic): string {
  const pos = d.line !== undefined ? `:${d.line}:${d.col ?? 1}` : '';
  return `${file}${pos} ${d.severity} ${d.code} ${d.message}`;
}

function readFile(file: string, io: Io): string | undefined {
  try {
    return readFileSync(file, 'utf8');
  } catch (e) {
    io.err(`cannot read ${file}: ${(e as Error).message}`);
    return undefined;
  }
}
