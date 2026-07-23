# @maias/core — the MAIAS core library

The single TypeScript implementation of everything MAIAS: parse → typed object model → serialise with round-trip fidelity, validation, graph utilities, safe edits, and the canonical formatter. The [CLI](../cli/README.md), the [MCP server](../mcp/README.md), and the MAIAS Browser are all thin wrappers over this package — one implementation, so the three surfaces can never disagree about what a valid document is.

**Environment constraint that shaped it:** the same code runs in Node (CLI, MCP), the browser, and React Native/Hermes. Hermes forbids runtime codegen, so schema validation uses an interpreting validator (`@cfworker/json-schema`, not Ajv — decision D11), and the JSON Schema is embedded at build time (`maias-schema.gen.ts`): a published `@maias/core` validates with **no network and no external files, ever**.

## Quick taste

```ts
import { parse, validate, editElements, format } from '@maias/core';

const { parsed } = parse(readFileSync('my-app.maias.yaml', 'utf8'));

// Safe element edit — atomic batch, refuses dangling targets & stale indices
const result = editElements(parsed!, 'home', [
  { op: 'insert', index: 2, element: { label: 'Send feedback', type: 'link', target: 'feedback' } },
]);
if (!result.ok) throw new Error(result.reason);

const output = format(parsed!);          // canonical form, comments intact
console.log(validate(output).valid);     // re-check before writing
```

## Module surface

| Module | Exports | Job |
|---|---|---|
| `parse` | `parse`, `ParsedDocument` | YAML/JSON text → typed model **plus** the underlying CST (`yaml` package, D10). Comments and source ranges survive; `position(path)` maps any document path to line/col. |
| `model` | `MaiasDocument`, `Screen`, `Element`, `Flow`, … | The spec, 1:1, as TypeScript types. `x_` extension fields are typed on every object. |
| `validate` | `validate`, `lint`, `schemaValidate` | Two layers: embedded JSON Schema, then semantic lint (dangling targets `MAIAS-E003`, orphans, registry membership, duplicates, path collisions — E001–E009 / W001–W008), all as `Diagnostic { code, severity, message, path, line, col }`. |
| `graph` | `screenIndex`, `reachableScreens`, `orphanScreens`, `whatLinksHere`, `outboundRefs` | The document as a navigation graph. |
| `edit` | `renameScreen`, `addScreen`, `removeScreen`, `editElements` | Safe mutations through the CST: renames cascade to every reference; removal refuses to leave dangling targets unless `cascade`; `editElements` applies an atomic insert/update/remove/move batch with `expect` guards (R6.5, D20). Every operation returns `EditResult { ok, reason?, changes }` and, on refusal, leaves the document untouched. |
| `fmt` | `format`, `canonicalize` | Canonical form (spec §11): fixed key order, derived screen ordering, omit-empty. Idempotent; comments move with their nodes. |

## Guarantees

- **Round-trip fidelity (D10):** parse → edit → serialise keeps every comment and leaves untouched lines byte-identical — machine edits diff as exactly the change.
- **Safe by default:** every edit operation validates its inputs first and refuses with an actionable `reason` rather than writing a broken document.
- **One validation everywhere (D11):** CLI, MCP, and the in-app browser all call this `validate()`; a document valid in one place is valid in all.

## Development

```sh
npm run build -w @maias/core     # regenerates the embedded schema, then compiles
npx vitest run packages/core    # round-trip, lint fixtures, fmt idempotence, edit ops
```
