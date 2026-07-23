# MAIAS — Target Architecture

Target state for the MAIAS project. The browser's [ARCHITECTURE.md](../MAIAS_browser/ARCHITECTURE.md) describes the as-built app; this document describes what we are building toward. Decisions are referenced as `D<n>` (entries in the project's decision log).

## Repository layout (monorepo)

npm workspaces (D9), one repo:

```
/
├── docs/                     # Project doc set + docs/spec/ (the standard)
├── schema/
│   └── maias.schema.json      # Formal JSON Schema (single source, versioned with the spec)
├── packages/
│   ├── core/                 # @maias/core — parse, model, serialise, graph, lint (env-agnostic)
│   ├── cli/                  # @maias/cli — `maias` binary: validate, fmt
│   └── mcp/                  # @maias/mcp — MCP server wrapping core
├── examples/
│   ├── calculator/           #   maias.yaml + README.md each
│   ├── todo_list/
│   ├── social_network/
│   └── ecommerce/
├── MAIAS_browser/                   # The MAIAS Browser (Expo app; existing project, refactored)
├── alias/maias/              # Unscoped `maias` npm package — thin bin alias for @maias/cli (not a workspace)
├── plugin/                   # Claude Code plugin source — mirrored to MAIAS-project/maias-plugin
├── scripts/                  # sync-plugin.sh (refreshes + pushes the plugin mirror)
└── .claude/skills/           # maias-create, maias-edit, maias-review (repo-local variants)
```

Packages are published to npm — `@maias/core`, `@maias/cli`, `@maias/mcp`, plus the unscoped [`maias`](https://www.npmjs.com/package/maias) CLI alias (kept outside the workspaces so its `maias` bin doesn't collide with `@maias/cli`'s in `node_modules/.bin`). Inside the repo they remain npm workspaces; `MAIAS_browser` consumes `@maias/core` via the workspace, not the registry. The MCP server is listed in the official MCP registry as `io.github.MAIAS-project/maias`.

## Dependency graph

```
                 schema/maias.schema.json
                          │ (loaded as data)
                          ▼
                    @maias/core  ◄────────── the single implementation
                   ╱     │     ╲
                  ▼      ▼      ▼
            @maias/cli @maias/mcp MAIAS_browser (browser)
                  ▲
                  │ (skills shell out to the CLI)
          .claude/skills/maias-*
```

Nothing except `@maias/core` parses, serialises, validates, or walks the IA graph. CLI, MCP, and browser are thin consumers. Skills use the CLI (R5.4).

## @maias/core

**Environment constraint:** must run in Node (CLI/MCP) *and* React Native/Hermes (browser). Therefore: pure TypeScript, no Node built-ins in the core paths, and **no `eval`/`new Function`** — Hermes forbids runtime codegen, which rules out standard Ajv compilation in-app (D11).

Modules:

| Module | Responsibility |
|---|---|
| `parse` | YAML/JSON text → `MaiasDocument` (typed object model). Built on the `yaml` package (eemeli), which preserves comments and source ranges (D10). Keeps the CST alongside the model for round-trip edits and line-referenced errors. |
| `model` | Typed object model: `MaiasDocument`, `Screen`, `Flow`, `Navigation`, `Element`, `ScreenState`, … Mirrors the spec 1:1. |
| `serialize` | Model → canonical YAML (or JSON). Implements the canonical formatting rules (R1.5). Round-trip: unedited nodes keep their comments (D10). |
| `graph` | Screen lookup, reachability analysis (from flow entry screens + `navigation.primary`), orphan detection, "what links here". |
| `edit` | Safe mutations: `renameScreen` (cascades to flows, nav registry, all targets), `addScreen`, `removeScreen` (reports/blocks dangling refs), `editElements` (atomic batch insert/update/remove/move on a screen's — or a declared state's — elements list; refuses dangling targets, stale-index guards, R6.5). Operates through the CST so edits are minimal diffs. |
| `validate` | Two layers: (1) JSON Schema validation via an interpreting (non-codegen) validator so it runs on Hermes (D11); (2) semantic lint rules (R2.3). Both emit `Diagnostic { code, severity, message, path, line, col }`. |
| `fmt` | Canonical formatter used by `maias fmt` and by `serialize`. Idempotent. |

The JSON Schema stays in `schema/` (spec artifact); core loads it as data, so schema and validator cannot drift independently of the spec (R1.10).

## @maias/cli

Node CLI, `maias` binary:

- `maias validate <file> [--json]` — schema + lint diagnostics; human output with `file:line:col`, `--json` emits the documented diagnostic shape; exit non-zero on errors (R2).
- `maias fmt <file> [--check|--write]` — canonical formatting (R6.2).

Thin: argument parsing + output rendering only.

## @maias/mcp

MCP stdio server (`@modelcontextprotocol/sdk`) exposing core operations to any MCP-capable agent (R6.4):

- `validate` — diagnostics for a file/string.
- `query` — graph utilities: get screen, list screens/flows, reachability, orphans, what-links-here.
- `edit` — safe operations: rename (cascading), add screen, remove screen; writes canonically formatted output.
- `edit_elements` — atomic batch edits of a screen's elements list (insert/update/remove/move, default or state lists), same refusal semantics and canonical write as `edit` (R6.5).

No logic beyond marshalling core calls.

## The MAIAS Browser (MAIAS_browser refactor)

Refactor, not rewrite (R3.1). The three structural changes:

### 1. Per-document instances behind context (R3.2, R3.3)

Today `screen-registry.ts` and `path-resolver.ts` build module-level state at import time from a hard-coded `require` of the origin IA YAML. Target:

```
loadDocument(source)                    // file picker text or bundled example
  → core.parse + core.validate         // errors → in-app error screen (R3.7)
  → new IaRuntime(document)            // registry + resolver as instance methods
  → <DocumentProvider value={runtime}> // React context at the root
```

- `IaRuntime` wraps `@maias/core`'s model + graph for lookup, plus path resolution (exact map + `:param` patterns — logic lifted from the current `path-resolver.ts`).
- All components (`WireframeScreen`, `PrimaryNav`, `QuickNav`, navigation helpers) read the runtime from context via `useIaDocument()`. `navigation-helpers.ts` becomes a hook (`useIaNavigation`) since it needs the runtime.
- Document sources: bundled examples via the Metro YAML transformer (kept for this purpose only, and re-pointed to emit the **raw YAML text**, not a parsed object — D8), user files via `expo-document-picker`. **Both sources go through the same `core.parse` + `core.validate` path at runtime**, so bundled and picked documents cannot behave differently.

### 2. Fully dynamic shell (R3.4)

Today: a `Tabs` navigator with three hard-coded tab directories and `TAB_PREFIXES` constants. Target: **drop the `(tabs)` group entirely** — a single root Stack with one catch-all route renders every screen; `PrimaryNav` (already a custom bar; the native tab bar is already disabled) renders N tabs from `document.navigation.primary` (D12).

```
app/
├── _layout.tsx          # DocumentProvider + AdapterProvider + Stack + PrimaryNav + QuickNav
├── index.tsx            # Document menu: bundled examples + file picker (start screen)
└── [...path].tsx        # Single catch-all: URL path → runtime.resolveScreenId → <ScreenRenderer>
```

Trade-off (recorded in D12): no per-tab navigation stack state (switching tabs resets that tab's stack). Acceptable for an IA browser; revisit if per-tab state becomes a requirement.

### 3. Adapter interface (R3.5, R3.6)

```ts
interface MaiasAdapter {
  id: string;                     // 'wireframe' | 'shadcn' | 'blueprint' | …
  name: string;                   // display name
  description: string;            // switcher one-liner
  components: Partial<Record<string, ElementComponent>>;  // element type → component
  theme: AdapterTheme;            // color tokens
}

type ElementComponent = React.ComponentType<{
  element: Element;               // typed element from the document
  onNavigate?: (target: string, presentation?: Presentation) => void;
}>;
```

(Adapter-supplied chrome — TabBar/Header overrides — is a planned extension of this interface; chrome is currently wireframe-styled for all adapters.)

- Resolution order: `adapter.components[type]` → wireframe adapter's component for `type` → wireframe fallback element (dashed box). Unknown types therefore never error (R1.2).
- The existing `wireframe-patterns.ts` registry + `wireframe-elements/` become the **wireframe adapter** — the reference implementation and the universal fallback layer.
- The shadcn-style adapter implements shadcn/ui's design tokens with plain StyleSheet (D18 — the Uniwind/NativeWind route failed its compatibility spike).
- Adapter selection is runtime state next to document selection (context + a switcher in the UI).
- Authoring guide: [adapters.md](adapters.md).

### Validation on load (R3.7)

`loadDocument` runs core validation; error diagnostics render in an in-app screen (file, line, message) with the option to pick another document. The browser never crashes on bad input.

## The spec and schema

- Spec chapters live in `docs/spec/` (one file per area: document structure, screens, elements, navigation, flows, states, extensions, formatting/canonical form, versioning + changelog).
- `docs/spec/llms.txt` is regenerated/re-checked whenever a chapter changes (R1.10).
- `schema/maias.schema.json` is the machine-enforceable subset; spec text marks which rules are schema-enforced vs lint-enforced vs convention.
- Document shape: evolves the origin prototype's document shape (top-level `maias` version header + `app` metadata + `screens`) rather than inventing a new one (D13). The element taxonomy generalises the prototype's `wf_*` library (the `wf_` prefix was dropped, D15).

## Testing

- `vitest` per package (`packages/*`): core round-trip, graph, lint rule fixtures (valid + invalid per rule), fmt idempotence, CLI exit codes, MCP tool calls (D14).
- Browser: `npx tsc --noEmit` gate (existing rule) + recorded manual verification passes. No RN component test harness in v1 (D14).
- Quality gate per task (RX.2): typecheck all workspaces + `vitest run` green before commit.
