import type { DocPath } from './model.js';

export type Severity = 'error' | 'warning';

/**
 * A single validation/lint finding. `line`/`col` are 1-based and present when
 * the source text position of `path` could be resolved (YAML and JSON input).
 * The shape is the stable contract of `maias validate --json`.
 */
export interface Diagnostic {
  /** Stable rule code: MAIAS-S### (schema), MAIAS-E### (lint error), MAIAS-W### (lint warning), MAIAS-P### (parse). */
  code: string;
  severity: Severity;
  message: string;
  /** JSON path to the offending node, e.g. ['screens', 3, 'path']. */
  path: DocPath;
  line?: number;
  col?: number;
}

export const CODES = {
  PARSE: 'MAIAS-P001',
  SCHEMA: 'MAIAS-S001',
  DUPLICATE_ID: 'MAIAS-E001',
  DUPLICATE_PATH: 'MAIAS-E002',
  DANGLING_TARGET: 'MAIAS-E003',
  FLOW_ENTRY: 'MAIAS-E004',
  FLOW_UNKNOWN_SCREEN: 'MAIAS-E005',
  UNREGISTERED_SCREEN: 'MAIAS-E006',
  DOUBLY_REGISTERED_SCREEN: 'MAIAS-E007',
  REGISTRY_UNKNOWN_SCREEN: 'MAIAS-E008',
  DUPLICATE_FLOW: 'MAIAS-E009',
  MISSING_DESCRIPTION: 'MAIAS-W001',
  UNREACHABLE_SCREEN: 'MAIAS-W002',
  ORPHAN_SCREEN: 'MAIAS-W003',
  SELF_TARGET: 'MAIAS-W004',
  UNKNOWN_ELEMENT_TYPE: 'MAIAS-W005',
  DEEP_LINK_NO_SCHEME: 'MAIAS-W006',
  PRIMARY_NAV_MISUSE: 'MAIAS-W007',
  SHEET_PRESENTATION: 'MAIAS-W008',
  VERSION_FEATURE_MISMATCH: 'MAIAS-W009',
} as const;

export function hasErrors(diagnostics: Diagnostic[]): boolean {
  return diagnostics.some((d) => d.severity === 'error');
}

/** Stable ordering for output: by line, then col, then code. */
export function sortDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  return [...diagnostics].sort(
    (a, b) => (a.line ?? 0) - (b.line ?? 0) || (a.col ?? 0) - (b.col ?? 0) || a.code.localeCompare(b.code),
  );
}
