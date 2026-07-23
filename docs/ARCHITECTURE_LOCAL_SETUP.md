# MAIAS — Local Setup Architecture: the MCP Server & Offline Validation

**Status:** Reference note · 2026-07-06
**Questions answered:** Can the MCP server run locally with minimal setup effort? What benefit does it provide over the alternatives? And how does validation work when the user is working entirely locally?
**Companion:** [ARCHITECTURE.md](ARCHITECTURE.md) (target architecture).

---

## 1. Running the MCP server locally: setup is genuinely minimal

The server (`packages/mcp/src/server.ts`) is a stdio process with **zero configuration surface** — no env vars, no auth, no config file, no state of its own. It holds nothing in memory between calls: every tool takes a file path, reads the file fresh, and (for edits) writes it back. The entire user setup is one config entry:

```json
{ "mcpServers": { "maias": { "command": "npx", "args": ["-y", "@maias/mcp"] } } }
```

or equivalently:

```sh
claude mcp add maias -- npx -y @maias/mcp
```

The only prerequisite is Node, which the agentic-builder persona has by definition.

**The gap between today and that one-liner is purely that the package isn't published** — the `bin` entry (`maias-mcp` → `dist/cli.js`), the build, and the test suite (8 tests through a real MCP client/InMemoryTransport pair) all already exist. There is nothing to build, only to `npm publish` (deferred decision D9, now due).

## 2. What the MCP server actually buys the user

The honest comparison is against an agent's two alternatives: shelling out to the CLI, or editing the YAML itself.

### Versus hand-editing YAML — the real payoff

The `edit` tool makes it structurally impossible for an agent to corrupt a document:

- `rename_screen` cascades to flows, the navigation registry, and every target (including `back.target`).
- `remove_screen` **refuses** to leave dangling references unless `cascade` is explicitly passed.
- `add_screen` registers the screen in the navigation registry and (optionally) a flow.
- `edit_elements` mutates a screen's elements list (insert/update/remove/move, default or state lists) as an **atomic batch** — a failing op refuses the whole batch, a `target` matching no screen is refused, and an `expect` guard makes stale indices fail loudly (R6.5).
- Every edit is **re-validated and canonically formatted before it is written back** — the response includes `valid_after_edit` plus any error diagnostics.

This is the D7 guarantee ("skills/agents MUST use the core library, never hand-roll YAML") delivered as *tools* rather than as instructions an agent might ignore.

### Versus the CLI — the overlap is smaller than it looks

The CLI has `validate`, `fmt`, and `rename`. The MCP server additionally exposes operations with **no CLI equivalent at all**:

| MCP capability | CLI equivalent | Why it matters |
|---|---|---|
| `query: screen / screens / flows` | none | Inspect one screen of a 55-screen document without loading the whole file into context |
| `query: reachable / orphans` | none (only surfaced inside `validate` warnings) | Direct graph answers for planning edits |
| `query: what_links_here` | none | "What targets `checkout_payment`?" as a small JSON answer — **context economy**, which is real cost and real accuracy in agent workflows |
| `edit: add_screen / remove_screen` | none | Safe add/remove with registry + flow bookkeeping |
| `edit: rename_screen` | `maias rename` | Same core operation, structured I/O |
| `edit_elements: insert / update / remove / move` | none | The most frequent create→review→iterate operation, atomic and reference-safe (R6.5) |
| `validate` | `maias validate --json` | Same core operation, no stdout parsing |

Beyond the extra operations: structured JSON in/out, self-describing tool schemas (the agent discovers capabilities without reading docs), and it works in MCP clients that have **no shell at all**.

### Who it is actually for

In Claude Code — where the skills and CLI already exist — the MCP server's marginal value is mostly the `query` operations. Its real job is being **the delivery vehicle for every other MCP client** (Cursor, Windsurf, custom agents), where the skills don't exist and the MCP server is the *only* way those agents get the safe-edit guarantee.

## 3. Local validation: fully self-contained, no network, ever

This is the nicest property of the architecture, and it was a deliberate decision (D11). The chain when a user validates locally:

1. **The JSON Schema is embedded inside `@maias/core`** as generated TypeScript (`packages/core/src/maias-schema.gen.ts`) — compiled into the package, not fetched from anywhere. A published `@maias/core` is a complete validator with no external runtime dependencies.
2. Schema validation runs through `@cfworker/json-schema` — an **interpreting** validator, chosen because Hermes (React Native's JS engine) forbids runtime codegen, which rules out standard Ajv. Side effect that matters here: the *identical* code path runs in Node (CLI, MCP), in the browser app, and on edge runtimes.
3. The semantic lint layer (dangling targets, orphans, registry membership, duplicate ids/paths, path collisions — E001–E009 / W001–W008) runs on top, with line/column positions taken from the `yaml` package's CST.

So locally there are **three doors into the same validation, and they cannot disagree**:

```
                          ┌────────────────────────────────┐
                          │   @maias/core validate()        │
                          │   schema (embedded, D11)       │
                          │   + lint (E001–E009/W001–W008) │
                          │   + line/col from the YAML CST │
                          └───────┬──────────┬─────────┬───┘
                                  │          │         │
             npx @maias/cli validate   MCP `validate`   MAIAS Browser
             (terminal, CI, scripts)  (agent tools)    (validation on load)
```

A hosted validate API, if one is stood up, is a convenience for zero-install users — **it is never required for local work, and a local user's documents never leave their machine**. That directly answers the standard privacy objection: local setup is fully offline.

## 4. The design constraint worth remembering

Because the MCP tools take file **paths**, the server is inherently local-only — it can never serve a hosted/zero-install user. That is exactly right for the repo workflow, and exactly why the delivery funnel needs both rungs: the hosted surface (validate API + browser render links) for the first-touch moment, the local MCP/CLI for the real workflow. **The two rungs aren't a redundancy; they're forced by this design.**
