# MAIAS Specification v0.2

**MAIAS (Mobile App Information Architecture Schema)** — an open standard for describing an app's information architecture: screens, navigation, flows, UI elements, states, and data dependencies, in one document readable by humans and operable by agents.

- Formal machine definition: [`schema/maias.schema.json`](../../schema/maias.schema.json) (JSON Schema 2020-12)
- Condensed agent reference: [`llms.txt`](llms.txt) — sufficient to author a valid document without reading these chapters
- Changes: [CHANGELOG.md](CHANGELOG.md) · how the spec evolves: [GOVERNANCE.md](GOVERNANCE.md)

## Chapters

| # | Chapter | Covers |
|---|---|---|
| 1 | [Document structure](01-document.md) | Top-level shape, metadata, `maias` version header, serialisation (YAML/JSON) |
| 2 | [Screens](02-screens.md) | Screen objects, screen types, route paths & parameters, descriptions |
| 3 | [Flows](03-flows.md) | User journeys, entry screens, flow membership |
| 4 | [Navigation](04-navigation.md) | Primary/secondary/actions, targets, presentation modes |
| 5 | [Elements](05-elements.md) | The design-system-neutral element taxonomy (29 core types) |
| 6 | [App chrome](06-app-chrome.md) | Derived global elements: tab bar, screen headers |
| 7 | [Screen states](07-states.md) | `default` / `empty` / `loading` / `error` variants |
| 8 | [Data](08-data.md) | `data.reads` / `data.writes` contracts |
| 9 | [Deep links & gating](09-links-and-gating.md) | External addressability, auth annotations |
| 10 | [Extensions](10-extensions.md) | Custom element/screen types, `x_` fields, fallback guarantee |
| 11 | [Canonical form](11-canonical-form.md) | Deterministic ordering & formatting rules (`maias fmt`) |

## Conformance language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are to be interpreted as in RFC 2119. Rules are enforced at three levels, marked throughout:

- **[schema]** — enforced by `schema/maias.schema.json`; violations make a document invalid.
- **[lint]** — semantic rules enforced by `maias validate` beyond the schema (e.g. cross-references); `error` severity makes a document invalid, `warning` does not.
- **[convention]** — style/authoring guidance; never affects validity.

## Conformance classes

- **Document**: valid iff it passes schema validation and has no lint errors.
- **Renderer** (e.g. the MAIAS Browser): MUST render every valid document; MUST render unknown element/screen types via a visible fallback and MUST NOT fail on them (see [Extensions](10-extensions.md)).
- **Editor** (agents, tools): MUST preserve round-trip fidelity (parse → edit → serialise loses nothing but the edit, including comments) and SHOULD emit [canonical form](11-canonical-form.md).
