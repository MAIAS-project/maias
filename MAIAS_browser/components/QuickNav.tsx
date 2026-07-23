import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, typography } from '@/styles/wireframe';
import { useIaDocument, useIaNavigation } from '@/lib/document-context';
import { useLayoutMode } from '@/lib/layout-mode-context';
import { buildScreenTree, flattenTree, type TreeNode } from '@/lib/quick-nav-tree';
import { TypeBadge } from './TypeBadge';

interface QuickNavProps {
  visible: boolean;
  onClose: () => void;
  currentScreenId?: string;
}

export function QuickNav({ visible, onClose, currentScreenId }: QuickNavProps) {
  const { runtime } = useIaDocument();
  const { navigateTo } = useIaNavigation();
  const { mode, label: layoutLabel, icon: layoutIcon, cycleMode } = useLayoutMode();
  // In the framed layouts the panel caps at a third of the viewport so it doesn't
  // dwarf the device frame; full-width mode keeps the classic full-width sheet.
  const framed = Platform.OS === 'web' && mode !== 'full';
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const tree = useMemo(
    () => buildScreenTree(runtime?.getAllScreens() ?? [], runtime?.getFlows() ?? []),
    [runtime],
  );
  const flat = useMemo(() => flattenTree(tree), [tree]);
  const screenCount = flat.length;

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return flat.filter(
      n =>
        n.screen!.title.toLowerCase().includes(q) ||
        n.screen!.id.toLowerCase().includes(q) ||
        n.screen!.path.toLowerCase().includes(q)
    );
  }, [search, flat]);

  const toggleSection = useCallback((key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleTap = useCallback(
    (screenId: string) => {
      onClose();
      setTimeout(() => navigateTo(screenId), 150);
    },
    [onClose]
  );

  const handleClose = useCallback(() => {
    setSearch('');
    onClose();
  }, [onClose]);

  const handleBrowserHome = useCallback(() => {
    handleClose();
    // navigate() backtracks to the existing index entry instead of stacking a new one
    setTimeout(() => router.navigate('/'), 150);
  }, [handleClose]);

  const renderRow = (node: TreeNode, indent: number) => {
    const screen = node.screen!;
    const isCurrent = screen.id === currentScreenId;
    return (
      <Pressable
        key={screen.id}
        style={[styles.row, isCurrent && styles.rowCurrent, { paddingLeft: spacing.lg + indent * 16 }]}
        onPress={() => handleTap(screen.id)}
      >
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text style={[styles.rowTitle, isCurrent && styles.rowTitleCurrent]} numberOfLines={1}>
              {screen.title}
            </Text>
            <TypeBadge type={screen.type} />
          </View>
          <Text style={styles.rowPath} numberOfLines={1}>
            {screen.path}
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderChildren = (children: TreeNode[], baseIndent: number): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    for (const child of children) {
      if (child.screen) {
        elements.push(renderRow(child, baseIndent));
      }
      if (child.children.length > 0) {
        elements.push(...renderChildren(child.children, baseIndent + 1));
      }
    }
    return elements;
  };

  const countScreens = (node: TreeNode): number => {
    let count = node.screen ? 1 : 0;
    for (const child of node.children) count += countScreens(child);
    return count;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={[styles.sheet, framed && styles.sheetFramed]} onPress={e => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Quick Nav</Text>
              <Pressable style={styles.homeLink} onPress={handleBrowserHome} hitSlop={8}>
                <Ionicons name="home-outline" size={14} color={colors.accent} />
                <Text style={styles.homeLinkText}>Browser home</Text>
              </Pressable>
              {Platform.OS === 'web' && (
                <Pressable style={styles.homeLink} onPress={cycleMode} hitSlop={8}>
                  <Ionicons name={layoutIcon as never} size={14} color={colors.accent} />
                  <Text style={styles.homeLinkText}>{layoutLabel}</Text>
                </Pressable>
              )}
            </View>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          {/* Search */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${screenCount} screen${screenCount === 1 ? '' : 's'}...`}
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Body */}
          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {filtered ? (
              filtered.length > 0 ? (
                filtered.map(node => renderRow(node, 0))
              ) : (
                <Text style={styles.emptyText}>No screens match "{search}"</Text>
              )
            ) : (
              tree.map(section => {
                const isExpanded = expanded.has(section.segment);
                const sectionCount = countScreens(section);
                return (
                  <View key={section.segment}>
                    <Pressable
                      style={styles.sectionHeader}
                      onPress={() => toggleSection(section.segment)}
                    >
                      <Ionicons
                        name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                        size={18}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.sectionLabel}>{section.label}</Text>
                      <View style={styles.sectionCount}>
                        <Text style={styles.sectionCountText}>{sectionCount}</Text>
                      </View>
                    </Pressable>
                    {isExpanded && (
                      <View>
                        {section.screen && renderRow(section, 0)}
                        {renderChildren(section.children, 1)}
                      </View>
                    )}
                  </View>
                );
              })
            )}
            <View style={{ height: spacing.xl }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
    minHeight: '50%',
  },
  sheetFramed: {
    width: '100%',
    maxWidth: '33%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
  },
  homeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: spacing.xs,
  },
  homeLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    height: 40,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
  },
  body: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.subtitle,
    flex: 1,
  },
  sectionCount: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingRight: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowCurrent: {
    backgroundColor: colors.accentLight,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowTitle: {
    ...typography.body,
    flex: 1,
  },
  rowTitleCurrent: {
    fontWeight: '700',
    color: colors.accent,
  },
  rowPath: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
});
