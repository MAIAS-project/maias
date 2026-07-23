---
name: maias-edit
description: Modify a MAIAS document with reference integrity — renames cascade to flows, navigation, and targets; adds and removals keep the document valid. Use for any change to an existing MAIAS/IA file (rename a screen, add a screen or flow, restructure navigation).
---

# maias-edit

Apply natural-language modifications to a MAIAS document without breaking references.

## Ground rules

1. **Read `docs/spec/llms.txt`** if you haven't this session — shapes, naming rules, canonical form.
2. **Use the toolchain, not hand-rolled bookkeeping** (`./node_modules/.bin/maias`; build with `npm run build` (repo root) if missing):
   - **Renames: always `maias rename <file> <old_id> <new_id>`.** It cascades to flows, the navigation registry, and every target, then writes canonical form. Never rename by find-and-replace.
   - **Element changes (add/update/remove/reorder elements on a screen): use the `maias` MCP server's `edit_elements` tool when it is connected.** It applies the batch atomically, refuses dangling targets and stale indices (pass `expect: {type, label}` as the guard), and re-validates + writes canonical form. Without the MCP server, direct-edit remains acceptable — follow the validate + fmt steps below. (Connecting it: `claude mcp add maias -- node <repo>/packages/mcp/dist/cli.js` after building — see `packages/mcp/README.md`.)
   - Other edits (add/remove screens, change flows/navigation): edit the YAML directly, following the document's existing shape.
3. **The IA is the source of truth** — change the document first; renderers derive from it (see CLAUDE.md).

## Process

1. Read the target document; locate the constructs to change (screen ids, flows, registry lists).
2. Apply the edit:
   - **Rename** → `maias rename` (see above). If the URL path should follow the new name, update the screen's `path` too — the validator has no opinion, but stale paths confuse humans.
   - **Add screen** → write the screen object, add its id to `secondary.screens` (or `primary.screens` if it's a tab), add it to the right flow, and link to it from at least one reachable screen — otherwise it will be flagged unreachable.
   - **Remove screen** → delete the screen, its registry entry, its flow entries, and every navigation item/element `target` pointing at it. The validator's `MAIAS-E003` will list any you miss.
3. **Verify**: `maias validate <file>` must report **zero errors** and no *new* warnings versus before your edit.
4. **Canonicalise**: `maias fmt <file> --write`.
5. Report what changed: ids touched, references updated, validation result.

## Acceptance bar

A rename must leave **zero dangling references** — `maias validate` clean is the definition of done, not a diff that "looks right".
