# 3. Flows

A **flow** groups screens into a logical user journey (onboarding, checkout, …). Flows are the unit of navigation intent: they define where journeys start and which screens belong together.

## 3.1 Shape

```yaml
app:
  flows:
    - name: checkout
      description: From cart to order confirmation.
      entry_screen: cart
      screens:
        - cart
        - checkout_address
        - checkout_payment
        - order_confirmation
```

| Key | Type | Required | Meaning |
|---|---|---|---|
| `name` | string | yes **[schema]** | snake_case identifier, unique across flows **[lint: error]**. |
| `description` | string | no | The journey's purpose. SHOULD be present **[convention]**. |
| `entry_screen` | string | yes **[schema]** | Screen ID where the journey starts. MUST exist **[lint: error]** and MUST be listed in `screens` **[lint: error]**. |
| `screens` | list of string | yes, ≥1 **[schema]** | Screen IDs belonging to the flow, in journey order. Every ID MUST exist **[lint: error]**. |

## 3.2 Rules

- At least one flow MUST exist **[schema]**; the first flow in the list is the app's starting journey — its `entry_screen` is where the app opens **[convention: renderers use it as the initial route]**.
- A screen MAY belong to multiple flows (e.g. a login screen reachable from several journeys).
- A screen in no flow is not an error by itself, but a screen in no flow **and** unreachable ([§3.3](#33-reachability)) is an **orphan** **[lint: warning]**.
- Flow order in the document is meaningful: tools (e.g. quick navigation, canonical formatting) present flows in document order.

## 3.3 Reachability

A screen is **reachable** if it can be arrived at from the app's structure:

- it is listed in `app.navigation.primary.screens` (always accessible via the tab bar), or
- it is the `entry_screen` of any flow, or
- it is the `target` of any navigation item or element on a reachable screen (transitively).

`maias validate` reports unreachable screens **[lint: warning]** and orphans (unreachable *and* in no flow) **[lint: warning]**. These are warnings, not errors: work-in-progress documents legitimately contain screens that aren't wired up yet.
