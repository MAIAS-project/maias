import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { BUNDLED_DOCUMENTS } from '@/lib/documents';
import { useIaDocument, type LoadFailure } from '@/lib/document-context';
import { ADAPTERS, useAdapter } from '@/lib/adapters/context';
import { colors, spacing, typography } from '@/styles/wireframe';

/**
 * The document menu: open a bundled example or pick a MAIAS file (R3.2).
 * Validation failures render inline — never a crash (R3.7).
 */
export default function DocumentMenu() {
  const { runtime, documentName, loadDocument, closeDocument } = useIaDocument();
  const { adapter, setAdapterById } = useAdapter();
  const [failure, setFailure] = useState<LoadFailure | null>(null);

  const open = (text: string, name: string) => {
    const result = loadDocument(text, name);
    if (result.ok) {
      setFailure(null);
      router.push(result.runtime.entryPath() as never);
    } else {
      setFailure(result.failure);
    }
  };

  const pickFile = async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['*/*'],
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    try {
      const text =
        Platform.OS === 'web' && asset.file ? await asset.file.text() : await (await fetch(asset.uri)).text();
      open(text, asset.name ?? 'picked file');
    } catch (e) {
      setFailure({
        name: asset.name ?? 'picked file',
        diagnostics: [
          { code: 'MAIAS-P001', severity: 'error', message: `Could not read file: ${(e as Error).message}`, path: [] },
        ],
      });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.brand}>MAIAS Browser</Text>
      <Text style={styles.tagline}>
        Open a Mobile App Information Architecture Schema document and browse the app it describes.
      </Text>

      {runtime && (
        <View style={styles.openBanner}>
          <Text style={styles.openBannerText}>
            {documentName} is open — {runtime.getAllScreens().length} screens
          </Text>
          <View style={styles.openBannerActions}>
            <TouchableOpacity style={styles.bannerButton} onPress={() => router.push(runtime.entryPath() as never)}>
              <Text style={styles.bannerButtonText}>Continue browsing</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.bannerButton, styles.bannerButtonQuiet]} onPress={closeDocument}>
              <Text style={styles.bannerButtonQuietText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Text style={styles.sectionHeading}>Examples</Text>
      {BUNDLED_DOCUMENTS.map((doc) => (
        <TouchableOpacity key={doc.id} style={styles.card} onPress={() => open(doc.text, doc.name)} activeOpacity={0.7}>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{doc.name}</Text>
            <Text style={styles.cardDescription}>{doc.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionHeading}>Design system</Text>
      <View style={styles.adapterRow}>
        {ADAPTERS.map((a) => {
          const active = a.id === adapter.id;
          return (
            <TouchableOpacity
              key={a.id}
              style={[styles.adapterChip, active && styles.adapterChipActive]}
              onPress={() => setAdapterById(a.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.adapterChipText, active && styles.adapterChipTextActive]}>{a.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.adapterDescription}>{adapter.description}</Text>

      <Text style={styles.sectionHeading}>Your files</Text>
      <TouchableOpacity style={styles.card} onPress={pickFile} activeOpacity={0.7}>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>Open MAIAS file…</Text>
          <Text style={styles.cardDescription}>Pick a .yaml or .json document from this device.</Text>
        </View>
        <Ionicons name="folder-open-outline" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      {failure && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>
            {failure.name} failed validation ({failure.diagnostics.length} error
            {failure.diagnostics.length === 1 ? '' : 's'})
          </Text>
          {failure.diagnostics.slice(0, 20).map((d, i) => (
            <Text key={i} style={styles.errorLine}>
              {d.line !== undefined ? `line ${d.line}: ` : ''}
              {d.code} — {d.message}
            </Text>
          ))}
          {failure.diagnostics.length > 20 && (
            <Text style={styles.errorLine}>…and {failure.diagnostics.length - 20} more</Text>
          )}
          <Text style={styles.errorHint}>
            Fix the document (maias validate shows the same findings) and open it again.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    gap: spacing.sm,
  },
  brand: {
    ...typography.title,
    fontSize: 26,
    marginBottom: spacing.xs,
  },
  tagline: {
    ...typography.caption,
    marginBottom: spacing.lg,
  },
  sectionHeading: {
    ...typography.subtitle,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  cardDescription: {
    fontSize: 12,
    color: colors.textMuted,
  },
  openBanner: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 10,
    padding: spacing.md,
    gap: spacing.sm,
  },
  openBannerText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  openBannerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bannerButton: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  bannerButtonText: {
    color: colors.primaryText,
    fontSize: 13,
    fontWeight: '600',
  },
  bannerButtonQuiet: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerButtonQuietText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  errorBox: {
    marginTop: spacing.lg,
    backgroundColor: '#FDECEA',
    borderWidth: 1,
    borderColor: '#E85D3A',
    borderRadius: 10,
    padding: spacing.md,
    gap: 4,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B3402A',
  },
  errorLine: {
    fontSize: 12,
    color: '#7A2E1F',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  errorHint: {
    fontSize: 12,
    color: '#7A2E1F',
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  adapterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  adapterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  adapterChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  adapterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  adapterChipTextActive: {
    color: colors.primaryText,
  },
  adapterDescription: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
});
