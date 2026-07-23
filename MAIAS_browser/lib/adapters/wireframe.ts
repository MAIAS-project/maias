import {
  TitleElement,
  BulletsElement,
  FullWidthButtonElement,
  TextCenteredElement,
  FallbackElement,
  HeadingElement,
  ParagraphElement,
  LabelValueElement,
  DividerElement,
  SpacerElement,
  TextfieldElement,
  SearchBarElement,
  ToggleElement,
  CheckboxElement,
  DropdownElement,
  ImagePlaceholderElement,
  AvatarElement,
  MapPlaceholderElement,
  ListItemElement,
  CardElement,
  AlertBannerElement,
  ProgressBarElement,
  EmptyStateElement,
  TabBarElement,
  IconButtonElement,
  PillsElement,
  LinkTextElement,
} from '@/components/wireframe-elements';

import { colors } from '@/styles/wireframe';
import type { MaiasAdapter, ElementComponent } from './types';

// MAIAS core element taxonomy (docs/spec/05-elements.md) → wireframe components.
// radio_group, slider, video are new in spec 1.0 and render via the fallback
// until they get dedicated components.
const components: Partial<Record<string, ElementComponent>> = {
  // Text
  title: TitleElement,
  heading: HeadingElement,
  paragraph: ParagraphElement,
  caption: TextCenteredElement,
  bullets: BulletsElement,
  label_value: LabelValueElement,
  // Layout
  divider: DividerElement,
  spacer: SpacerElement,
  card: CardElement,
  // Actions
  button: FullWidthButtonElement,
  icon_button: IconButtonElement,
  link: LinkTextElement,
  chips: PillsElement,
  // Inputs
  text_field: TextfieldElement,
  search_bar: SearchBarElement,
  toggle: ToggleElement,
  checkbox: CheckboxElement,
  dropdown: DropdownElement,
  // Media
  image: ImagePlaceholderElement,
  avatar: AvatarElement,
  map: MapPlaceholderElement,
  // Lists & collections
  list_item: ListItemElement,
  empty_state: EmptyStateElement,
  // Feedback & status
  banner: AlertBannerElement,
  progress: ProgressBarElement,
  segmented_control: TabBarElement,
};

/**
 * The wireframe adapter — the reference implementation (R3.6a) and the
 * universal fallback layer: other adapters' missing element types resolve to
 * these components, and types unknown everywhere render `wireframeFallback`
 * (dashed box with a type badge — spec §10.1, never an error).
 */
export const wireframeAdapter: MaiasAdapter = {
  id: 'wireframe',
  name: 'Wireframe',
  description: 'Lo-fi reference renderer — grey boxes, structure first.',
  components,
  theme: {
    colors: {
      background: colors.background,
      surface: colors.surface,
      border: colors.border,
      text: colors.text,
      textMuted: colors.textMuted,
      accent: colors.accent,
      accentText: colors.primaryText,
    },
  },
};

export const wireframeFallback: ElementComponent = FallbackElement;
