# 7. Screen states

A screen's `elements` describe its **default** state. The optional `states` object documents how the screen varies when there is nothing to show, content is loading, or something failed.

## 7.1 Shape

```yaml
- id: task_list
  title: My Tasks
  type: list
  path: /tasks
  elements:
    - label: Search tasks
      type: search_bar
    - label: Buy milk
      type: list_item
      target: task_detail
  states:
    empty:
      description: First run, or all tasks deleted.
      elements:
        - label: No tasks yet — add your first one
          type: empty_state
        - label: Add task
          type: button
          target: task_new
    loading:
      description: Tasks syncing from the server.
    error:
      description: Sync failed; retry available.
      elements:
        - label: Couldn't load your tasks
          type: banner
        - label: Retry
          type: button
```

| Key | Type | Meaning |
|---|---|---|
| `states.empty` / `states.loading` / `states.error` | object | The three non-default variants. Only these three keys are allowed **[schema]**. |
| `<state>.description` | string | When this state occurs. SHOULD be present **[convention]**. |
| `<state>.elements` | list | Full replacement element list for the state ([chapter 5](05-elements.md)). Optional — a state may be documentation-only. |

## 7.2 Semantics

- A state's `elements` **replace** the default list entirely (no merging) — each state is a complete, self-describing view.
- A state without `elements` documents that the state exists; renderers MAY show a generic representation (e.g. skeleton bars for `loading`).
- Element `target`s inside states are validated like any other **[lint: error]** on dangling references.
- Declaring `states` is most valuable on `list`, `search`, and `status` screens — screens whose content depends on data **[convention]**.

Renderers SHOULD provide a way to preview each declared state (the reference browser exposes a state switcher on screens that declare them).
