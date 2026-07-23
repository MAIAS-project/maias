# 11. Canonical form

Canonical form makes machine edits produce **minimal, clean diffs** and makes independent editors **converge** on identical output. `maias fmt` implements these rules and is idempotent: `fmt(fmt(doc)) == fmt(doc)`.

Canonical form is a SHOULD for documents (non-canonical documents are still valid); editors SHOULD emit it on every write.

## 11.1 Key order

Fixed order at every level; keys are omitted entirely when empty or at their default (no `actions: - None` placeholders, no `deep_link: false`).

**Document:** `maias`, `app`, `screens`
**app:** `name`, `description`, `links`, `navigation`, `flows`
**navigation (app-level):** `primary`, `secondary` — each `label`, `screens`
**flow:** `name`, `description`, `entry_screen`, `screens`
**screen:** `id`, `title`, `type`, `path`, `description`, `presentation`, `auth`, `deep_link`, `back`, `features`, `actions`, `elements`, `states`, `navigation`, `data`
**back:** `label`, `target`
**navigation (screen-level):** `primary`, `secondary`, `actions`
**navigation item:** `label`, `target`, `presentation`, `external`
**element:** `label`, `type`, `target`, `presentation`
**states:** `empty`, `loading`, `error` — each `description`, `elements`
**data:** `reads`, `writes`
`x_` fields come last within their object, in author order.

## 11.2 Ordering of collections

- **flows** — author order (meaningful: first flow is the app's start; [§3.2](03-flows.md)).
- **screens** — grouped by flow, in flow document order; within a group, in the flow's `screens` order; screens in multiple flows appear under their first flow; screens in no flow last, sorted by `id`. Fully derived from the data, so any two formatters agree.
- **navigation registry lists** — `primary.screens` in tab order (author order); `secondary.screens` sorted to match the screens ordering above.
- **elements, per-screen lists** — author order (render order is meaning).

## 11.3 YAML style

- 2-space indentation; block style everywhere — never inline (`[]`/`{}`) collections.
- Plain (unquoted) scalars unless YAML requires quoting; the `maias` version header is always double-quoted (`maias: "0.1"`); labels containing `\n` use double quotes.
- One document per file; no anchors, tags, or merge keys; UTF-8; LF line endings; single trailing newline.
- Section comment headers between flow groups **[convention]**, in the established style:

```yaml
# ─────────────────────────────────────────────
#  ONBOARDING
# ─────────────────────────────────────────────
```

## 11.4 Comments & round-trip fidelity

- Comments are non-semantic: they carry no IA meaning and are never validated. Intent belongs in `description` fields ([§1.5](01-document.md)) — comments do not survive JSON serialisation.
- Editors MUST preserve comments through parse → edit → serialise: a comment stays attached to the node it precedes (or trails). `maias fmt` MAY move a comment with its node during reordering but MUST NOT drop it.
- JSON serialisation is canonical-form JSON with the same key order, 2-space indent; comments are lost by nature of the format (accepted: JSON documents are machine-interchange, YAML is the human form).

## 11.5 Why these rules **[convention]**

- *Omit-empty* keeps diffs about substance, not scaffolding.
- *Derived screen ordering* means "add a screen to a flow" diffs as one insertion, and two agents inserting different screens merge cleanly.
- *Fixed key order* means renaming a screen touches exactly the lines that reference it — the rename operation (`maias rename`, the core `rename` API) depends on this.
