import { View, Text, TouchableOpacity } from 'react-native';
import { wireframeElementStyles as s } from '@/styles/wireframe';
import type { WireframeElement } from '@/lib/types';

export interface ElementProps {
  element: WireframeElement;
  onNavigate?: (target: string) => void;
}

// ── Core ──

/** wf_title — Large 24px bold heading. Use for screen titles and hero text (e.g. "Welcome to Shopfront"). */
export function TitleElement({ element }: ElementProps) {
  return <Text style={s.title}>{element.label}</Text>;
}

/** wf_bullets — Bulleted text list, or grey placeholder bars when label is "none".
 *  Use for feature lists, benefits, or content-loading skeletons. Newlines in label create separate bullets. */
export function BulletsElement({ element }: ElementProps) {
  if (element.label === 'none') {
    return (
      <View>
        <View style={[s.bulletBar, { width: '90%' }]} />
        <View style={[s.bulletBar, { width: '75%' }]} />
        <View style={[s.bulletBar, { width: '60%' }]} />
      </View>
    );
  }

  const lines = (element.label ?? '').split('\n');
  return (
    <View>
      {lines.map((line, i) => (
        <Text key={i} style={s.bulletText}>{`\u2022  ${line}`}</Text>
      ))}
    </View>
  );
}

/** wf_full_width_button — Full-width rounded button. Use for primary/secondary CTAs like "Sign up", "Log in", "Continue".
 *  Supports optional `target` for navigation on press. */
export function FullWidthButtonElement({ element, onNavigate }: ElementProps) {
  const content = (
    <View style={s.fullWidthButton}>
      <Text style={s.fullWidthButtonLabel}>{element.label}</Text>
    </View>
  );

  if (element.target && onNavigate) {
    return (
      <TouchableOpacity onPress={() => onNavigate(element.target!)} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

/** wf_text_centered — Small centred muted text. Use for dividers ("or"), legal copy, and supplementary info. */
export function TextCenteredElement({ element }: ElementProps) {
  return <Text style={s.textCentered}>{element.label}</Text>;
}

/** Fallback for any unrecognised wireframe type. Renders a dashed outline box showing the unknown type badge and label.
 *  Appears automatically when a YAML type has no matching registry entry. */
export function FallbackElement({ element }: ElementProps) {
  return (
    <View style={s.fallbackBox}>
      <View style={s.fallbackBadge}>
        <Text style={s.fallbackBadgeText}>{element.type}</Text>
      </View>
      <Text style={s.fallbackLabel}>{element.label}</Text>
    </View>
  );
}

// ── Text & Content ──

/** wf_heading — 18px bold section heading. Use to introduce content sections within a screen (e.g. "Account details", "Nearby stores"). */
export function HeadingElement({ element }: ElementProps) {
  return <Text style={s.heading}>{element.label}</Text>;
}

/** wf_paragraph — 14px body text block. Use for descriptions, instructions, or any multi-sentence content. */
export function ParagraphElement({ element }: ElementProps) {
  return <Text style={s.paragraph}>{element.label}</Text>;
}

/** wf_label_value — Row with bold label left and muted value right. Use for key-value pairs on detail/profile screens
 *  (e.g. "Email | user@example.com"). Separate label and value with "|" in the label string. */
export function LabelValueElement({ element }: ElementProps) {
  const rawLabel = element.label ?? '';
  const [label, value] = rawLabel.includes('|')
    ? rawLabel.split('|').map((s) => s.trim())
    : [rawLabel, '—'];
  return (
    <View style={s.labelValueRow}>
      <Text style={s.labelValueLabel}>{label}</Text>
      <Text style={s.labelValueValue}>{value}</Text>
    </View>
  );
}

/** wf_divider — 1px horizontal line. Use to visually separate content sections within a screen. */
export function DividerElement(_props: ElementProps) {
  return <View style={s.divider} />;
}

/** wf_spacer — Empty view with configurable height. Use to add vertical breathing room between elements.
 *  Set label to a number for custom height in px (default 16). */
export function SpacerElement({ element }: ElementProps) {
  const height = element.label && !isNaN(Number(element.label)) ? Number(element.label) : 16;
  return <View style={{ height }} />;
}

// ── Inputs ──

/** wf_textfield — Rounded bordered input box with label shown as placeholder text.
 *  Use for form fields like email, password, name inputs on login/registration/profile screens. */
export function TextfieldElement({ element }: ElementProps) {
  return (
    <View style={s.textfield}>
      <Text style={s.textfieldPlaceholder}>{element.label}</Text>
    </View>
  );
}

/** wf_search_bar — Pill-shaped input with magnifying glass icon. Use on search screens, list filters,
 *  and anywhere users need to type a search query. Label overrides the default "Search" placeholder. */
export function SearchBarElement({ element }: ElementProps) {
  return (
    <View style={s.searchBar}>
      <Text style={s.searchBarIcon}>🔍</Text>
      <Text style={s.searchBarPlaceholder}>{element.label || 'Search'}</Text>
    </View>
  );
}

/** wf_toggle — Row with label left and grey pill toggle right. Use for boolean settings like
 *  "Push notifications", "Dark mode", "Show on map". */
export function ToggleElement({ element }: ElementProps) {
  return (
    <View style={s.toggleRow}>
      <Text style={s.toggleLabel}>{element.label}</Text>
      <View style={s.togglePill}>
        <View style={s.toggleKnob} />
      </View>
    </View>
  );
}

/** wf_checkbox — Row with square checkbox outline and label. Use for multi-select options like
 *  filter criteria, terms acceptance, or feature preferences. */
export function CheckboxElement({ element }: ElementProps) {
  return (
    <View style={s.checkboxRow}>
      <View style={s.checkboxBox} />
      <Text style={s.checkboxLabel}>{element.label}</Text>
    </View>
  );
}

/** wf_dropdown — Bordered row with label left and "▼" chevron right. Use for single-select pickers like
 *  country, size, or shipping method selection. */
export function DropdownElement({ element }: ElementProps) {
  return (
    <View style={s.dropdownRow}>
      <Text style={s.dropdownLabel}>{element.label}</Text>
      <Text style={s.dropdownChevron}>▼</Text>
    </View>
  );
}

// ── Media & Placeholders ──

/** wf_image_placeholder — Grey rounded box with centred "IMG" text at 16:9 aspect ratio.
 *  Use wherever an image, photo, or illustration will appear (e.g. marketing banners, article headers). */
export function ImagePlaceholderElement(_props: ElementProps) {
  return (
    <View style={s.imagePlaceholder}>
      <Text style={s.imagePlaceholderText}>IMG</Text>
    </View>
  );
}

/** wf_avatar — 48px grey circle showing the first character of the label (or "U" for unnamed).
 *  Use on profile screens, user cards, and comment/review lists to represent a user. */
export function AvatarElement({ element }: ElementProps) {
  const initial = element.label ? element.label.charAt(0).toUpperCase() : 'U';
  return (
    <View style={s.avatar}>
      <Text style={s.avatarText}>{initial}</Text>
    </View>
  );
}

/** wf_map_placeholder — Grey rounded box with centred "MAP" text at 4:3 aspect ratio.
 *  Use on map screens, location pickers, and store detail views where a map will appear. */
export function MapPlaceholderElement(_props: ElementProps) {
  return (
    <View style={s.mapPlaceholder}>
      <Text style={s.mapPlaceholderText}>MAP</Text>
    </View>
  );
}

// ── List & Cards ──

/** wf_list_item — Row with label and optional "›" chevron, separated by a bottom border.
 *  Use for menu items, settings rows, and any tappable list. Supports optional `target` for navigation. */
export function ListItemElement({ element, onNavigate }: ElementProps) {
  const content = (
    <View style={s.listItemRow}>
      <Text style={s.listItemLabel}>{element.label}</Text>
      {element.target && <Text style={s.listItemChevron}>›</Text>}
    </View>
  );

  if (element.target && onNavigate) {
    return (
      <TouchableOpacity onPress={() => onNavigate(element.target!)} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

/** wf_card — Rounded bordered container showing label as a bold title.
 *  Use for content cards, grouped information blocks, or feature highlights on hub/dashboard screens. */
export function CardElement({ element }: ElementProps) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{element.label}</Text>
    </View>
  );
}

// ── Feedback & Status ──

/** wf_alert_banner — Full-width coloured strip with label text. Use for warnings, info notices,
 *  success messages, or promotional banners at the top of a screen. */
export function AlertBannerElement({ element }: ElementProps) {
  return (
    <View style={s.alertBanner}>
      <Text style={s.alertBannerText}>{element.label}</Text>
    </View>
  );
}

/** wf_progress_bar — Grey track with 50% orange fill and label above. Use on live status screens,
 *  onboarding flows, upload progress, or any multi-step process indicator. */
export function ProgressBarElement({ element }: ElementProps) {
  return (
    <View>
      <Text style={s.progressBarLabel}>{element.label}</Text>
      <View style={s.progressBarTrack}>
        <View style={s.progressBarFill} />
      </View>
    </View>
  );
}

/** wf_empty_state — Centred muted text with "[ ]" icon above. Use when a list or screen has no data yet
 *  (e.g. "No saved items", "No orders yet"). */
export function EmptyStateElement({ element }: ElementProps) {
  return (
    <View style={s.emptyStateContainer}>
      <Text style={s.emptyStateIcon}>[ ]</Text>
      <Text style={s.emptyStateText}>{element.label}</Text>
    </View>
  );
}

// ── Navigation ──

/** wf_tab_bar — Horizontal row of tab labels with the first tab shown as active (orange underline).
 *  Use for segmented views within a screen (e.g. "All | Favourites | Recent"). Separate tabs with "|" in the label. */
export function TabBarElement({ element }: ElementProps) {
  const tabs = (element.label ?? '').split('|').map((t) => t.trim());
  return (
    <View style={s.tabBarRow}>
      {tabs.map((tab, i) => (
        <View key={i} style={s.tabBarItem}>
          <Text style={i === 0 ? s.tabBarLabelActive : s.tabBarLabel}>{tab}</Text>
          {i === 0 && <View style={s.tabBarActiveIndicator} />}
        </View>
      ))}
    </View>
  );
}

/** wf_icon_button — 40px grey circle with label text underneath. Use for toolbar actions, quick-access features,
 *  or icon grids (e.g. "Filter", "Share", "Directions"). */
export function IconButtonElement({ element }: ElementProps) {
  return (
    <View style={s.iconButtonContainer}>
      <View style={s.iconButtonCircle} />
      <Text style={s.iconButtonLabel}>{element.label}</Text>
    </View>
  );
}

/** wf_pills — Inline row of small rounded pill buttons. Use for tag groups, filter chips, or category selectors.
 *  Separate pill labels with "|" in the label string (e.g. "CCS | CHAdeMO | Type 2"). */
export function PillsElement({ element }: ElementProps) {
  const pills = (element.label ?? '').split('|').map((p) => p.trim());
  return (
    <View style={s.pillsRow}>
      {pills.map((pill, i) => (
        <View key={i} style={s.pill}>
          <Text style={s.pillLabel}>{pill}</Text>
        </View>
      ))}
    </View>
  );
}

/** wf_link_text — Underlined tappable text in accent colour. Use for inline navigation like "Forgot password?",
 *  "View all", or "Terms and conditions". Supports optional `target` for navigation. */
export function LinkTextElement({ element, onNavigate }: ElementProps) {
  if (element.target && onNavigate) {
    return (
      <TouchableOpacity onPress={() => onNavigate(element.target!)} activeOpacity={0.7}>
        <Text style={s.linkText}>{element.label}</Text>
      </TouchableOpacity>
    );
  }

  return <Text style={s.linkText}>{element.label}</Text>;
}
