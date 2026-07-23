import { Text, StyleSheet } from 'react-native';
import { colors } from '@/styles/wireframe';

interface FeatureBlockProps {
  name: string;
}

export function FeatureBlock({ name }: FeatureBlockProps) {
  const label = name.replace(/_/g, ' ');

  return (
    <Text style={styles.item}>• {label}</Text>
  );
}

const styles = StyleSheet.create({
  item: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    textTransform: 'capitalize',
  },
});
