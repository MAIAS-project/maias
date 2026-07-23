# Implementation guide: from a MAIAS document to a real app

How a developer or agent turns a MAIAS document into a working application (R6.3). This is the document to read when asked to **"build the app described in this file"**. It defines conventions, not mandates — deviate deliberately, and record why.

Companion references: the spec ([docs/spec/](spec/README.md), condensed: [llms.txt](spec/llms.txt)); the MAIAS Browser (`MAIAS_browser/`) is a living implementation of these conventions.

## The mapping at a glance

| MAIAS construct | Becomes |
|---|---|
| `app.name`, `app.description` | App display name, store/readme copy |
| `screens[]` | One route/screen module each; `path` is the route path verbatim (`:param` → the router's param syntax) |
| `app.navigation.primary.screens` | The tab bar / root navigator, in order; hide the bar if <2 |
| `app.navigation.secondary.screens` | Non-tab routes registered on the enclosing stack |
| `flows[]` | Navigation stacks / groups and the seams between them; first flow's `entry_screen` = initial route |
| `presentation` (`push`/`replace`/`modal`/`sheet`) | Navigator action (`push`/`replace`) or screen presentation option (`modal`/`sheet`) |
| screen `elements[]` | The screen's component tree, top to bottom |
| `states` (`empty`/`loading`/`error`) | Conditional render branches keyed on the screen's data status |
| `data.reads` / `data.writes` | State selectors / queries and mutations — the app's data contract |
| `deep_link` + `app.links.scheme` | Linking configuration entries |
| `auth: required` | Route guard / gated group |
| `x_*` fields & element types | Ignore unless you know them; never fail on them |

## 1. Screens → routes

- One module per screen, named after the screen `id`.
- Use the document `path` as the route path. Parameters (`:id`) bind to route params; a deep-linked screen MUST be renderable from its params plus `data.reads` alone (no reliance on in-memory navigation state).
- Static-over-param precedence (spec §2.4) is native to most routers; if yours is ambiguous, register static paths first.

## 2. Flows → navigation structure

- `navigation.primary.screens` defines the tab navigator: one tab per screen, document order, label = screen `title`.
- **Where a screen registers** — decided by how it is *presented*, then where it *nests*:
  - `modal` / `sheet` screens register on the **root stack** (they present over the tab bar);
  - pushed screens whose paths nest under a tab's path belong to **that tab's stack**;
  - tab-root screens sit at the tab's index route — the document `path` remains the canonical (deep-link) URL; add a route alias or redirect if you want it verbatim in the address bar.
- Flows mark **journey seams**: when a link crosses out of a flow whose purpose is complete (onboarding → main, checkout → confirmation), the document says `presentation: replace` — implement it as a history replacement so back cannot re-enter the dead journey. `replace` appears on links and on elements alike (`button` with `presentation: replace`); both mean the same navigator action. Per spec §4.4, a link-level presentation always wins over the target screen's default — apply each link's own value.
- The first flow's `entry_screen` is the app's initial route. If it isn't a primary screen (e.g. a welcome journey), the app opens on that journey and `replace`s into the tabbed shell when it completes.
- Concrete presentation values are router-specific: in Expo Router / native-stack, `modal` → `presentation: 'modal'` and `sheet` → `presentation: 'formSheet'`.

## 3. Elements → components

- Map each element type to your design system's component (the [taxonomy table](spec/05-elements.md) gives per-type semantics; the [adapter guide](adapters.md) shows the registry pattern).
- Render order = document order.
- Structured labels: split `|` for `chips`/`segmented_control`/`radio_group`/`label_value`, `\n` for `bullets`; the literal `none` means skeleton placeholders.
- `target`-bearing elements navigate (honouring `presentation`); targetless interactive elements are local actions — wire them to handlers named from the screen's `actions:` list.
- Unknown types: render a labelled placeholder, never crash (spec §10.1).

## 4. Data reads/writes → state & API contracts

- Each distinct key across all `data.reads`/`data.writes` is one **data entity**. The same key on different screens is the same entity — build one source of truth (store slice, query key, or endpoint) per key.
- `reads` → the screen subscribes/queries that entity; drive the `loading`/`error`/`empty` states from that query's status.
- `writes` → the screen owns a mutation for that entity; screens that read the same key must observe the change.
- A useful derivation: `grep` every key and the screens using it → that's the app's state-management inventory and a first cut of its API surface (read endpoints for read-only keys, CRUD for read+write keys).

## 5. Auth & deep links

- `auth: required` screens sit behind a guard: unauthenticated users are routed to the auth journey, then returned. Gate each marked screen — gating is per-screen, not inherited (spec §9.2).
- If the document declares no auth screens (gates without a journey), scaffold a placeholder sign-in route, mark it clearly as an addition the document does not define, and flag the gap back to the document's author — it is an IA omission, not yours to silently design.
- Register `deep_link: true` screens with the OS under `<scheme>://<path>`; the guard still applies on arrival. (In Expo, the scheme goes in `app.json`; Expo Router derives the per-route linking table from the file tree.)

---

## Worked example: `examples/todo_list` → Expo Router

The document: 5 screens, 2 tabs (`home`, `settings`), flows `main` (home, task_detail, task_new) and `settings` (settings, about).

### Routing skeleton

```
app/
├── _layout.tsx              # Root stack; task_new is presented modally
├── (tabs)/
│   ├── _layout.tsx          # Tabs from navigation.primary: home, settings
│   ├── index.tsx            # home  (path /tasks → tab root)
│   └── settings/
│       ├── index.tsx        # settings (auth-gated)
│       └── about.tsx        # about  (/settings/about nests under the settings tab)
├── tasks/
│   ├── [id].tsx             # task_detail (/tasks/:id, deep-linked: todo://tasks/42)
│   └── new.tsx              # task_new (/tasks/new; static wins over /tasks/:id)
```

```tsx
// app/_layout.tsx — presentation: modal from the document
<Stack>
  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
  <Stack.Screen name="tasks/[id]" options={{ title: 'Task Detail' }} />
  <Stack.Screen name="tasks/new" options={{ presentation: 'modal', title: 'New Task' }} />
</Stack>
```

```tsx
// app/(tabs)/_layout.tsx — one tab per navigation.primary entry, in order
<Tabs>
  <Tabs.Screen name="index" options={{ title: 'My Tasks' }} />
  <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
</Tabs>
```

### Data contract (from `data.reads`/`data.writes`)

| Key | Read by | Written by | Implementation |
|---|---|---|---|
| `tasks` | home | — | list query; its status drives home's `empty`/`loading`/`error` states |
| `task` | task_detail | task_new | fetch by `:id`; created by the form |
| `task_status` | — | task_detail | completion mutation, invalidates `tasks` + `task` |

### States (home)

```tsx
const { data: tasks, status } = useTasks();          // reads: tasks
if (status === 'pending') return <HomeLoading />;    // states.loading
if (status === 'error')   return <HomeError />;      // states.error (banner + retry per the document)
if (tasks.length === 0)   return <HomeEmpty />;      // states.empty (empty_state + "Add task" button)
return <TaskList tasks={tasks} />;                   // default elements
```

### Gates & links

- `settings` → wrap in the auth guard; `about` inherits nothing — it's ungated by the document.
- `task_detail` has `deep_link: true` + scheme `todo` → linking config maps `todo://tasks/:id`; the screen loads from the `id` param and the `task` read only.

An agent following this section against `examples/todo_list/maias.yaml` should produce the skeleton above (or its equivalent in another router) without further input — that equivalence is the Phase 9 acceptance test for this guide.
