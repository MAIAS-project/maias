# MAIAS Claude skills

Three skills that make Claude Code fluent in MAIAS documents. They load automatically in any session opened in this repo — you don't invoke them by name, you just ask in natural language and the matching skill grounds the work in the spec and the safe toolchain. (Working outside this repo? The same three skills — plus the MCP server — install anywhere as the [maias plugin](https://github.com/MAIAS-project/maias-plugin): `/plugin marketplace add MAIAS-project/maias-plugin`, then `/plugin install maias@maias`.)

| Skill | What it does | Say something like |
|---|---|---|
| [`maias-create`](maias-create/SKILL.md) | Turns an app description into a complete, valid MAIAS document — screens, flows, navigation, elements — then validates and canonically formats it. | *"Create an IA for a recipe app with meal planning."* |
| [`maias-edit`](maias-edit/SKILL.md) | Modifies an existing document with reference integrity: renames cascade everywhere, adds/removals keep the graph intact, element changes go through the safe edit tools. | *"Rename the feed screen to home_feed."* · *"Add a payment confirmation screen to the checkout flow."* · *"Add a logout button to settings."* |
| [`maias-review`](maias-review/SKILL.md) | Runs the validator, then critiques the IA itself: dead ends, unreachable screens, inconsistent navigation patterns, missing states, UX depth. | *"Review my-app.maias.yaml — anything structurally wrong?"* |

## How they keep documents safe

The skills are deliberately thin: all of them ground themselves in [`docs/spec/llms.txt`](../../docs/spec/llms.txt) (the one-context-window spec reference) and delegate every mechanical operation to the shared toolchain instead of hand-rolling YAML (a deliberate design rule — one implementation of edit semantics, so the skills cannot drift from the spec):

- **Validation** — `maias validate <file>`: schema + semantic lint with line numbers; zero errors is the definition of done, not a diff that "looks right".
- **Formatting** — `maias fmt <file> --write`: canonical form, so machine edits diff cleanly.
- **Renames** — `maias rename <file> <old> <new>`: cascades to flows, the navigation registry, and every target. Never find-and-replace.
- **Element edits** — the [`maias` MCP server's](../../packages/mcp/README.md) `edit_elements` tool when connected: atomic batches that refuse dangling targets and stale indices.

Because the CLI, the MCP server, and the MAIAS Browser all wrap the same `@maias/core`, a document a skill declares valid is valid everywhere.

## Outside Claude Code

The skills are Claude Code conveniences, not a dependency. Agents in other environments get the same guarantees from the [MCP server](../../packages/mcp/README.md) directly (`npx -y @maias/mcp`, or `io.github.MAIAS-project/maias` in the official MCP registry), and humans from the CLI (`npx maias validate` / `fmt` / `rename`). The underlying conventions live in the spec ([docs/spec/](../../docs/spec/README.md)) and [CLAUDE.md](../../CLAUDE.md).
