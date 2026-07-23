# MAIAS Spec Changelog

Spec versions are `<major>.<minor>`. Minor versions are additive ([§1.3](01-document.md)). The JSON Schema `$id` tracks the spec version.

## Pre-release renumbering — 2026-07-23 (versions renumbered, no semantic change)

The spec versions were renumbered **1.0 → 0.1** and **1.1 → 0.2** to reflect the project's pre-release status: MAIAS is pre-1.0, and the format may change in breaking ways between 0.x versions. The format itself is unchanged — this is a pure renumber. The schema now accepts only `0.x` version headers (`1.x` headers are rejected); with no published documents in existence beyond this repo's examples, no migration path is defined. Historical entries below have been renumbered to match.

## Validator: version–feature gating — 2026-07-18 (no version bump)

New lint warning `MAIAS-W009`: a document declaring `maias: "0.1"` while using the 0.2-only `back:` key stays valid but is flagged, one warning per offending screen (§1.3). Decision D28 — found by a documentation-sufficiency test in which a context-free agent guessed the lower version and was accepted silently.

## Project rename — 2026-07-07 (no version bump)

The project was renamed **AIAS → MAIAS** (Mobile App Information Architecture Schema) before first publication. Everything renamed in one change-set: the document version header key (`aias:` → `maias:`), the schema file and `$id` (`urn:maias:schema:0.2`), diagnostic code prefix (`MAIAS-*`), package names (`@maias/*`), the `maias` CLI binary, and example filenames (`maias.yaml`). The spec version is unchanged by the rename — the format itself is identical, and with no published documents in existence, no migration path is defined for the old header key.

## 0.2 — 2026-07-06

- **Declared back navigation** (§4.3, §6.2): new optional screen key `back: {target, label?}`. The header back affordance now comes from the document — label defaults to the target screen's title; no `back` means no back button. Replaces the 0.1 model of history-derived back chrome; the old "Back as a secondary navigation item" idiom is now explicitly non-conforming convention.
- `back.target` participates in reference integrity: dangling-target lint, rename cascade, safe removal.
- Canonical key order: `back` after `deep_link`; within it `label`, `target`.

## 0.1 — 2026-07-06 (final; drafted 2026-07-05)

Initial specification, generalised from the origin prototype:

- Document structure with `maias: "0.1"` version header; YAML primary, JSON equivalent.
- Screens with 12 semantic types, kebab-case paths with `:param` segments.
- Flows with entry screens; reachability and orphan semantics.
- Two-level navigation (app registry + per-screen links); presentation modes `push`/`replace`/`modal`/`sheet`.
- Element taxonomy: 29 design-system-neutral core types (26 evolved from the prototype's `wf_*` library — renamed per D15 — plus `radio_group`, `slider`, `video`).
- Derived app chrome (tab bar from `navigation.primary`, headers).
- Screen states: `empty` / `loading` / `error`.
- Data reads/writes as named keys.
- Deep links (`app.links.scheme` + per-screen `deep_link`) and auth gating (`none`/`required`).
- Extension mechanism: `x_` element/screen types and `x_` fields; fallback guarantee.
- Canonical form rules (key order, derived screen ordering, omit-empty, comment preservation).

Draft status cleared 2026-07-06: the validator enforces this spec (51-test suite), a 55-screen real-world IA migration passed with zero errors, and the end-to-end authoring tests (llms.txt-only, implementation-guide-only) passed on fresh agents.
