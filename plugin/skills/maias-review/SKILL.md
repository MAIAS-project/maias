---
name: maias-review
description: Review a MAIAS document — run the validator, then critique the IA itself for UX depth, dead ends, and inconsistent navigation patterns. Use when asked to review, audit, or sanity-check an IA/MAIAS file.
---

# maias-review

Two layers: mechanical validation (the toolchain's job) and semantic critique of the information architecture (yours).

## Layer 1 — mechanical (always first)

Use the `maias` MCP server's `validate` tool (this plugin connects it), or equivalently:

```
npx -y @maias/cli validate <file> --json
```

Report every finding with its line reference. Errors make the document invalid — lead with them. When there are zero diagnostics, say exactly that in one line ("validator: clean — 0 errors, 0 warnings") and move on to Layer 2; do not pad the mechanical layer. Ground any spec questions in `reference/llms.txt` (bundled in this skill's directory); for specific constructs, the full chapters live at `https://github.com/MAIAS-project/maias/tree/main/docs/spec` — states → `07-states.md`, auth/deep links → `09-links-and-gating.md`, presentation modes → `04-navigation.md`.

## Layer 2 — semantic critique

The validator proves the document is well-formed; you judge whether the *IA is good*. Work through:

**Journey integrity**
- Dead ends: screens with no outbound navigation that aren't natural terminals (confirmations are fine; a form with no continue is not).
- Journeys without exits: does each flow's last screen lead somewhere (`replace` into the main experience, or back)?
- Entry/exit seams: are flow transitions marked `presentation: replace` where back-navigation into a finished journey would be wrong (post-auth, post-checkout)?

**Navigation consistency**
- Similar screens, similar patterns: do all detail screens open the same way? Are modals used for the same class of task everywhere?
- Hub balance: tabs with one screen vs. tabs hiding fifteen — is depth where the user expects it?
- Self-targets and circular pairs the validator only warns about: are they intentional?

**UX depth**
- Data-bearing screens (`list`, `search`, `status`) without `states` — what does the user see on first run, on failure?
- `auth: required` coverage: is anything sensitive ungated? Is anything public gated?
- Deep links: are the shareable things (`detail` screens) addressable? Do deep-linked screens depend only on path params + `data.reads`?

**Data flow smells**
- Keys written but never read (or read but never written) — external systems, or dead wiring?
- Same concept under two key names (`user` vs `account_profile`).

**Descriptions**
- Missing or vacuous descriptions (`description: The settings screen.`) — intent must travel with structure.

## Output

1. **Validator findings** — table of errors then warnings, with line refs.
2. **Semantic findings** — grouped by the categories above, each with the screen/flow id, why it matters, and a concrete fix. When a semantic finding overlaps a validator warning (an unreachable screen is usually also a journey problem), reference the code once — don't restate it as a separate finding.
3. **Verdict** — valid? ship-shaped? the three highest-impact improvements.

Do not fix anything unless asked — this skill reports. (Fixes are maias-edit's job.)
