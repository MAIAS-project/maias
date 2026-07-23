import { hasErrors, sortDiagnostics, type Diagnostic } from './diagnostics.js';
import { lint } from './lint.js';
import { parse, type ParsedDocument } from './parse.js';
import { schemaValidate } from './schema-validate.js';

export interface ValidationResult {
  /** No parse errors, no schema errors, no lint errors. Warnings do not affect validity. */
  valid: boolean;
  diagnostics: Diagnostic[];
  /** Present whenever the source parsed, even if invalid. */
  parsed?: ParsedDocument;
}

/** Full validation: parse (if given text) → JSON Schema → semantic lint. */
export function validate(source: string | ParsedDocument): ValidationResult {
  let parsed: ParsedDocument;
  if (typeof source === 'string') {
    const result = parse(source);
    if (!result.parsed) return { valid: false, diagnostics: sortDiagnostics(result.diagnostics) };
    parsed = result.parsed;
  } else {
    parsed = source;
  }

  const diagnostics = sortDiagnostics([...schemaValidate(parsed), ...lint(parsed)]);
  return { valid: !hasErrors(diagnostics), diagnostics, parsed };
}
