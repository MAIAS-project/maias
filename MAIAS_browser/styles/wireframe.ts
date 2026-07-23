import { StyleSheet } from 'react-native';

export const colors = {
  background: '#F5F5F5',
  surface: '#FFFFFF',
  border: '#CCCCCC',
  borderDashed: '#AAAAAA',
  text: '#333333',
  textSecondary: '#666666',
  textMuted: '#999999',
  accent: '#E85D3A',
  accentLight: '#FFF0EC',
  primary: '#E85D3A',
  primaryText: '#FFFFFF',
  secondaryText: '#E85D3A',
  // Type badge colors
  typeColors: {
    form: '#4A90D9',
    map: '#27AE60',
    list: '#8E44AD',
    detail: '#2980B9',
    menu: '#7F8C8D',
    search: '#F39C12',
    action: '#E74C3C',
    action_sheet: '#D35400',
    marketing: '#E85D3A',
    informational: '#16A085',
    container: '#34495E',
    status: '#2ECC71',
  } as Record<string, string>,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const typography = {
  title: { fontSize: 22, fontWeight: '700' as const, color: colors.text },
  subtitle: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 14, color: colors.text },
  caption: { fontSize: 12, color: colors.textSecondary },
  small: { fontSize: 11, color: colors.textMuted },
};

export const wireframeElementStyles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
  },
  bulletBar: {
    height: 12,
    backgroundColor: '#D0D0D0',
    borderRadius: 6,
    marginVertical: 4,
  },
  bulletText: {
    fontSize: 14,
    color: colors.text,
    paddingVertical: 2,
  },
  fullWidthButton: {
    height: 44,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  fullWidthButtonLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  textCentered: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center' as const,
  },
  fallbackBox: {
    borderWidth: 1,
    borderStyle: 'dashed' as const,
    borderColor: colors.borderDashed,
    borderRadius: 8,
    padding: spacing.md,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  fallbackBadge: {
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  fallbackBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  fallbackLabel: {
    fontSize: 13,
    color: colors.textMuted,
    flex: 1,
  },
  toggleIndicator: {
    height: 3,
    borderRadius: 1.5,
    alignSelf: 'center' as const,
    width: 40,
    marginTop: 4,
  },
  // ── Text & Content ──
  heading: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  paragraph: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  labelValueRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 6,
  },
  labelValueLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  labelValueValue: {
    fontSize: 14,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  // ── Inputs ──
  textfield: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center' as const,
  },
  textfieldPlaceholder: {
    fontSize: 14,
    color: colors.textMuted,
  },
  searchBar: {
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  searchBarIcon: {
    fontSize: 14,
    color: colors.textMuted,
  },
  searchBarPlaceholder: {
    fontSize: 14,
    color: colors.textMuted,
  },
  toggleRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 14,
    color: colors.text,
  },
  togglePill: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#CCCCCC',
    justifyContent: 'center' as const,
    paddingHorizontal: 3,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  checkboxRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingVertical: 6,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 4,
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.text,
  },
  dropdownRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  dropdownLabel: {
    fontSize: 14,
    color: colors.text,
  },
  dropdownChevron: {
    fontSize: 12,
    color: colors.textMuted,
  },
  // ── Media & Placeholders ──
  imagePlaceholder: {
    aspectRatio: 16 / 9,
    backgroundColor: '#E8E8E8',
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  imagePlaceholderText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textMuted,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textMuted,
  },
  mapPlaceholder: {
    aspectRatio: 4 / 3,
    backgroundColor: '#E8E8E8',
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  mapPlaceholderText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textMuted,
  },
  // ── List & Cards ──
  listItemRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listItemLabel: {
    fontSize: 14,
    color: colors.text,
  },
  listItemChevron: {
    fontSize: 14,
    color: colors.textMuted,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  // ── Feedback & Status ──
  alertBanner: {
    backgroundColor: colors.accentLight,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  alertBannerText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.accent,
  },
  progressBarLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  progressBarFill: {
    height: 8,
    width: '50%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  emptyStateContainer: {
    alignItems: 'center' as const,
    paddingVertical: spacing.xl,
    gap: 8,
  },
  emptyStateIcon: {
    fontSize: 28,
    color: colors.textMuted,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center' as const,
  },
  // ── Navigation ──
  tabBarRow: {
    flexDirection: 'row' as const,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBarItem: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 10,
  },
  tabBarLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  tabBarLabelActive: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.accent,
  },
  tabBarActiveIndicator: {
    height: 2,
    backgroundColor: colors.accent,
    marginTop: 4,
    width: '100%',
  },
  iconButtonContainer: {
    alignItems: 'center' as const,
    gap: 4,
  },
  iconButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  iconButtonLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  linkText: {
    fontSize: 14,
    color: colors.accent,
    textDecorationLine: 'underline' as const,
  },
  pillsRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  pill: {
    backgroundColor: '#E8E8E8',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
});

export const wireframeStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenScroll: {
    flex: 1,
  },
  screenContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    padding: 0,
  },
  backText: {
    fontSize: 16,
    color: colors.accent,
  },
  breadcrumb: {
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breadcrumbText: {
    ...typography.subtitle,
  },
  description: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    ...typography.subtitle,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  featuresContainer: {
    marginBottom: spacing.lg,
  },
  navigationContainer: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  dataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionChip: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderDashed,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  actionChipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
