# 2. Screens

A **screen** is the atomic unit of an IA: one uniquely identified view.

## 2.1 Shape

```yaml
- id: task_detail
  title: Task Detail
  type: detail
  path: /tasks/:id
  description: Read-only view of a single task with completion toggle.
  features:
    - task_metadata
    - completion_status
  actions:
    - mark_complete
  elements:
    - label: Task
      type: heading
    - label: Due date | Tomorrow
      type: label_value
    - label: Mark complete
      type: button
  states:
    error:
      description: Task not found or deleted.
  navigation:
    secondary:
      - label: Edit
        target: task_edit
        presentation: modal
    actions:
      - label: Mark complete
  data:
    reads:
      - task
    writes:
      - task_status
  deep_link: true
  auth: none
```

| Key | Type | Required | Meaning |
|---|---|---|---|
| `id` | string | yes **[schema]** | Unique snake_case identifier ([§1.4](01-document.md)). Referenced by flows, navigation, and element targets. |
| `title` | string | yes **[schema]** | Display title. |
| `type` | string | yes **[schema]** | Screen type ([§2.2](#22-screen-types)) or `x_`-prefixed custom type. |
| `path` | string | yes **[schema]** | URL path ([§2.4](#24-route-paths--parameters)). Unique **[lint: error]**. |
| `description` | string | no (**[lint: warning]** if absent) | What the screen does and why it exists. |
| `presentation` | string | no | Default presentation when navigated to: `push` (default) / `replace` / `modal` / `sheet` ([§4.4](04-navigation.md)). |
| `features` | list of string | no | Named content/capability blocks on the screen (documentation-level; snake_case). |
| `actions` | list | no | Interactive elements that don't navigate: plain strings or `{label, external?}` objects. |
| `elements` | list | no | UI element declarations ([chapter 5](05-elements.md)). |
| `states` | object | no | `empty` / `loading` / `error` variants ([chapter 7](07-states.md)). |
| `navigation` | object | no | Outbound navigation ([chapter 4](04-navigation.md)). |
| `data` | object | no | `reads` / `writes` ([chapter 8](08-data.md)). |
| `deep_link` | boolean | no (default `false`) | Externally addressable ([chapter 9](09-links-and-gating.md)). |
| `auth` | string | no (default `none`) | `none` / `required` ([chapter 9](09-links-and-gating.md)). |
| `back` | object | no *(since 0.2)* | Declared back affordance: `{target, label?}` — label defaults to the target's title ([§4.3](04-navigation.md)). No `back` = no back button. |

`features` and `elements` answer different questions: `features` names *what the screen offers* (for humans and reviewers), `elements` declares *what is on it* (for renderers). A screen MAY have either, both, or neither; renderers without `elements` fall back to rendering the screen's metadata (title, description, features, navigation).

## 2.2 Screen types

Screen types are semantic categories. They guide rendering, review, and generation; they do not restrict which elements a screen may contain.

| Type | Description |
|---|---|
| `action` | Single-purpose action trigger |
| `action_sheet` | Bottom sheet with multiple choices |
| `container` | Parent screen grouping child screens |
| `detail` | Read-only detail view |
| `form` | User input / editable fields |
| `informational` | Static content / instructions |
| `list` | Scrollable list of items |
| `map` | Map-based interface |
| `marketing` | Promotional / value-proposition content |
| `menu` | Navigation menu with links to sub-screens |
| `search` | Search input with results |
| `status` | Live status display (e.g. order tracking) |

Custom screen types MUST be `x_`-prefixed **[schema]**; renderers treat unknown types as `informational` ([chapter 10](10-extensions.md)).

## 2.3 The navigation registry

Every screen MUST appear in exactly one of `app.navigation.primary.screens` or `app.navigation.secondary.screens` **[lint: error]** ([chapter 4](04-navigation.md)). A screen in neither is unregistered; a screen in both is ambiguous.

## 2.4 Route paths & parameters

- Paths MUST start with `/` and consist of kebab-case segments: `^/[a-z0-9-]+(/([a-z0-9-]+|:[a-z][a-z0-9_]*))*$` **[schema]**.
- A segment starting with `:` is a **parameter**: `/tasks/:id` matches `/tasks/42` and binds `id = "42"`. Parameter names are snake_case.
- Two screens MUST NOT have paths that match the same concrete URL **[lint: error]** — this includes exact duplicates and pattern collisions (e.g. `/tasks/:id` vs `/tasks/:task_id`).
- Static segments win over parameters when both match (e.g. `/tasks/new` and `/tasks/:id`): consumers MUST resolve to the static path.
- Paths are hierarchical documentation of the IA — nesting SHOULD mirror the navigation structure (e.g. children of a hub live under the hub's path) **[convention]**.
