# Architecture (as built)

## Overview

The **MAIAS Browser** (`MAIAS_browser/`) is a data-driven app built with Expo Router: it opens any **MAIAS document** (see [docs/spec/](../docs/spec/README.md)) at runtime and renders the app it describes — every screen, its elements, navigation relationships, and data dependencies. The app shell (tab bar, routes) is derived entirely from the loaded document; nothing about a particular app is hard-coded.

```
MAIAS document (.yaml/.json)  →  @maias/core (parse + validate)  →  IaRuntime  →  DocumentProvider (context)
  bundled example or file picker      diagnostics on failure       registry + URL↔screen        │
                                                                                                ▼
                                              single catch-all route  →  WireframeScreen (renders any screen)
```

The target architecture for the whole MAIAS project (packages, CLI, MCP, adapters) is in [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md); this file describes the browser app as currently built.

## Monorepo

npm workspaces: `packages/core` (`@maias/core` — parse/model/validate/graph/edit/fmt, the single implementation), `packages/cli` (`maias validate`, `maias fmt`), and `MAIAS_browser` (this app). Example documents live in `examples/` — four documents that collectively exercise the whole core spec (`examples/README.md`).

## Document loading

- **Bundled examples** (`lib/documents.ts`): the Metro transformer (`yaml-transformer.js`) embeds `.yaml` files as **raw source text** (decision D8) — `metro.config.js` adds the repo root to `watchFolders` so `examples/` resolves.
- **User files**: `expo-document-picker` on the menu screen; the file text is read on device.
- Both paths go through the same `loadDocument(text, name)` (`lib/document-context.tsx`): `@maias/core`'s `validate()` parses and checks the document; failures render as an in-app diagnostics list (file/line/code/message), never a crash; success constructs an `IaRuntime`.

## Runtime data flow

### IaRuntime (`lib/ia-runtime.ts`)

One instance per loaded document (no module-level state):

- screen registry: `getScreen(id)`, `getAllScreens()`, `getFlows()`, `primaryScreens()`
- path resolution: `resolveScreenId(urlPath)` (exact paths win over `:param` patterns), `pathFor(screenId)`
- `entryPath()` — first flow's entry screen, where browsing starts
- `presentationFor(screenId, override)` — spec §4.4 resolution (link → screen → `push`)

### DocumentProvider (`lib/document-context.tsx`)

React context at the root providing `{ runtime, documentName, loadDocument, closeDocument }`. Components use:

- `useIaDocument()` — the current runtime (null = no document open, chrome hides itself)
- `useIaNavigation()` — `getPath(screenId)` and `navigateTo(screenId, {from, params, presentation})`: substitutes `:param` values (demo fallback `'demo-1'`), alerts on self-reference/unknown targets, `router.replace` for `presentation: replace`, push otherwise (modal/sheet approximate as push for now)

## Routing structure

The entire `app/` directory is **3 files**:

```
app/
├── _layout.tsx     ← DocumentProvider + ViewMode/DeviceFrame + Stack + PrimaryNav + QuickNav overlay
├── index.tsx       ← Document menu: bundled examples, file picker, validation-error display
└── [...path].tsx   ← Single catch-all: URL → runtime.resolveScreenId → WireframeScreen
                      (redirects to the menu when no document is loaded)
```

There is no `(tabs)` group and no per-screen route files: tab behaviour is simulated by the custom `PrimaryNav` bar over a single Stack (decision D12 — trade-off: no per-tab history state).

## Component architecture

| Component | Purpose |
|-----------|---------|
| `PrimaryNav` | Tab bar derived from `navigation.primary` — tab count, order, labels (screen titles), routes all from the document; icons derived from screen type; hidden when <2 primary screens |
| `QuickNav` | Searchable jump-to-any-screen popup; tree built from the runtime's screens/flows via `quick-nav-tree.ts` |
| `WireframeScreen` | Renders any screen: header (back button, title, type badge), breadcrumb, description, features/actions, data chips, navigation buttons, and the element view toggle |
| `WireframeView` + `wireframe-elements/` | Renders the screen's `elements:` list via the registry in `lib/wireframe-patterns.ts` — MAIAS core element types (spec ch. 5) → lo-fi components, unknown types → dashed fallback box |
| `NavigationButton` | Navigates via `useIaNavigation`, honouring per-link `presentation` |
| `TypeBadge`, `FeatureBlock`, `DataIndicator` | Small display helpers |

Types come from `@maias/core` (`lib/types.ts` re-exports them with legacy aliases).

## Web view modes

On web the app renders inside a simulated iPhone frame (390×844, notch, home bar) with a desktop/mobile toggle; native passes through. (Unchanged from the prototype; lives inline in `_layout.tsx`.)

## Styling

`styles/wireframe.ts` — centralised design tokens (colors incl. brand orange `#E85D3A`, 6-step spacing, 5 text styles) plus all wireframe layout styles. Becomes the wireframe adapter's theme in the adapter phase.

## Dependencies

| Package | Purpose |
|---------|---------|
| `@maias/core` (workspace) | Parse, validate, model, graph — the single MAIAS implementation |
| expo ~55 / expo-router ~55 | Framework + file-based routing |
| react 19, react-native 0.83 | UI runtime |
| expo-document-picker | Runtime file loading |
| @expo/vector-icons | Ionicons |
| react-native-safe-area-context | Safe areas |

`js-yaml` is gone — the Metro transformer just embeds text; all parsing is `@maias/core` (`yaml` package) at runtime.

## Web deployment

The web build is a plain static export — the repo is hosting-agnostic and carries no provider config. From the repo root:

```sh
npm install && npm run build -w @maias/core   # core must build before the app
cd MAIAS_browser && npx expo export --platform web
```

`MAIAS_browser/dist/` is then a static single-page app deployable on any static host. Configure a single-page fallback (rewrite unmatched paths to `/index.html`) so screen-path URLs survive a refresh; without it only the root URL is directly loadable.

## Execution summary

```
1. App opens at the document menu (app/index.tsx)
2. User picks a bundled example or a MAIAS file
3. loadDocument → @maias/core validate → diagnostics shown in-app on failure
4. Success → IaRuntime built → DocumentProvider updates → router pushes runtime.entryPath()
5. Every navigation resolves through the runtime: screen id → path → single catch-all → WireframeScreen
6. PrimaryNav renders N tabs from navigation.primary; QuickNav jumps anywhere
7. Opening another document replaces the runtime — the whole shell re-derives
```
