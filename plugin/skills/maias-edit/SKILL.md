---
name: maias-edit
description: Modify a MAIAS document with reference integrity — renames cascade to flows, navigation, and targets; adds and removals keep the document valid. Use for any change to an existing MAIAS/IA file (rename a screen, add a screen or flow, restructure navigation).
---

# maias-edit

Apply natural-language modifications to a MAIAS document without breaking references.

## Ground rules

1. **Read `reference/llms.txt`** (bundled in this skill's directory) if you haven't this session — shapes, naming rules, canonical form.
2. **Use the toolchain, not hand-rolled bookkeeping.** This plugin connects the `maias` MCP server (`validate` / `query` / `edit` / `edit_elements`):
   - **Renames: always the `edit` tool with `rename_screen`.** It cascades to flows, the navigation registry, and every target (including `back.target`), then writes canonical form. Never rename by find-and-replace. (Without the MCP server: `npx -y @maias/cli rename <file> <old_id> <new_id>` is the same operation.)
   - **Element changes (add/update/remove/reorder elements on a screen): the `edit_elements` tool.** It applies the batch atomically, refuses dangling targets and stale indices (pass `expect: {type, label}` as the guard), and re-validates + writes canonical form.
   - **Add/remove screens**: the `edit` tool (`add_screen` registers the screen; `remove_screen` refuses to leave dangling references unless `cascade: true`). Structural edits the tools don't cover (flows, navigation groups): edit the YAML directly, following the document's existing shape, then validate + fmt below.
3. **The IA is the source of truth** — change the document first; renderers derive from it.

## Process

1. Read the target document; locate the constructs to change (screen ids, flows, registry lists). The `query` tool (`screen`, `what_links_here`, `orphans`) answers this without loading the whole file.
2. Apply the edit:
   - **Rename** → `edit.rename_screen` (see above). If the URL path should follow the new name, update the screen's `path` too — the validator has no opinion, but stale paths confuse humans.
   - **Add screen** → `edit.add_screen` with the screen object, the right flow, and the registry (`secondary`, or `primary` if it's a tab); then link to it from at least one reachable screen — otherwise it will be flagged unreachable.
   - **Remove screen** → `edit.remove_screen`; without `cascade: true` it lists every reference you'd break. The validator's `MAIAS-E003` catches any stragglers after direct edits.
3. **Verify**: the `validate` tool (or `npx -y @maias/cli validate <file>`) must report **zero errors** and no *new* warnings versus before your edit.
4. **Canonicalise**: MCP edits write canonical form already; after any direct YAML edit run `npx -y @maias/cli fmt <file> --write`.
5. Report what changed: ids touched, references updated, validation result.

## Acceptance bar

A rename must leave **zero dangling references** — a clean `validate` is the definition of done, not a diff that "looks right".
