# Project Conventions

This repo is **MAIAS** (Mobile App Information Architecture Schema): an open standard plus tooling, generalised from an earlier working prototype. The authoritative definition of MAIAS documents is the spec at `docs/spec/` (condensed agent reference: `docs/spec/llms.txt`) and `schema/maias.schema.json` — the IA Schema section below is a convenience summary and defers to the spec wherever they disagree.

## Terminology
- "IA" refers to the MAIAS document being worked on — one of the `examples/*/maias.yaml` documents or a user-supplied file (spec 0.2 shape: a `maias:` version header, `elements:` lists, neutral element type names — see `docs/spec/05-elements.md`)
- "Primary" refers to the primary navigation elements present at the 'root' of the app IA
- "Secondary" refers to the secondary navigation elements, usually these change depending upon context and lead to other screens in the app
- "Actions" refer to interactive elements which don't lead anywhere

## Changes
- Any changes must be made to the IA first, and then rendered automatically in the app and quick nav
- If I ask for any changes to be made the IA items, such as renaming, always ensure that the corresponding paths and references in the flows and navigation are also updated
- Validate IA changes with `./node_modules/.bin/maias validate <file>` and format with `maias fmt <file> --write` (built from `packages/cli`)
- Quality gate before any commit: `npm run typecheck` (workspaces) + `npx vitest run` at the repo root + `npx tsc --noEmit` in `MAIAS_browser/`

## IA Schema

### Navigation
Top-level navigation defines which screens are accessible globally.

```yaml
navigation:
  primary:
    label: <string>              # Display label for the nav group
    screens:                     # Screens shown in the persistent tab bar
      - <screen_id>
  secondary:
    label: <string>
    screens:                     # All non-primary screens in the app
      - <screen_id>
```

- **Primary screens** appear in the tab bar and are always accessible
- **Secondary screens** are all other screens, listed here as a registry
- Every screen in the app must appear in either `primary.screens` or `secondary.screens`

### Flows
Flows group screens into logical user journeys. Their order in the YAML determines the section order in the Quick Nav.

```yaml
flows:
  - name: <flow_name>            # Identifier, used as Quick Nav section key
    entry_screen: <screen_id>    # First screen in the flow
    screens:                     # All screens belonging to this flow
      - <screen_id>
```

- The `main` flow is special: each of its screens becomes its own section in the Quick Nav (e.g. Map hub, List hub, Profile hub)
- Screens not explicitly listed in any flow are assigned to a section by matching their path prefix to a flow's entry screen path
- Flow names use `snake_case`
- Use indented list format (not inline arrays)

### Screens
Each screen follows this structure (empty/default keys are omitted — canonical form drops `deep_link: false`, `auth: none`, empty lists, and the legacy `- None` placeholders):

```yaml
- id: <screen_id>                # Unique identifier, snake_case
  title: <string>                # Display title
  type: <screen_type>            # See screen types below (or x_-prefixed custom)
  path: <url_path>               # URL path, kebab-case, may contain :params
  description: <string>          # What this screen does (lint warns if missing)
  presentation: <mode>           # Optional: push (default) | replace | modal | sheet
  auth: required                 # Optional access gate (default none)
  deep_link: true                # Optional; needs app.links.scheme
  back:                          # Optional (spec 0.2): the header back button
    target: <screen_id>          #   no back key = no back button
    label: <string>              #   optional; default = target screen's title
  features:                      # Named capability blocks (documentation-level)
    - <feature_name>
  actions:                       # Interactive elements that don't navigate
    - <action_name>
  elements:                      # UI element declarations, render order
    - label: <string>            #   see docs/spec/05-elements.md for the 29 types
      type: <element_type>
      target: <screen_id>        #   optional — navigates on tap
  states:                        # Optional empty / loading / error variants
    empty:
      description: <string>
      elements: []               #   full replacement list
  navigation:
    primary:                     # Only on primary screens (tab bar items)
      - label: <string>
        target: <screen_id>
    secondary:                   # Navigation links to other screens
      - label: <string>
        target: <screen_id>
        presentation: <mode>     #   optional per-link override
    actions:                     # Non-navigating actions (buttons, toggles)
      - label: <string>
        external: <boolean>      # Optional, for links that leave the app
  data:
    reads:                       # Data this screen consumes
      - <data_key>
    writes:                      # Data this screen produces
      - <data_key>
```

### Screen Types
| Type | Description |
|------|-------------|
| `action` | Single-purpose action trigger |
| `action_sheet` | Bottom sheet with multiple choices |
| `container` | Parent screen grouping child screens |
| `detail` | Read-only detail view |
| `form` | User input / editable fields |
| `informational` | Static content / instructions |
| `list` | Scrollable list of items |
| `map` | Map-based interface |
| `marketing` | Promotional / value proposition content |
| `menu` | Navigation menu with links to sub-screens |
| `search` | Search input with results |
| `status` | Live status display (e.g. order tracking) |

### Naming Conventions
- Screen IDs: `snake_case` (e.g. `checkout_payment`)
- URL paths: `kebab-case` (e.g. `/account/order-history`)
- Flow names: `snake_case` (e.g. `connect_and_pay`)
- Features and data keys: `snake_case`
- Navigation labels: Title Case (e.g. `Saved Addresses`)

### Section Comments
Screen definitions are organised by flow with comment headers:
```yaml
# ─────────────────────────────────────────────
#  SECTION NAME
# ─────────────────────────────────────────────
```
