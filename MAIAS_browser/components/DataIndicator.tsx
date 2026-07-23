import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/styles/wireframe';

interface DataIndicatorProps {
  label: string;
  items: string[];
  variant: 'reads' | 'writes';
}

export function DataIndicator({ label, items, variant }: DataIndicatorProps) {
  if (items.length === 0) return null;

  const chipColor = variant === 'reads' ? '#E8F5E9' : '#FFF3E0';
  const chipBorder = variant === 'reads' ? '#81C784' : '#FFB74D';
  const chipText = variant === 'reads' ? '#2E7D32' : '#E65100';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {items.map((item) => (
          <View key={item} style={[styles.chip, { backgroundColor: chipColor, borderColor: chipBorder }]}>
            <Text style={[styles.chipText, { color: chipText }]}>{item.replace(/_/g, ' ')}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '500',
  },
});
