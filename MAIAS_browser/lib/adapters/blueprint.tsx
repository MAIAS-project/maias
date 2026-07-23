import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { MaiasAdapter, ElementComponentProps } from './types';

/**
 * Blueprint — a deliberately PARTIAL demo adapter (R3.5 acceptance): it restyles
 * only a handful of element types; everything else falls back to the wireframe
 * adapter automatically. It exists to prove the adapter interface and the
 * fallback chain, and as the template for authoring real adapters
 * (docs/adapters.md).
 */

const BLUE = '#1D4ED8';
const BLUE_MUTED = '#6B8CD6';
const PAPER = '#F4F7FF';

function Title({ element }: ElementComponentProps) {
  return <Text style={styles.title}>{element.label}</Text>;
}

function Heading({ element }: ElementComponentProps) {
  return <Text style={styles.heading}>{element.label}</Text>;
}

function Paragraph({ element }: ElementComponentProps) {
  return <Text style={styles.paragraph}>{element.label}</Text>;
}

function Button({ element, onNavigate }: ElementComponentProps) {
  return (
    <TouchableOpacity
      style={styles.button}
      activeOpacity={0.7}
      onPress={() => element.target && onNavigate?.(element.target, element.presentation)}
    >
      <Text style={styles.buttonText}>{element.label?.toUpperCase()}</Text>
    </TouchableOpacity>
  );
}

function TextField({ element }: ElementComponentProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{element.label}</Text>
    </View>
  );
}

function ListItem({ element, onNavigate }: ElementComponentProps) {
  const tappable = !!element.target;
  const row = (
    <View style={styles.listItem}>
      <Text style={styles.listItemText}>{element.label}</Text>
      {tappable && <Text style={styles.listItemChevron}>→</Text>}
    </View>
  );
  if (!tappable) return row;
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={() => onNavigate?.(element.target!, element.presentation)}>
      {row}
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

export const blueprintAdapter: MaiasAdapter = {
  id: 'blueprint',
  name: 'Blueprint',
  description: 'Partial demo adapter — 7 restyled types, the rest falls back to wireframe.',
  components: {
    title: Title,
    heading: Heading,
    paragraph: Paragraph,
    button: Button,
    text_field: TextField,
    list_item: ListItem,
    divider: Divider,
  },
  theme: {
    colors: {
      background: PAPER,
      surface: '#FFFFFF',
      border: BLUE_MUTED,
      text: '#10275E',
      textMuted: BLUE_MUTED,
      accent: BLUE,
      accentText: '#FFFFFF',
    },
  },
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10275E',
    marginVertical: 8,
    letterSpacing: 0.5,
  },
  heading: {
    fontSize: 17,
    fontWeight: '700',
    color: BLUE,
    marginTop: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    color: '#10275E',
    marginVertical: 4,
  },
  button: {
    borderWidth: 2,
    borderColor: BLUE,
    borderStyle: 'dashed',
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: 'center',
    marginVertical: 6,
    backgroundColor: PAPER,
  },
  buttonText: {
    color: BLUE,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1.5,
  },
  field: {
    borderWidth: 1,
    borderColor: BLUE_MUTED,
    borderStyle: 'dashed',
    borderRadius: 4,
    padding: 12,
    marginVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  fieldLabel: {
    color: BLUE_MUTED,
    fontSize: 14,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BLUE_MUTED,
    borderStyle: 'dashed',
  },
  listItemText: {
    fontSize: 14,
    color: '#10275E',
  },
  listItemChevron: {
    color: BLUE,
    fontWeight: '700',
  },
  divider: {
    height: 2,
    backgroundColor: BLUE,
    opacity: 0.2,
    marginVertical: 10,
  },
});
