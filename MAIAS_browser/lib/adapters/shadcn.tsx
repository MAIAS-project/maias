import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { MaiasAdapter, ElementComponentProps } from './types';

/**
 * shadcn-style adapter (R3.6b, D6): the shadcn/ui visual language — zinc
 * palette, md radii, quiet borders — implemented with plain StyleSheet so it
 * runs identically on iOS, Android, and web with zero styling-library
 * dependencies. (The react-native-reusables + Uniwind route failed its spike
 * on this stack; see D6 for the evidence and this fallback's rationale.)
 * Covers the full 29-type core taxonomy; unknown/custom types fall back
 * through the standard chain.
 */

// shadcn zinc light-theme tokens
const T = {
  background: '#ffffff',
  foreground: '#09090b',
  muted: '#f4f4f5',
  mutedForeground: '#71717a',
  border: '#e4e4e7',
  primary: '#18181b',
  primaryForeground: '#fafafa',
  radius: 6,
};

const pipeSplit = (label?: string) => (label ?? '').split('|').map((v) => v.trim()).filter(Boolean);

const navPress = ({ element, onNavigate }: ElementComponentProps) => () =>
  element.target && onNavigate?.(element.target, element.presentation);

function maybeTouchable(props: ElementComponentProps, children: React.ReactElement) {
  if (!props.element.target) return children;
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={navPress(props)}>
      {children}
    </TouchableOpacity>
  );
}

// ── Text ──

const Title = ({ element }: ElementComponentProps) => <Text style={s.title}>{element.label}</Text>;
const Heading = ({ element }: ElementComponentProps) => <Text style={s.heading}>{element.label}</Text>;
const Paragraph = ({ element }: ElementComponentProps) => <Text style={s.paragraph}>{element.label}</Text>;
const Caption = ({ element }: ElementComponentProps) => <Text style={s.caption}>{element.label}</Text>;

function Bullets({ element }: ElementComponentProps) {
  if (!element.label || element.label === 'none') {
    return (
      <View style={s.skeletonGroup}>
        <View style={[s.skeletonBar, { width: '90%' }]} />
        <View style={[s.skeletonBar, { width: '72%' }]} />
        <View style={[s.skeletonBar, { width: '55%' }]} />
      </View>
    );
  }
  return (
    <View style={s.bullets}>
      {element.label.split('\n').map((line, i) => (
        <Text key={i} style={s.paragraph}>{`•  ${line}`}</Text>
      ))}
    </View>
  );
}

function LabelValue({ element }: ElementComponentProps) {
  const raw = element.label ?? '';
  const [label, value] = raw.includes('|') ? raw.split('|').map((v) => v.trim()) : [raw, '—'];
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

// ── Layout ──

const Divider = () => <View style={s.divider} />;
const Spacer = ({ element }: ElementComponentProps) => <View style={{ height: Number(element.label) || 16 }} />;

function Card(props: ElementComponentProps) {
  return maybeTouchable(
    props,
    <View style={s.card}>
      <Text style={s.cardTitle}>{props.element.label}</Text>
    </View>,
  );
}

// ── Actions ──

function Button(props: ElementComponentProps) {
  return (
    <TouchableOpacity style={s.button} activeOpacity={0.8} onPress={navPress(props)}>
      <Text style={s.buttonText}>{props.element.label}</Text>
    </TouchableOpacity>
  );
}

function IconButton(props: ElementComponentProps) {
  return (
    <TouchableOpacity style={s.iconButton} activeOpacity={0.7} onPress={navPress(props)}>
      <View style={s.iconButtonBox}>
        <Text style={s.iconButtonGlyph}>{(props.element.label ?? '?').charAt(0)}</Text>
      </View>
      <Text style={s.iconButtonLabel}>{props.element.label}</Text>
    </TouchableOpacity>
  );
}

function Link(props: ElementComponentProps) {
  return maybeTouchable(props, <Text style={s.link}>{props.element.label}</Text>);
}

function Chips({ element }: ElementComponentProps) {
  return (
    <View style={s.chipsRow}>
      {pipeSplit(element.label).map((chip, i) => (
        <View key={i} style={s.chip}>
          <Text style={s.chipText}>{chip}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Inputs ──

function Field({ element }: ElementComponentProps) {
  return (
    <View style={s.field}>
      <Text style={s.fieldPlaceholder}>{element.label}</Text>
    </View>
  );
}

function SearchBar({ element }: ElementComponentProps) {
  return (
    <View style={[s.field, s.searchField]}>
      <Text style={s.fieldPlaceholder}>⌕  {element.label || 'Search'}</Text>
    </View>
  );
}

function Toggle({ element }: ElementComponentProps) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{element.label}</Text>
      <View style={s.switchTrack}>
        <View style={s.switchThumb} />
      </View>
    </View>
  );
}

function Checkbox({ element }: ElementComponentProps) {
  return (
    <View style={s.optionRow}>
      <View style={s.checkbox} />
      <Text style={s.paragraph}>{element.label}</Text>
    </View>
  );
}

function RadioGroup({ element }: ElementComponentProps) {
  return (
    <View style={s.radioGroup}>
      {pipeSplit(element.label).map((option, i) => (
        <View key={i} style={s.optionRow}>
          <View style={s.radio}>{i === 0 && <View style={s.radioDot} />}</View>
          <Text style={s.paragraph}>{option}</Text>
        </View>
      ))}
    </View>
  );
}

function Dropdown({ element }: ElementComponentProps) {
  return (
    <View style={[s.field, s.dropdown]}>
      <Text style={s.paragraph}>{element.label}</Text>
      <Text style={s.rowValue}>▾</Text>
    </View>
  );
}

function Slider({ element }: ElementComponentProps) {
  return (
    <View style={s.block}>
      <Text style={s.rowLabel}>{element.label}</Text>
      <View style={s.sliderTrack}>
        <View style={s.sliderFill} />
        <View style={s.sliderThumb} />
      </View>
    </View>
  );
}

// ── Media ──

const ImageBlock = () => (
  <View style={[s.mediaBox, { aspectRatio: 16 / 9 }]}>
    <Text style={s.mediaLabel}>IMG</Text>
  </View>
);

function Avatar({ element }: ElementComponentProps) {
  return (
    <View style={s.avatar}>
      <Text style={s.avatarText}>{(element.label || 'U').charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const MapBlock = () => (
  <View style={[s.mediaBox, { aspectRatio: 4 / 3 }]}>
    <Text style={s.mediaLabel}>MAP</Text>
  </View>
);

const Video = () => (
  <View style={[s.mediaBox, s.videoBox]}>
    <Text style={s.videoGlyph}>▶</Text>
  </View>
);

// ── Lists & collections ──

function ListItem(props: ElementComponentProps) {
  return maybeTouchable(
    props,
    <View style={s.listItem}>
      <Text style={s.paragraph}>{props.element.label}</Text>
      {props.element.target && <Text style={s.rowValue}>›</Text>}
    </View>,
  );
}

function EmptyState({ element }: ElementComponentProps) {
  return (
    <View style={s.emptyState}>
      <Text style={s.emptyGlyph}>▢</Text>
      <Text style={s.rowValue}>{element.label}</Text>
    </View>
  );
}

// ── Feedback & status ──

function Banner({ element }: ElementComponentProps) {
  return (
    <View style={s.banner}>
      <Text style={s.paragraph}>{element.label}</Text>
    </View>
  );
}

function Progress({ element }: ElementComponentProps) {
  return (
    <View style={s.block}>
      <Text style={s.rowLabel}>{element.label}</Text>
      <View style={s.progressTrack}>
        <View style={s.progressFill} />
      </View>
    </View>
  );
}

function SegmentedControl({ element }: ElementComponentProps) {
  return (
    <View style={s.segmented}>
      {pipeSplit(element.label).map((segment, i) => (
        <View key={i} style={[s.segment, i === 0 && s.segmentActive]}>
          <Text style={i === 0 ? s.segmentTextActive : s.segmentText}>{segment}</Text>
        </View>
      ))}
    </View>
  );
}

export const shadcnAdapter: MaiasAdapter = {
  id: 'shadcn',
  name: 'shadcn',
  description: 'shadcn/ui visual language — zinc palette, quiet borders. Cross-platform.',
  components: {
    title: Title,
    heading: Heading,
    paragraph: Paragraph,
    caption: Caption,
    bullets: Bullets,
    label_value: LabelValue,
    divider: Divider,
    spacer: Spacer,
    card: Card,
    button: Button,
    icon_button: IconButton,
    link: Link,
    chips: Chips,
    text_field: Field,
    search_bar: SearchBar,
    toggle: Toggle,
    checkbox: Checkbox,
    radio_group: RadioGroup,
    dropdown: Dropdown,
    slider: Slider,
    image: ImageBlock,
    avatar: Avatar,
    map: MapBlock,
    video: Video,
    list_item: ListItem,
    empty_state: EmptyState,
    banner: Banner,
    progress: Progress,
    segmented_control: SegmentedControl,
  },
  theme: {
    colors: {
      background: T.background,
      surface: T.muted,
      border: T.border,
      text: T.foreground,
      textMuted: T.mutedForeground,
      accent: T.primary,
      accentText: T.primaryForeground,
    },
  },
};

const s = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '600', letterSpacing: -0.4, color: T.foreground, marginVertical: 8 },
  heading: { fontSize: 18, fontWeight: '600', color: T.foreground, marginTop: 12, marginBottom: 4 },
  paragraph: { fontSize: 14, lineHeight: 21, color: T.foreground },
  caption: { fontSize: 12, color: T.mutedForeground, textAlign: 'center', marginVertical: 8 },
  bullets: { marginVertical: 4, gap: 4 },
  skeletonGroup: { gap: 8, marginVertical: 8 },
  skeletonBar: { height: 14, borderRadius: 4, backgroundColor: T.muted },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  rowLabel: { fontSize: 14, fontWeight: '500', color: T.foreground },
  rowValue: { fontSize: 14, color: T.mutedForeground },
  divider: { height: 1, backgroundColor: T.border, marginVertical: 8 },
  card: {
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    backgroundColor: T.background,
    padding: 16,
    marginVertical: 4,
    // @ts-ignore web-only soft shadow
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  cardTitle: { fontSize: 14, fontWeight: '600', color: T.foreground },
  button: {
    height: 40,
    borderRadius: T.radius,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  buttonText: { fontSize: 14, fontWeight: '500', color: T.primaryForeground },
  iconButton: { alignItems: 'center', marginVertical: 4 },
  iconButtonBox: {
    height: 40,
    width: 40,
    borderRadius: T.radius,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonGlyph: { fontSize: 16, color: T.foreground },
  iconButtonLabel: { fontSize: 11, color: T.mutedForeground, marginTop: 4 },
  link: { fontSize: 14, fontWeight: '500', color: T.foreground, textDecorationLine: 'underline', marginVertical: 4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 4 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: T.border, paddingHorizontal: 12, paddingVertical: 4 },
  chipText: { fontSize: 12, fontWeight: '600', color: T.foreground },
  field: {
    height: 40,
    borderRadius: T.radius,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.background,
    paddingHorizontal: 12,
    justifyContent: 'center',
    marginVertical: 4,
  },
  fieldPlaceholder: { fontSize: 14, color: T.mutedForeground },
  searchField: { backgroundColor: T.muted },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchTrack: {
    height: 24,
    width: 44,
    borderRadius: 999,
    backgroundColor: T.primary,
    padding: 2,
    alignItems: 'flex-end',
  },
  switchThumb: { height: 20, width: 20, borderRadius: 999, backgroundColor: T.background },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  checkbox: { height: 16, width: 16, borderRadius: 3, borderWidth: 1.5, borderColor: T.primary },
  radioGroup: { marginVertical: 4 },
  radio: {
    height: 16,
    width: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { height: 8, width: 8, borderRadius: 999, backgroundColor: T.primary },
  block: { marginVertical: 8 },
  sliderTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: T.muted,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderFill: { height: 6, borderRadius: 999, backgroundColor: T.primary, width: '50%' },
  sliderThumb: {
    height: 16,
    width: 16,
    borderRadius: 999,
    backgroundColor: T.background,
    borderWidth: 1.5,
    borderColor: T.primary,
    marginLeft: -8,
  },
  mediaBox: {
    borderRadius: T.radius,
    backgroundColor: T.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    width: '100%',
  },
  mediaLabel: { fontSize: 12, fontWeight: '500', color: T.mutedForeground },
  videoBox: { aspectRatio: 16 / 9, backgroundColor: '#18181b' },
  videoGlyph: { fontSize: 18, color: '#ffffff' },
  avatar: {
    height: 48,
    width: 48,
    borderRadius: 999,
    backgroundColor: T.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  avatarText: { fontSize: 14, fontWeight: '500', color: T.foreground },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 4 },
  emptyGlyph: { fontSize: 22, color: T.mutedForeground },
  banner: {
    borderRadius: T.radius,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.muted,
    padding: 12,
    marginVertical: 4,
  },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: T.muted, marginTop: 8 },
  progressFill: { height: 8, borderRadius: 999, backgroundColor: T.primary, width: '50%' },
  segmented: {
    height: 36,
    borderRadius: 8,
    backgroundColor: T.muted,
    padding: 3,
    flexDirection: 'row',
    marginVertical: 4,
  },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: T.radius },
  segmentActive: {
    backgroundColor: T.background,
    // @ts-ignore web-only soft shadow
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
  },
  segmentText: { fontSize: 12, color: T.mutedForeground },
  segmentTextActive: { fontSize: 12, fontWeight: '500', color: T.foreground },
});
