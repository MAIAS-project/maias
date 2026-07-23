import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { Presentation } from '@maias/core';
import { colors, spacing } from '@/styles/wireframe';
import { useIaNavigation } from '@/lib/document-context';

interface NavigationButtonProps {
  label: string;
  target: string;
  variant: 'primary' | 'secondary';
  fromScreenId?: string;
  presentation?: Presentation;
}

export function NavigationButton({ label, target, variant, fromScreenId, presentation }: NavigationButtonProps) {
  const { navigateTo } = useIaNavigation();
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[styles.button, isPrimary ? styles.primary : styles.secondary]}
      onPress={() => navigateTo(target, { from: fromScreenId, presentation })}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, isPrimary ? styles.primaryText : styles.secondaryText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
  primaryText: {
    color: colors.primaryText,
  },
  secondaryText: {
    color: colors.secondaryText,
  },
});
