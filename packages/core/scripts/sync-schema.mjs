// Generates src/maias-schema.gen.ts from the canonical JSON Schema
// (schema/maias.schema.json, a spec artifact). A plain TS module — rather than a
// JSON import — so the built library needs no resolveJsonModule/import-attribute
// support from downstream bundlers (Metro/Hermes included). The canonical file
// remains the single source of truth; a test asserts the copy matches.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const canonical = resolve(here, '../../../schema/maias.schema.json');
const generated = resolve(here, '../src/maias-schema.gen.ts');

const schema = JSON.parse(readFileSync(canonical, 'utf8'));
writeFileSync(
  generated,
  `// GENERATED from schema/maias.schema.json — do not edit; run \`npm run sync-schema\`.\n` +
    `export const MAIAS_SCHEMA: Record<string, unknown> = ${JSON.stringify(schema, null, 2)};\n`,
);
