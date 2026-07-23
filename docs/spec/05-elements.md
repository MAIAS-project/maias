# 5. Elements

Elements are the design-system-neutral building blocks of a screen. They declare **what is on the screen**, not how it looks — a wireframe adapter renders them lo-fi, a shadcn-style adapter renders them polished, and both read the same document.

## 5.1 Shape

```yaml
elements:
  - label: Welcome to Shopfront
    type: title
  - label: Sign up
    type: button
    target: register
  - label: Forgot password?
    type: link
    target: forgot_password
    presentation: modal
```

| Key | Type | Required | Meaning |
|---|---|---|---|
| `type` | string | yes **[schema]** | A core type ([§5.3](#53-core-taxonomy)) or an `x_`-prefixed custom type ([chapter 10](10-extensions.md)). |
| `label` | string | usually (see per-type) | Text content. Some types define structured label formats ([§5.2](#52-label-formats)). |
| `target` | string | no | Screen ID navigated to on interaction (actionable types only). MUST exist **[lint: error]**. |
| `presentation` | string | no | Overrides the target screen's presentation mode ([§4.4](04-navigation.md)); only meaningful with `target`. |

Element order in the list is render order, top to bottom.

## 5.2 Label formats

Three structured conventions, noted per type below:

- **`|`-separated** — multiple values in one label: `label: All | Favourites | Recent` (whitespace around `|` is trimmed; `A|B` and `A | B` are equivalent)
- **`\n`-separated** — multiple lines: `label: "Browse the catalogue\nTrack your order"`
- **`none` sentinel** — the literal string `none` requests a skeleton/placeholder rendering where supported.

In YAML, `\n`-bearing labels MUST be written as double-quoted scalars (as above): an unquoted multi-line plain scalar folds newlines into spaces, silently merging the lines **[convention, and what `maias fmt` emits]**.

## 5.3 Core taxonomy

29 core types in 7 groups. **Origin** shows the prototype's `wf_*` name where one existed (for migration); three types are new in v0.1.

### Text

| Type | Renders as | Label | Target | Origin |
|---|---|---|---|---|
| `title` | Large hero heading (~24px) | required | — | `wf_title` |
| `heading` | Section heading (~18px) | required | — | `wf_heading` |
| `paragraph` | Body text block | required | — | `wf_paragraph` |
| `caption` | Small muted text, centred — divider text ("or"), legal copy | required | — | `wf_text_centered` |
| `bullets` | Bulleted list; `\n`-separated lines; `none` → skeleton bars | required | — | `wf_bullets` |
| `label_value` | Key–value row, bold label left, muted value right; `Label \| Value` | required (`\|`) | — | `wf_label_value` |

### Layout

| Type | Renders as | Label | Target | Origin |
|---|---|---|---|---|
| `divider` | 1px horizontal rule | ignored | — | `wf_divider` |
| `spacer` | Vertical gap; label = height in px (default 16) | optional (number string) | — | `wf_spacer` |
| `card` | Bordered container with bold title | required | optional | `wf_card` |

### Actions

| Type | Renders as | Label | Target | Origin |
|---|---|---|---|---|
| `button` | Full-width primary/secondary CTA | required | optional | `wf_full_width_button` |
| `icon_button` | Circular icon button with label beneath | required | optional | `wf_icon_button` |
| `link` | Inline tappable underlined text | required | optional | `wf_link_text` |
| `chips` | Row of small pills — tags, filter chips; `\|`-separated | required (`\|`) | — | `wf_pills` |

### Inputs

| Type | Renders as | Label | Target | Origin |
|---|---|---|---|---|
| `text_field` | Bordered input; label = placeholder | required | — | `wf_textfield` |
| `search_bar` | Pill-shaped search input (default placeholder "Search") | optional | — | `wf_search_bar` |
| `toggle` | Label + on/off switch row | required | — | `wf_toggle` |
| `checkbox` | Checkbox + label row | required | — | `wf_checkbox` |
| `radio_group` | Single-choice option list; `\|`-separated options | required (`\|`) | — | *new in 0.1* |
| `dropdown` | Single-select picker row with chevron | required | — | `wf_dropdown` |
| `slider` | Horizontal value slider with label above | required | — | *new in 0.1* |

### Media

| Type | Renders as | Label | Target | Origin |
|---|---|---|---|---|
| `image` | Image placeholder/content, 16:9 | ignored | — | `wf_image_placeholder` |
| `avatar` | Circular user image; label's first character as initial | optional | — | `wf_avatar` |
| `map` | Map region, 4:3 | ignored | — | `wf_map_placeholder` |
| `video` | Video player placeholder, 16:9 | ignored | — | *new in 0.1* |

### Lists & collections

| Type | Renders as | Label | Target | Origin |
|---|---|---|---|---|
| `list_item` | Tappable row; chevron when `target` set | required | optional | `wf_list_item` |
| `empty_state` | Centred "nothing here" message | required | — | `wf_empty_state` |

### Feedback & status

| Type | Renders as | Label | Target | Origin |
|---|---|---|---|---|
| `banner` | Full-width notice strip (info/warning/success) | required | — | `wf_alert_banner` |
| `progress` | Progress bar with label above | required | — | `wf_progress_bar` |
| `segmented_control` | In-screen tab row, first segment active; `\|`-separated | required (`\|`) | — | `wf_tab_bar` |

## 5.4 Unknown types

A `type` outside this taxonomy is not an error. Renderers MUST render it via a visible fallback (the reference renderer shows a dashed box with the type badge and label) and MUST NOT fail. `maias validate` warns on unknown types that lack the `x_` prefix (probable typo) **[lint: warning]** and accepts `x_`-prefixed types silently. See [chapter 10](10-extensions.md).

## 5.5 Choosing elements **[convention]**

- Prefer the most semantic type (`search_bar` over `text_field` for search; `empty_state` over `caption` for empty content).
- Elements describe the IA-level anatomy of a screen, not pixel design: 5–15 elements per screen is typical; more suggests the screen should split.
- Repeated content (a feed, a results list) is declared once — e.g. a single `list_item` stands for the row type, optionally with a `bullets: none` skeleton for volume.
