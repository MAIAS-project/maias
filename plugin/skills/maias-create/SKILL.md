---
name: maias-create
description: Create a valid MAIAS document from a natural-language app description. Use when asked to "create an IA", "design the information architecture", or "make a MAIAS file" for an app idea (e.g. "create an IA for a recipe app").
---

# maias-create

Turn an app description into a valid MAIAS document.

## Ground rules

1. **Read `reference/llms.txt` (bundled in this skill's directory) first** — it is the authoritative condensed spec (document shape, element taxonomy, hard rules, canonical form). Do not author from memory.
2. **Never hand-verify** — the toolchain is the referee. This plugin connects the `maias` MCP server: use its `validate` tool. If the MCP server is unavailable, `npx -y @maias/cli validate <file>` and `npx -y @maias/cli fmt <file> --write` give identical verdicts (same implementation).
3. Study one example that resembles the requested app — fetch `https://raw.githubusercontent.com/MAIAS-project/maias/main/examples/<name>/maias.yaml`, where `<name>` is `todo_list` for CRUD, `social_network` for feeds/tabs, `ecommerce` for catalogues/journeys, `calculator` for single-screen.

## Process

1. **Design before YAML.** From the description, decide:
   - the 2–5 primary screens (tab bar) — what the user lives in;
   - the journeys (flows): each with an entry screen and an ordered screen list;
   - secondary screens: details (with `:param` paths), forms (usually `presentation: modal`), settings;
   - which screens are gated (`auth: required`) and which are shareable (`deep_link: true` + `app.links.scheme`).
2. **Write the document** at the user-requested path (default `<app_name>.maias.yaml` in the project root). Every screen and flow gets a real `description` — intent travels with structure. Give data-bearing screens `states` (`empty`/`loading`/`error`) and `data.reads`/`writes` using a consistent app-wide key vocabulary.
3. **Validate and iterate**: the MCP `validate` tool (or `npx -y @maias/cli validate <file>`) until **zero errors**; then resolve warnings you introduced by accident (unreachable screens usually mean a missing link, not a missing warning-suppression). Deliberate warnings are fine — say so.
4. **Canonicalise and re-verify**: `npx -y @maias/cli fmt <file> --write`, then `fmt <file> --check` and a final validate (fmt rewrites content — reorders lists, refolds scalars — so verify after it, not before).
5. Offer to view it in the MAIAS Browser: clone `https://github.com/MAIAS-project/maias`, `npm install && npm run web --workspace maias-browser`, and pick the file from the menu.

## Pitfalls the validator will catch — design them out up front

- Every screen must be in exactly one of `app.navigation.primary.screens` / `secondary.screens`.
- Every flow's `entry_screen` must appear in its own `screens` list.
- Every `target` must be an existing screen id (snake_case — never kebab-case).
- Screens nobody links to are unreachable: wire each secondary screen to a `target` chain that starts at a tab or flow entry.
- Multi-line labels (`bullets`) must be **double-quoted with explicit `\n`** (`"Milk\nEggs"`) — unquoted YAML folds the newlines into spaces and the validator can't see the difference.
- Give every non-tab, non-entry screen a `back:` target (spec §4.3) — no `back` means no back button. Tab roots and journey entry points omit it; never model back as a `navigation.secondary` item.
