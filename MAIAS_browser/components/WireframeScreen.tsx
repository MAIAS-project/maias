import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIaDocument, useIaNavigation } from '@/lib/document-context';
import { useScreenView } from '@/lib/screen-view-context';
import { TypeBadge } from './TypeBadge';
import { FeatureBlock } from './FeatureBlock';
import { NavigationButton } from './NavigationButton';
import { DataIndicator } from './DataIndicator';
import { WireframeView } from './WireframeView';
import { wireframeStyles as ws, wireframeElementStyles as es, typography, colors, spacing } from '@/styles/wireframe';

interface WireframeScreenProps {
  screenId: string;
}

export function WireframeScreen({ screenId }: WireframeScreenProps) {
  const { runtime } = useIaDocument();
  const { getPath, navigateBack } = useIaNavigation();
  const { view, toggleView } = useScreenView();
  const screen = runtime?.getScreen(screenId);

  if (!screen) {
    return (
      <SafeAreaView style={ws.screenContainer}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={typography.title}>Screen not found</Text>
          <Text style={typography.caption}>{screenId}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const routePath = getPath(screenId) || screen.path;
  const secondary = screen.navigation?.secondary ?? [];
  const actions = screen.navigation?.actions ?? [];
  const features = screen.features ?? [];
  const screenActions = screen.actions ?? [];
  const reads = screen.data?.reads ?? [];
  const writes = screen.data?.writes ?? [];
  // Declared back navigation (spec §4.3): label defaults to the target screen's title.
  const back = screen.back;
  const backLabel = back ? (back.label ?? runtime?.getScreen(back.target)?.title ?? 'Back') : undefined;
  const hasWireframe = screen.elements && screen.elements.length > 0;
  // UI view is the default and persists across navigation; tapping the title
  // switches to the data (IA metadata) view. Element-less screens always show data.
  const showUi = view === 'ui' && hasWireframe;

  const titleContent = (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{screen.title}</Text>
      {hasWireframe && (
        <View
          style={[
            es.toggleIndicator,
            { backgroundColor: showUi ? colors.accent : colors.border },
          ]}
        />
      )}
    </View>
  );

  return (
    <View style={ws.screenContainer}>
      {/* Top nav bar — equal-flex sides keep the title centred */}
      <View style={ws.header}>
        <View style={[ws.headerLeft, { flex: 1 }]}>
          {back ? (
            <TouchableOpacity style={ws.backButton} onPress={() => navigateBack(back.target)}>
              <Text style={ws.backText} numberOfLines={1}>← {backLabel}</Text>
            </TouchableOpacity>
          ) : (
            <View style={ws.backButton} />
          )}
        </View>
        {hasWireframe ? (
          <TouchableOpacity onPress={toggleView} activeOpacity={0.6}>
            {titleContent}
          </TouchableOpacity>
        ) : (
          titleContent
        )}
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView style={ws.screenScroll} contentContainerStyle={showUi ? undefined : ws.screenContent}>
        {showUi ? (
          <WireframeView elements={screen.elements!} screenId={screenId} />
        ) : (
          <>
            {/* Breadcrumb path + screen type */}
            <View style={ws.breadcrumb}>
              <Text style={ws.breadcrumbText}>{routePath}</Text>
              <TypeBadge type={screen.type} />
            </View>

            {/* Description */}
            <View style={ws.description}>
              <Text style={typography.body}>{screen.description}</Text>
            </View>

            {/* Features & Actions */}
            <View style={{ flexDirection: 'row', gap: spacing.lg }}>
              <View style={{ flex: 1 }}>
                <Text style={ws.sectionTitle}>Features</Text>
                <View style={ws.featuresContainer}>
                  {features.map((feature) => (
                    <FeatureBlock key={feature} name={feature} />
                  ))}
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ws.sectionTitle}>Actions</Text>
                <View style={ws.featuresContainer}>
                  {screenActions.map((action, i) => {
                    const isObject = typeof action === 'object' && action !== null;
                    const label = isObject ? action.label : action;
                    const external = isObject && action.external;
                    return (
                      <FeatureBlock key={`${label}-${i}`} name={external ? `${label} ↗` : label} />
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Data indicators */}
            {(reads.length > 0 || writes.length > 0) && (
              <>
                <Text style={ws.sectionTitle}>Data</Text>
                <DataIndicator label="Reads" items={reads} variant="reads" />
                <DataIndicator label="Writes" items={writes} variant="writes" />
              </>
            )}

            {/* Navigation buttons (primary is the tab bar's job; back is the header's, from screen.back) */}
            {secondary.length > 0 && (
              <>
                <Text style={ws.sectionTitle}>Navigation</Text>
                <View style={ws.navigationContainer}>
                  {secondary
                    .map((nav) => (
                      <NavigationButton
                        key={`${nav.target}-${nav.label}`}
                        label={nav.label}
                        target={nav.target}
                        variant="secondary"
                        fromScreenId={screenId}
                        presentation={nav.presentation}
                      />
                    ))}
                </View>
              </>
            )}

            {/* Actions (non-navigating) */}
            {actions.length > 0 && (
              <>
                <Text style={ws.sectionTitle}>Actions</Text>
                <View style={ws.actionsContainer}>
                  {actions.map((action) => (
                    <View key={action.label} style={ws.actionChip}>
                      <Text style={ws.actionChipText}>
                        {action.label}{action.external ? ' ↗' : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
