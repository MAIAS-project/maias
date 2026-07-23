import { Validator, type OutputUnit } from '@cfworker/json-schema';
import { MAIAS_SCHEMA as schema } from './maias-schema.gen.js';
import type { DocPath } from './model.js';
import { CODES, type Diagnostic } from './diagnostics.js';
import type { ParsedDocument } from './parse.js';

// @cfworker/json-schema is an interpreting validator (no eval/new Function),
// so this exact code path runs under Node and React Native/Hermes alike (D11).
const validator = new Validator(schema as never, '2020-12', false);

/** Keywords whose output units describe a concrete leaf problem (vs. structural bookkeeping). */
const LEAF_KEYWORDS = new Set([
  'type',
  'required',
  'pattern',
  'enum',
  'const',
  'minItems',
  'uniqueItems',
  'minLength',
  'additionalProperties',
]);

export function schemaValidate(parsed: ParsedDocument): Diagnostic[] {
  const result = validator.validate(parsed.data);
  if (result.valid) return [];

  const seen = new Set<string>();
  const diagnostics: Diagnostic[] = [];
  const units = result.errors.filter((u) => !isCascade(u, result.errors));
  for (const unit of units) {
    if (!LEAF_KEYWORDS.has(unit.keyword)) continue;
    const path = pointerToPath(unit.instanceLocation);
    const message = describe(unit.keyword, unit, path);
    const key = `${unit.instanceLocation}|${message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    diagnostics.push({
      code: CODES.SCHEMA,
      severity: 'error',
      message,
      path,
      ...parsed.position(path),
    });
  }
  // Everything was filtered as structural noise — surface the raw root cause rather than nothing.
  if (diagnostics.length === 0 && result.errors.length > 0) {
    const unit = result.errors[result.errors.length - 1];
    const path = pointerToPath(unit.instanceLocation);
    diagnostics.push({
      code: CODES.SCHEMA,
      severity: 'error',
      message: unit.error,
      path,
      ...parsed.position(path),
    });
  }
  return diagnostics;
}

/**
 * `additionalProperties: false` failures cascade: when `screens.0.elements.1.target`
 * fails its pattern, every ancestor also reports "Property X does not match
 * additional properties schema". A unit is such a cascade when the property it
 * names has its own deeper error units. Genuine unknown keys (typos) have no
 * deeper units and are kept.
 */
function isCascade(unit: OutputUnit, all: OutputUnit[]): boolean {
  if (unit.keyword !== 'additionalProperties') return false;
  const property = /^Property "([^"]+)"/.exec(unit.error)?.[1];
  if (!property) return false;
  const childPointer = `${unit.instanceLocation === '#' ? '#' : unit.instanceLocation}/${escapePointer(property)}`;
  return all.some((u) => u !== unit && (u.instanceLocation === childPointer || u.instanceLocation.startsWith(childPointer + '/')));
}

function escapePointer(segment: string): string {
  return segment.replace(/~/g, '~0').replace(/\//g, '~1');
}

function pointerToPath(pointer: string): DocPath {
  if (pointer === '#' || pointer === '') return [];
  return pointer
    .replace(/^#\//, '')
    .split('/')
    .map((seg) => {
      const dec = seg.replace(/~1/g, '/').replace(/~0/g, '~');
      return /^\d+$/.test(dec) ? Number(dec) : dec;
    });
}

function describe(keyword: string, unit: OutputUnit, path: DocPath): string {
  const where = path.length ? path.join('.') : 'document root';
  switch (keyword) {
    case 'additionalProperties':
      return `${unit.error} at ${where} — unknown keys must be x_-prefixed (spec §10.3)`;
    case 'pattern':
      return `${unit.error} at ${where}`;
    default:
      return `${unit.error} at ${where}`;
  }
}
