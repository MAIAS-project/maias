# 10. Extensions

MAIAS is designed to be extended without breaking any consumer. Two mechanisms: **custom types** and **`x_` fields**. Both rest on one guarantee:

> **The fallback guarantee.** A consumer encountering an unknown element type, screen type, or `x_` field MUST NOT fail. Renderers MUST render unknown element types via a visible fallback; validators MUST NOT report them as errors.

This is what lets a document written for spec 0.2 open in a 0.1 renderer, and lets teams model domain concepts the core taxonomy lacks.

## 10.1 Custom element types

Any element `type` outside the [core taxonomy](05-elements.md) is a custom type.

```yaml
elements:
  - label: Photos | Ratings | Reviews
    type: x_shop_reviews_carousel
```

- Custom types MUST be prefixed `x_` **[lint: warning if unprefixed]** and SHOULD include a vendor/app segment (`x_<vendor>_<name>`) to avoid collisions **[convention]**.
- An unprefixed unknown type is treated as a probable typo: **[lint: warning]**, never an error.
- Renderers MUST fall back: the reference rendering is a dashed box showing the type badge and label — the document stays fully browsable.
- Adapters MAY register components for custom types, upgrading them from fallback to real rendering ([adapter guide](../adapters.md)).

## 10.2 Custom screen types

Screen `type` accepts the core enum or an `x_`-prefixed string **[schema]** (unprefixed unknown screen types are schema-invalid — the screen-type vocabulary is load-bearing for tools, so typos must be caught).

```yaml
- id: ar_view
  type: x_shop_ar_viewer
```

Renderers treat unknown screen types as `informational` and render the screen's metadata and elements normally.

## 10.3 `x_` fields

Any object in the document MAY carry extra fields prefixed `x_` **[schema: patternProperties]**: document root, `app`, screens, flows, navigation items, elements, states.

```yaml
- id: subscription
  title: Subscription
  type: marketing
  path: /profile-hub/subscription
  x_experiment: paywall_v2
  x_owner_team: growth
```

- Consumers MUST ignore `x_` fields they don't understand and MUST preserve them through edits (round-trip fidelity).
- Unknown fields **without** the `x_` prefix are schema errors — this is what keeps typos (`descripton:`) from silently passing.

## 10.4 Extension etiquette **[convention]**

- Prefer core constructs; extend only when the concept genuinely isn't expressible.
- Document your extensions in the same repo as the document (a short EXTENSIONS.md next to the IA).
- Recurring extensions across projects are candidates for the next spec minor version — propose them via the [changelog process](CHANGELOG.md).
