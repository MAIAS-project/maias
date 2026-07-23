import { Document, LineCounter, parseDocument } from 'yaml';
import type { MaiasDocument, DocPath } from './model.js';
import { CODES, type Diagnostic } from './diagnostics.js';

export type SourceFormat = 'yaml' | 'json';

/**
 * A parsed MAIAS document. Wraps the `yaml` Document (which preserves comments
 * and source ranges for round-trip edits and line-referenced diagnostics)
 * together with the plain-data view used by validation and graph utilities.
 *
 * JSON input is parsed through the same YAML parser (JSON is a YAML subset),
 * so positions and edits work identically; `format` records the original
 * serialisation so `toString()` can emit it back.
 */
export class ParsedDocument {
  constructor(
    public readonly ydoc: Document,
    private readonly lineCounter: LineCounter,
    public readonly format: SourceFormat,
  ) {}

  /** Plain-data view. Recomputed on each call — cheap, and edits stay visible. */
  get data(): MaiasDocument {
    return this.ydoc.toJS() as MaiasDocument;
  }

  /** 1-based line/col for a JSON path, when resolvable. */
  position(path: DocPath): { line: number; col: number } | undefined {
    const node = this.ydoc.getIn(path, true) as { range?: [number, number, number] } | undefined;
    const offset = node?.range?.[0];
    if (offset === undefined) {
      // Fall back to the parent so e.g. a missing required key still points somewhere useful.
      if (path.length === 0) return undefined;
      return this.position(path.slice(0, -1));
    }
    const pos = this.lineCounter.linePos(offset);
    return { line: pos.line, col: pos.col };
  }

  /** Serialise. YAML keeps comments and (for unedited nodes) original layout. */
  toString(): string {
    if (this.format === 'json') {
      return JSON.stringify(this.ydoc.toJS(), null, 2) + '\n';
    }
    return this.ydoc.toString({ lineWidth: 0 });
  }
}

export interface ParseResult {
  parsed?: ParsedDocument;
  diagnostics: Diagnostic[];
}

/** Parse MAIAS source text (YAML or JSON). Syntax errors come back as diagnostics, never throws. */
export function parse(text: string, opts: { format?: SourceFormat } = {}): ParseResult {
  const format: SourceFormat = opts.format ?? (looksLikeJson(text) ? 'json' : 'yaml');
  const lineCounter = new LineCounter();
  const ydoc = parseDocument(text, { lineCounter, keepSourceTokens: true });

  const diagnostics: Diagnostic[] = ydoc.errors.map((err) => ({
    code: CODES.PARSE,
    severity: 'error' as const,
    message: err.message.split('\n')[0],
    path: [],
    line: err.linePos?.[0]?.line,
    col: err.linePos?.[0]?.col,
  }));
  if (diagnostics.length > 0) return { diagnostics };

  return { parsed: new ParsedDocument(ydoc, lineCounter, format), diagnostics };
}

function looksLikeJson(text: string): boolean {
  return text.trimStart().startsWith('{');
}
