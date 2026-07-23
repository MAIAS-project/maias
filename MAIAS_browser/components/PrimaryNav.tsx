import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useIaDocument, useIaNavigation } from '@/lib/document-context';
import { colors, spacing } from '@/styles/wireframe';

// Tab icons are derived from the screen's semantic type (spec §6.1 leaves
// iconography to the renderer).
const TYPE_ICONS: Record<string, { idle: keyof typeof Ionicons.glyphMap; active: keyof typeof Ionicons.glyphMap }> = {
  map: { idle: 'map-outline', active: 'map' },
  list: { idle: 'list-outline', active: 'list' },
  search: { idle: 'search-outline', active: 'search' },
  menu: { idle: 'person-outline', active: 'person' },
  container: { idle: 'person-outline', active: 'person' },
  form: { idle: 'create-outline', active: 'create' },
  detail: { idle: 'document-text-outline', active: 'document-text' },
  status: { idle: 'pulse-outline', active: 'pulse' },
};
const DEFAULT_ICON = { idle: 'ellipse-outline', active: 'ellipse' } as const;

/**
 * The persistent tab bar, derived entirely from the loaded document's
 * `navigation.primary` (R3.4): tab count, order, labels, and routes all come
 * from the document. Hidden with fewer than 2 primary screens (spec §6.1).
 */
export function PrimaryNav() {
  const { runtime } = useIaDocument();
  const { navigateTo } = useIaNavigation();
  const pathname = usePathname();

  const tabs = runtime?.primaryScreens() ?? [];
  // Hidden with <2 tabs (spec §6.1) and on the browser's own home/menu route —
  // the tab bar belongs to the loaded document's screens, not the browser shell.
  if (tabs.length < 2 || pathname === '/') return null;

  return (
    <View style={styles.container}>
      {tabs.map((screen) => {
        const isActive = pathname === screen.path || pathname.startsWith(screen.path + '/');
        const icon = TYPE_ICONS[screen.type] ?? DEFAULT_ICON;
        return (
          <TouchableOpacity
            key={screen.id}
            style={styles.tab}
            onPress={() => navigateTo(screen.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? icon.active : icon.idle}
              size={22}
              color={isActive ? colors.accent : colors.textMuted}
            />
            <Text style={[styles.label, isActive && styles.activeLabel]}>{screen.title}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  activeLabel: {
    color: colors.accent,
  },
});
