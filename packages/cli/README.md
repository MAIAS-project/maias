# @maias/cli — the `maias` command

Terminal tooling for MAIAS documents, built directly on [`@maias/core`](../core/README.md) — the CLI is argument parsing and output rendering only, so its verdicts are identical to the [MCP server](../mcp/README.md)'s and the MAIAS Browser's.

## Setup

No install needed:

```sh
npx @maias/cli validate <file>   # runs the `maias` bin straight from npm
npm i -g @maias/cli              # optional: global `maias`, usable from any directory
```

From a clone of this repo instead:

```sh
npm install && npm run build
npx maias validate <file>        # works anywhere inside the repo
npm run link-tools               # optional: global `maias` tracking the workspace build
```

Undo a global install/link with `npm rm -g @maias/cli @maias/mcp`. (The agent-facing
docs — CLAUDE.md and the skills — deliberately keep the explicit
`./node_modules/.bin/maias` path: it needs no PATH assumptions on a fresh clone.)

## Commands

### `maias validate <file> [--json]`

JSON Schema validation plus semantic lint (dangling targets, orphans, registry membership, duplicate ids/paths), with `file:line:col` positions:

```
$ maias validate my-app.maias.yaml
my-app.maias.yaml:42:11 error MAIAS-E003 Dangling target 'ghost' on screen 'home' (element 'Go') — no such screen
my-app.maias.yaml: invalid — 1 error, 0 warnings
```

`--json` emits the documented `{ file, valid, diagnostics[] }` shape for scripts and CI. Exits `1` on errors (warnings pass), `2` on usage/IO problems.

### `maias fmt <file> [--write|--check]`

Canonical formatting (spec §11: fixed key order, derived screen ordering, omit-empty). Idempotent, comment-preserving. Default prints to stdout; `--write` updates the file; `--check` exits `1` if the file isn't canonical (CI-friendly). Refuses to format a document with validation errors — fix those first.

### `maias rename <file> <old_id> <new_id>`

Renames a screen id and cascades to **every** reference — flows, the navigation registry, element and navigation targets, `back.target` — then writes canonical form:

```
$ maias rename my-app.maias.yaml feed home_feed
my-app.maias.yaml: 'feed' → 'home_feed' (5 references updated)
```

Never rename by find-and-replace; this is the tool.

## What the CLI deliberately doesn't do

Screen add/remove and element-level edits are exposed through the [MCP server](../mcp/README.md) (`edit`, `edit_elements`), whose structured JSON input fits those operations better than argv would — a CLI element command is deferred by design (D20). For document *authoring*, start from [docs/spec/llms.txt](../../docs/spec/llms.txt) or the Claude [skills](../../.claude/skills/README.md).

## Development

```sh
npx vitest run packages/cli   # exit codes, output shapes, rename behaviour
```
