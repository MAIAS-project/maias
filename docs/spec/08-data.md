# 8. Data reads & writes

`data` declares a screen's data dependencies: what it consumes and what it produces. This is the IA-level data contract — enough for an implementer or agent to derive state and API needs, without prescribing storage or transport.

## 8.1 Shape

```yaml
data:
  reads:
    - task
    - user_preferences
  writes:
    - task_status
```

| Key | Type | Meaning |
|---|---|---|
| `data.reads` | list of string | Data keys the screen consumes to render. |
| `data.writes` | list of string | Data keys the screen creates or mutates. |

Keys are snake_case strings **[convention]** naming domain data (`cart_items`, `payment_methods`), not implementation artifacts (`api_response`, `redux_store`).

## 8.2 Semantics

- Keys form an app-wide vocabulary: the same key on different screens refers to the same data. Consistent naming is what makes cross-screen analysis possible.
- A key that is written somewhere but never read (or read but never written) is legitimate — external systems exist — but tools MAY surface it in reviews.
- A screen that both reads and writes a key lists it in both.
- v0.1 deliberately stops at named keys. Typed data contracts (shapes, sources) are an anticipated extension — use `x_` fields ([chapter 10](10-extensions.md)) if you need them today.

The [implementation guide](../implementation-guide.md) defines conventions for turning reads/writes into state and API contracts.
