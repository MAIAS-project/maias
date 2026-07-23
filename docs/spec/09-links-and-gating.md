# 9. Deep links & gating

## 9.1 Deep links

External addressability: which screens can be opened directly from outside the app (push notification, shared URL, OS integration).

```yaml
app:
  links:
    scheme: shopfront       # app URL scheme → shopfront://…

screens:
  - id: product
    path: /products/:id
    deep_link: true         # shopfront://products/abc-123 opens this screen
```

| Key | Type | Meaning |
|---|---|---|
| `app.links.scheme` | string | The app's URL scheme (lowercase letters, digits, `-`). |
| screen `deep_link` | boolean (default `false`) | Screen is directly openable at `<scheme>://<path>` with parameters bound from the URL. |

Rules:
- `deep_link: true` on any screen without `app.links.scheme` is a **[lint: warning]** — the intent is clear but the scheme is missing.
- Deep-linked screens SHOULD be self-sufficient: everything needed to render arrives via path parameters and `data.reads`, not navigation history **[convention]**.
- Consumers opening a deep link MUST still honour the screen's `auth` gate ([§9.2](#92-auth--gating)).

## 9.2 Auth & gating

A minimal annotation for access control at the IA level:

```yaml
- id: account_details
  auth: required
```

| Value | Meaning |
|---|---|
| `none` (default) | Freely accessible. |
| `required` | Requires an authenticated user; consumers route unauthenticated users to the auth journey first. |

Rules:
- `auth` is per-screen and does not inherit — gate each screen explicitly. (Screens reachable *only* through a gated screen are effectively gated at runtime, but the annotation is what tools can rely on.)
- Navigating from a gated screen to an ungated one is fine; the reverse triggers the gate.
- v0.1 deliberately stops at two values. Roles, subscriptions, and feature flags are anticipated extensions — model them with `x_` fields (e.g. `x_gate: subscribers_only`) until the spec grows a richer vocabulary ([chapter 10](10-extensions.md)).

Renderers in browse/prototype mode (like the MAIAS Browser) MAY visually badge gated screens instead of enforcing the gate.
