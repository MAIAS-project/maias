# 6. App chrome

**Chrome** is the global UI that frames every screen: the tab bar and screen headers. Chrome is **derived from the document's structure, not declared per screen** — this keeps documents free of repetition and guarantees consistency.

## 6.1 Tab bar

Derived entirely from `app.navigation.primary.screens`:

- One tab per listed screen, in list order. Tab label = the screen's `title` (or the matching `navigation.primary` item's `label` where a screen provides one).
- The tab bar is persistent across all screens except those presented as `modal` or `sheet` (renderer MAY hide it there).
- Renderers MUST derive tab count dynamically — a document with 2 or 5 primary screens renders 2 or 5 tabs.
- With fewer than 2 primary screens, renderers SHOULD hide the tab bar.

## 6.2 Screen headers

Every screen gets a derived header:

- **Title** — the screen's `title`.
- **Back affordance** *(changed in 0.2)* — present iff the screen declares `back` ([§4.3](04-navigation.md)); labelled with `back.label` or the target screen's title. The destination comes from the document, not the history stack.
- **Dismiss affordance** — screens presented as `modal` or `sheet` conventionally declare `back` pointing at the screen beneath; renderers MAY style it as a dismiss.

Renderers MAY enrich headers (type badges, breadcrumbs — the reference renderer shows both) but MUST NOT require documents to declare them.

## 6.3 No screen-level chrome elements

`tab_bar` and `header` are deliberately **not** element types in the [taxonomy](05-elements.md): declaring them per screen would duplicate app-level truth. The in-screen tab row (`segmented_control`) is different — it switches content *within* a screen, not between screens, and is a normal element.

Adapters MAY restyle chrome (an adapter can supply its own TabBar/Header components) but the structure comes from the document.
