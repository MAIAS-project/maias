# MAIAS — Mobile App Information Architecture Schema

An open standard for describing an app's **information architecture** — screens, navigation, flows, UI elements, states, and data dependencies — in one YAML (or JSON) document that is equally readable by humans and operable by agents.

```yaml
maias: "0.1"
app:
  name: Todo List
  navigation:
    primary:
      screens: [home, settings]     # ← the tab bar, derived, not drawn
  flows:
    - name: main
      entry_screen: home
      screens: [home, task_detail, task_new]
screens:
  - id: home
    title: My Tasks
    type: list
    path: /tasks
    description: All tasks, newest first.
    elements:
      - label: Buy milk
        type: list_item
        target: task_detail          # ← references are validated, renames cascade
```

**Why:** a common language for human–agent collaboration on app development. An agent can *build* the described app from the document ([implementation guide](docs/implementation-guide.md)), *create and edit* documents as safe machine operations (CLI, MCP), and a human can read and review the same file.

## What's in this repo

| | |
|---|---|
| **The spec** | [docs/spec/](docs/spec/README.md) — 11 chapters · [llms.txt](docs/spec/llms.txt) (one-context-window agent reference) · [schema/maias.schema.json](schema/maias.schema.json) |
| **`@maias/core`** | [packages/core](packages/core/README.md) — parse → typed model → serialise with round-trip fidelity (comments survive edits), graph utilities, safe edits (cascading renames, element batches), canonical formatter, Hermes-safe validation |
| **`maias` CLI** | [packages/cli](packages/cli/README.md) — `maias validate` (schema + semantic lint, `--json`), `maias fmt`, `maias rename` |
| **MCP server** | [packages/mcp](packages/mcp/README.md) — `validate` / `query` / `edit` / `edit_elements` tools for any MCP-capable agent |
| **MAIAS Browser** | [MAIAS_browser](MAIAS_browser/README.md) — Expo app that opens any MAIAS document at runtime and renders it: dynamic tab bar, pluggable design-system adapters (wireframe · shadcn-style · blueprint), in-app validation errors |
| **Examples** | [examples/](examples/README.md) — calculator · todo_list · social_network · ecommerce — collectively covering every core element and screen type |
| **Claude skills** | [.claude/skills/](.claude/skills/README.md) — `maias-create`, `maias-edit`, `maias-review` · installable anywhere as the [maias plugin](https://github.com/MAIAS-project/maias-plugin) |

## Quick start

Requires [Node.js](https://nodejs.org) 20.19.4+ / 22.13+ / 24.3+ (CI runs 22). No clone or install needed — the packages are on npm:

```sh
# validate a document — schema + semantic lint (dangling targets, orphans,
# path collisions), with line numbers; add --json for machine-readable output
npx maias validate my-app.maias.yaml

# canonical formatting (idempotent; agent edits diff cleanly)
npx maias fmt my-app.maias.yaml --write

# rename a screen — cascades to flows, navigation, every target
npx maias rename my-app.maias.yaml old_screen new_screen
```

Prefer a plain `maias` command? `npm i -g @maias/cli`.

**In Claude Code**, one install delivers the three skills plus the MCP server:

```
/plugin marketplace add MAIAS-project/maias-plugin
/plugin install maias@maias
```

**In any MCP client**, add the server with `claude mcp add maias -- npx -y @maias/mcp` (or the JSON equivalent — see [packages/mcp](packages/mcp/README.md)); it is also listed in the official MCP registry as `io.github.MAIAS-project/maias`.

**The MAIAS Browser** (render any document as a working app, web/iOS/Android) runs from a clone:

```sh
git clone https://github.com/MAIAS-project/maias.git && cd maias
npm install && npm run build
npx maias validate examples/todo_list/maias.yaml
npm run web --workspace maias-browser
```

Working from a clone, `npm run link-tools` symlinks the workspace CLI (and the
`maias-mcp` server) onto your PATH, tracking your local build; undo with
`npm rm -g @maias/cli @maias/mcp`.

To author a document, start from [docs/spec/llms.txt](docs/spec/llms.txt) — it is sufficient on its own — or, in Claude Code, just ask: *"create an IA for a recipe app"* (the `maias-create` skill takes it from there).

## Project documentation

Project architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · the browser as built: [MAIAS_browser/ARCHITECTURE.md](MAIAS_browser/ARCHITECTURE.md) · local agent setup (MCP, offline validation): [docs/ARCHITECTURE_LOCAL_SETUP.md](docs/ARCHITECTURE_LOCAL_SETUP.md) · building an app from a document: [docs/implementation-guide.md](docs/implementation-guide.md) · design-system adapters: [docs/adapters.md](docs/adapters.md).

## Status

**Pre-release.** MAIAS is pre-1.0: the format and tooling may change in breaking ways between 0.x versions. Spec **v0.2** (0.1 + declared back navigation); all six project deliverables implemented (spec + schema, validator/linter, browser, examples, skills, agent-interop toolkit). Tests: `npx vitest run` (core round-trip/lint/fmt, CLI, MCP).
