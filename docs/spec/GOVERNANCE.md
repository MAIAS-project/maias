# MAIAS Spec Governance

How the MAIAS standard evolves, and what you can rely on.

## Versioning & compatibility

Spec versions are `<major>.<minor>` ([§1.3](01-document.md)); the JSON Schema's `$id` tracks the spec version, and every document declares the version it targets in its `maias:` header.

- **Minor versions are strictly additive.** A valid `1.x` document is a valid `1.(x+n)` document. New optional keys, new core element/screen types, and new lint *warnings* are minor; anything that invalidates an existing document, changes a construct's meaning, or adds a lint *error* is major.
- **Major versions are not planned lightly.** Pre-2.0, the project treats format breaks as a last resort; documents are meant to be durable artifacts.
- Each change lands in the [CHANGELOG](CHANGELOG.md) with its version.

## The no-drift rule

A spec change is not a prose edit — it lands as **one change-set** covering the spec chapter(s), `schema/maias.schema.json`, the validator, `llms.txt`, and the examples, with the test suite green. This is the project's oldest working rule (R1.10) and the reason the spec, the schema, and every tool always agree. Proposals are evaluated with this cost in view: a construct must be worth specifying, validating, condensing into llms.txt, and rendering.

## Proposing a change

1. **Open an issue describing the IA-modelling problem**, not the proposed syntax — what can't be expressed, or what tools can't rely on. Real documents that hit the limitation are the strongest evidence.
2. Discussion settles whether it's spec-worthy, an `x_` extension ([chapter 10](10-extensions.md)), or a tooling concern. The extension mechanism is the pressure valve: anything expressible as `x_` types/fields should prove demand there before entering the core.
3. Accepted proposals become a PR implementing the full no-drift change-set. Non-trivial decisions are recorded in the project decision log with context, options, and rationale.

## Decision-making

The project currently has a single maintainer, who acts as final arbiter on spec changes (a BDFL model, honestly labelled). The bar for moving to shared governance — named co-maintainers, then a lightweight spec committee — is sustained outside contribution to the standard itself. If that happens, this page changes first.

## What is stable today

- The `maias: "1.x"` document shape, the 12 screen types, the 29 core element types, and canonical form ([chapter 11](11-canonical-form.md)).
- The fallback guarantee ([§5.4](05-elements.md)): unknown element types render via fallback and never error — this is what makes additive evolution safe, and it is not up for revision.
