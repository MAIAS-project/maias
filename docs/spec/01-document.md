# 1. Document structure

## 1.1 Serialisation

YAML 1.2 is the primary serialisation; the standard is format-agnostic. An equivalent JSON document MUST validate identically against `schema/maias.schema.json` — no construct may rely on YAML-only features (anchors, tags, merge keys MUST NOT be used **[convention]**; parsers MAY reject them). Comments are permitted in YAML, carry no meaning, and MUST survive machine edits (see [Canonical form](11-canonical-form.md)).

Recommended filename: `maias.yaml` (or `<app_name>.maias.yaml`) **[convention]**.

## 1.2 Top-level shape

```yaml
maias: "0.1"          # spec version header
app:                 # app-level metadata & structure
  name: Todo List
  description: A minimal list-keeping app.
  links:
    scheme: todo
  navigation:
    primary:
      label: Primary Nav
      screens:
        - home
    secondary:
      label: Secondary Nav
      screens:
        - task_detail
  flows:
    - name: main
      entry_screen: home
      screens:
        - home
        - task_detail
screens:
  - id: home
    # … see chapter 2
```

| Key | Type | Required | Meaning |
|---|---|---|---|
| `maias` | string | yes **[schema]** | Spec version this document targets: `"0.1"` or `"0.2"` (current). Always a quoted string, never a number. Declare the lowest version that covers the features in use — `back:` requires `"0.2"` **[lint: warning]**. |
| `app` | object | yes **[schema]** | App metadata and structure (below). |
| `screens` | list | yes, ≥1 **[schema]** | All screen definitions ([chapter 2](02-screens.md)). |

### `app`

| Key | Type | Required | Meaning |
|---|---|---|---|
| `app.name` | string | yes **[schema]** | Display name of the app. |
| `app.description` | string | no | What the app is/does. SHOULD be present — it is the first thing a reader or agent sees **[convention]**. |
| `app.links` | object | no | Deep-link configuration ([chapter 9](09-links-and-gating.md)). |
| `app.navigation` | object | yes **[schema]** | The navigation registry ([chapter 4](04-navigation.md)). |
| `app.flows` | list | yes, ≥1 **[schema]** | Flow definitions ([chapter 3](03-flows.md)). |

## 1.3 Versioning

- The `maias` header declares the **spec version** as `"<major>.<minor>"`.
- Minor versions are additive: a `0.2` document that uses no `0.2` features is a valid `0.1` document.
- The reverse — a document declaring `0.1` while using `0.2`-only constructs (`back:`) — stays valid but is flagged **[lint: warning `MAIAS-W009`]**: the header is a declaration of the feature set in use, and the fix is always to declare the higher version.
- Consumers encountering a **newer minor** version than they support SHOULD proceed, treating unknown constructs per the [extension fallback rules](10-extensions.md). Consumers encountering a different **major** version MAY refuse with a clear message.
- Spec changes are recorded in [CHANGELOG.md](CHANGELOG.md); the schema's `$id` carries the same version.

## 1.4 Identifier & naming rules

| Kind | Rule | Example |
|---|---|---|
| Screen IDs | `snake_case`: `^[a-z][a-z0-9_]*$` **[schema]**, unique **[lint: error]** | `checkout_payment` |
| Flow names | `snake_case`, unique **[lint: error]** | `checkout` |
| URL paths | kebab-case segments, leading `/`, optional `:param` segments ([§2.4](02-screens.md)) **[schema]**, unique **[lint: error]** | `/account/order-history` |
| Element types | `snake_case`; custom types `x_`-prefixed ([chapter 10](10-extensions.md)) | `text_field`, `x_shop_reviews_carousel` |
| Data keys | `snake_case` **[convention]** | `cart_items` |
| Labels | Title Case **[convention]** | `Saved Addresses` |

## 1.5 Descriptions carry intent

Structure says *what*; `description` fields say *why/for whom*. `description` is supported on the app, every screen, every flow, and every state variant. Screens without a description trigger a **[lint: warning]**. Do not put intent in YAML comments — comments survive edits but do not travel through JSON serialisation; descriptions do.
