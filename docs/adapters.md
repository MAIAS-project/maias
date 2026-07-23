# Authoring a design-system adapter

An **adapter** teaches the MAIAS Browser to render documents in a particular design system. An adapter is just data: a component registry mapping MAIAS element types → React Native components, plus a theme (R3.5).

```ts
// MAIAS_browser/lib/adapters/types.ts
interface MaiasAdapter {
  id: string;                                            // 'wireframe' | 'shadcn' | …
  name: string;                                          // switcher label
  description: string;                                   // switcher one-liner
  components: Partial<Record<string, ElementComponent>>; // element type → component
  theme: AdapterTheme;                                   // color tokens
}

type ElementComponent = React.ComponentType<{
  element: Element;                                      // typed element from @maias/core
  onNavigate?: (target: string, presentation?: Presentation) => void;
}>;
```

## The fallback chain — you never have to be complete

Element resolution (in `lib/adapters/context.tsx`):

```
active adapter's component  →  wireframe adapter's component  →  wireframe fallback box
```

- Skip any element type you haven't styled yet: the **wireframe adapter** renders it.
- Element types unknown to *every* adapter (custom `x_*` types, future spec versions) render as the wireframe **fallback box** — a dashed outline with a type badge. Per the spec's fallback guarantee (§10.1) this must never error, and the chain makes that structural: `resolveElement` always returns a component.

The shipped **Blueprint** adapter (`lib/adapters/blueprint.tsx`) is the worked example of a partial adapter: 7 restyled types, everything else wireframe.

## Writing components

Each component receives the raw `Element` from the document and interprets its fields per the element taxonomy ([spec chapter 5](spec/05-elements.md)):

- `label` — text content; respect the structured formats (`|`-separated for `chips`/`segmented_control`/`label_value`/`radio_group`, `\n`-separated for `bullets`, the `none` skeleton sentinel).
- `target` — when present, the element navigates: call `onNavigate(element.target, element.presentation)` from your press handler. When absent, render non-interactively.
- Never throw on missing/odd labels — degrade visually.

Keep components presentation-only: no data fetching, no navigation logic beyond calling `onNavigate` (presentation-mode resolution happens in the browser core).

## Theme

`theme.colors` provides the adapter's palette (`background`, `surface`, `border`, `text`, `textMuted`, `accent`, `accentText`). The element view paints its background from the active adapter's theme; your components style themselves. (Chrome — tab bar, headers, the metadata view — currently stays wireframe-styled; theming chrome is a planned extension of this interface.)

## Registering

1. Create `MAIAS_browser/lib/adapters/<your-adapter>.tsx` exporting an `MaiasAdapter`.
2. Add it to `ADAPTERS` in `lib/adapters/context.tsx`.

It appears in the switcher on the document menu; selection applies live to the open document.

## Checklist before shipping an adapter

- [ ] Renders every example in `examples/` without errors (missing types are fine — that's the fallback's job).
- [ ] `target`-bearing elements navigate; `presentation` is forwarded.
- [ ] Structured label formats handled for any of `chips`, `segmented_control`, `label_value`, `radio_group`, `bullets` you override.
- [ ] No crash on an unknown `x_*` element type reaching one of your components (only possible if you registered it — the chain otherwise routes unknowns to the fallback).
