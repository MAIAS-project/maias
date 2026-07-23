# @maias/mcp — the MAIAS MCP server

An [MCP](https://modelcontextprotocol.io) stdio server that lets any MCP-capable agent (Claude Code, Cursor, Windsurf, custom agents) validate, query, and safely edit MAIAS documents. It is a thin wrapper over [`@maias/core`](../core) — the same implementation behind the CLI and the MAIAS Browser, so all three always agree.

**Why use it instead of editing the YAML directly?** The edit tools make it structurally hard to corrupt a document: renames cascade to every reference, removals refuse to leave dangling targets, element batches apply all-or-nothing, and every edit is re-validated and canonically formatted before it is written back. The response always tells you `valid_after_edit`.

## Setup

The server is listed in the [official MCP registry](https://registry.modelcontextprotocol.io) as `io.github.MAIAS-project/maias` — registry-aware clients can add it from there. Claude Code users can instead install the [maias plugin](https://github.com/MAIAS-project/maias-plugin), which bundles this server with the three MAIAS skills.

Manual setup needs no clone or build — e.g. for Claude Code:

```sh
claude mcp add maias -- npx -y @maias/mcp
```

or in a JSON MCP config:

```json
{ "mcpServers": { "maias": { "command": "npx", "args": ["-y", "@maias/mcp"] } } }
```

Working from a clone of this repo instead? `npm install && npm run build`, then register the workspace build:

```sh
claude mcp add maias -- node <absolute-path-to-repo>/packages/mcp/dist/cli.js
```

or, after `npm run link-tools` at the repo root, simply `claude mcp add maias -- maias-mcp`.

The server is stateless and local-only by design: every tool takes a **file path**, reads the file fresh, and (for edits) writes it back. No env vars, no auth, no config.

## Tools

### `validate`

JSON Schema validation plus semantic lint (dangling targets, orphans, registry membership, duplicates, path collisions) with line/col positions.

```json
{ "file": "examples/todo_list/maias.yaml" }
→ { "valid": true, "diagnostics": [] }
```

### `query`

Graph utilities, designed for context economy — ask for exactly the slice you need instead of loading a 55-screen document:

| `operation` | Answers |
|---|---|
| `screen` (+ `screen_id`) | One screen's full definition |
| `screens` | id / title / type / path for every screen |
| `flows` | The flow list |
| `reachable` | Screens reachable from primary nav + flow entries |
| `orphans` | Screens nothing links to |
| `what_links_here` (+ `screen_id`) | Every inbound reference, with kind and path |

### `edit`

Screen-level operations. Each one re-validates and writes canonical form (`format_output: false` to skip formatting):

- `rename_screen` (`screen_id`, `new_id`) — cascades to flows, the navigation registry, and every target, including `back.target`.
- `add_screen` (`screen`, optional `flow`, `registry`) — adds the screen object and registers it.
- `remove_screen` (`screen_id`, optional `cascade`) — refuses to leave dangling references unless `cascade: true`.

### `edit_elements`

Element-level operations on one screen's `elements` list, or a declared state's list (`state: empty | loading | error`). Takes an `ops` array applied **atomically** — if any op is refused, nothing is written:

```json
{
  "file": "my-app.maias.yaml",
  "screen_id": "home",
  "ops": [
    { "op": "insert", "index": 2, "element": { "label": "Send feedback", "type": "link", "target": "feedback" } },
    { "op": "update", "index": 0, "expect": { "type": "search_bar" }, "set": { "label": "Search everything" } },
    { "op": "move",   "index": 3, "to": 1 },
    { "op": "remove", "index": 4, "expect": { "label": "Old banner" } }
  ]
}
```

Semantics worth knowing:

- Indices are 0-based render order; each op addresses the list **as left by the previous ops**. `insert` at the list length appends; `move.to` is the final index.
- `update.set` is a patch: only named keys are written, an explicit `null` deletes a key, unnamed keys (including `x_` extensions) survive. `type` cannot be deleted.
- `expect: { type?, label? }` is a stale-index guard — if the addressed element doesn't match, the batch is refused with what was actually found. Recommended on every `update`/`remove`/`move`.
- An op introducing a `target` that matches no screen is refused (no escape hatch — add the screen first via `edit`). Editing a state the screen doesn't declare is refused (declaring states is a screen-shape decision).

## Guarantees (all four tools)

- **One implementation:** everything calls `@maias/core`; the server contains no logic beyond argument marshalling, so MCP, CLI, and browser validation can never disagree.
- **Round-trip fidelity:** edits go through the YAML CST — comments survive, untouched lines stay byte-identical, diffs are minimal.
- **Refusals are safe:** a refused edit returns `isError` with an actionable reason and leaves the file unwritten.
- **Honest reporting:** every successful edit returns `changes`, `valid_after_edit`, and any error diagnostics.

## Development

Tests (a real MCP `Client`/`InMemoryTransport` pair exercising every tool against the example documents):

```sh
npx vitest run packages/mcp
```
