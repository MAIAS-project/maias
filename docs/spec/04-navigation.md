# 4. Navigation

Navigation is declared at two levels: the app-level **registry** (which screens exist globally) and per-screen **outbound links**.

## 4.1 The app-level registry

```yaml
app:
  navigation:
    primary:
      label: Primary Nav
      screens:
        - map_hub
        - list_hub
        - profile_hub
    secondary:
      label: Secondary Nav
      screens:
        - welcome
        - login
        # … every other screen
```

| Key | Type | Required | Meaning |
|---|---|---|---|
| `primary.screens` | list of string | yes **[schema]** | Screens in the persistent tab bar, in tab order. Each becomes a tab ([chapter 6](06-app-chrome.md)). |
| `secondary.screens` | list of string | yes **[schema]** | Registry of every non-primary screen. |
| `primary.label`, `secondary.label` | string | no | Display label for the group. |

Rules:
- Every screen MUST appear in exactly one of the two lists **[lint: error]** (missing → unregistered; both → ambiguous).
- Every listed ID MUST exist in `screens` **[lint: error]**.
- Renderers SHOULD hide the tab bar when `primary.screens` has fewer than 2 entries.

## 4.2 Per-screen navigation

```yaml
navigation:
  primary:                # only on primary screens: the tab bar as seen from here
    - label: Map
      target: map_hub
  secondary:              # contextual links to other screens
    - label: Filters
      target: filters
      presentation: sheet
  actions:                # interactive, non-navigating
    - label: Centre on my location
    - label: Rate this app
      external: true
```

| Key | Where | Meaning |
|---|---|---|
| `navigation.primary` | primary screens only **[lint: warning]** on others | Tab-bar items. Redundant with the registry by design — it documents the tab bar from this screen's perspective and MUST be consistent with `app.navigation.primary.screens` **[lint: warning]**. |
| `navigation.secondary` | any screen | Contextual links. Each item: `label` (required), `target` (required screen ID), `presentation` (optional, [§4.4](#44-presentation-modes)). |
| `navigation.actions` | any screen | Non-navigating interactions: `label` (required), `external` (optional boolean — leaves the app, e.g. a web link). |

Every `target` — in navigation items and in [elements](05-elements.md) — MUST be an existing screen ID **[lint: error]**. This is the dangling-target rule; it catches errors like a `welcome` screen targeting a non-existent `register-apple`.

A target equal to the containing screen's own ID is a self-reference **[lint: warning]**.

## 4.3 Back navigation *(changed in 0.2)*

Back is **declared per screen**, not derived from navigation history — the document states where "back" leads, so the affordance is deterministic and reviewable:

```yaml
- id: email_sign_up
  # …
  back:
    target: register        # required — existing screen id [lint: error on dangling]
    # label: Back           # optional — default is the target screen's title
```

- A screen with `back` gets a back affordance in its header labelled `label`, or the **target screen's title** when `label` is omitted. Use an explicit `label: Back` where the target's title would read oddly.
- A screen without `back` has **no back affordance** (typical for tab-root screens and journey entry points).
- Renderers SHOULD honour real history when following a back link (return to the existing entry rather than pushing a new one).
- Documents MUST NOT declare "Back" as an ordinary `navigation.secondary` item **[convention]** — that was the pre-0.2 idiom; use the `back` key.

## 4.4 Presentation modes

How a screen appears when navigated to. Declared on the **screen** (its default) and overridable per **link** (navigation item or element with a `target`):

| Mode | Meaning | Renderer behaviour |
|---|---|---|
| `push` (default) | Advance within the journey | Pushed onto the stack; back affordance |
| `replace` | Transition between journeys (e.g. onboarding → main) | Replaces history; no back to the previous flow |
| `modal` | Focused task interrupting context | Full-screen overlay; dismiss affordance |
| `sheet` | Lightweight choice/detail | Bottom sheet; dismiss affordance |

Resolution order: link-level `presentation` → target screen's `presentation` → `push`.

Screens of type `action_sheet` SHOULD declare `presentation: sheet` **[lint: warning]** if they declare nothing.
