import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryNav } from '@/components/PrimaryNav';
import { QuickNav } from '@/components/QuickNav';
import { DocumentProvider, useIaDocument } from '@/lib/document-context';
import { AdapterProvider } from '@/lib/adapters/context';
import { ScreenViewProvider } from '@/lib/screen-view-context';
import { LayoutModeProvider, useLayoutMode } from '@/lib/layout-mode-context';
import { colors } from '@/styles/wireframe';
import { useState } from 'react';

/**
 * Presents the app per the layout mode (switched from the Quick Nav header):
 * full width (no chrome), a phone frame, or a landscape tablet frame.
 * Native platforms always render full width. The element structure is
 * identical across modes (only styles change) so switching modes never
 * remounts the app subtree — open modals and screen state survive.
 */
function DeviceFrame({ children }: { children: React.ReactNode }) {
  const { mode } = useLayoutMode();
  const framed = Platform.OS === 'web' && mode !== 'full';
  const tablet = mode === 'tablet';

  return (
    <View style={framed ? styles.desktop : styles.plain}>
      <View style={framed ? (tablet ? styles.tabletDevice : styles.device) : styles.plain}>
        {framed && (tablet ? <View style={styles.tabletCamera} /> : <View style={styles.notch} />)}
        {children}
        {framed && (
          <View style={styles.homeIndicator}>
            <View style={styles.homeBar} />
          </View>
        )}
      </View>
    </View>
  );
}

/** Quick-nav FAB — only meaningful while a document is open. */
function QuickNavOverlay() {
  const { runtime } = useIaDocument();
  const [showNav, setShowNav] = useState(false);
  const pathname = usePathname();

  if (!runtime) return null;
  const currentScreenId = runtime.resolveScreenId(pathname);

  return (
    <>
      <Pressable style={styles.fab} onPress={() => setShowNav(true)}>
        <Ionicons name="apps-outline" size={22} color="#FFFFFF" />
      </Pressable>
      <QuickNav
        visible={showNav}
        onClose={() => setShowNav(false)}
        currentScreenId={currentScreenId}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <DocumentProvider>
      <AdapterProvider>
      <ScreenViewProvider>
      <LayoutModeProvider>
        <DeviceFrame>
          <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="[...path]" />
            </Stack>
          </View>
          <PrimaryNav />
          <QuickNavOverlay />
        </DeviceFrame>
      </LayoutModeProvider>
      </ScreenViewProvider>
      </AdapterProvider>
    </DocumentProvider>
  );
}

const DEVICE_WIDTH = 390;
const DEVICE_HEIGHT = 844;
const TABLET_WIDTH = 1024;
const TABLET_HEIGHT = 768;

const styles = StyleSheet.create({
  plain: {
    flex: 1,
  },
  desktop: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  device: {
    width: DEVICE_WIDTH,
    height: DEVICE_HEIGHT,
    backgroundColor: '#F5F5F5',
    borderRadius: 44,
    overflow: 'hidden',
    borderWidth: 6,
    borderColor: '#2A2A2A',
    // @ts-ignore — web-only shadow properties
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
  },
  notch: {
    width: 160,
    height: 30,
    backgroundColor: '#2A2A2A',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    alignSelf: 'center',
    zIndex: 10,
  },
  homeIndicator: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  homeBar: {
    width: 134,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#2A2A2A',
  },
  fab: {
    position: 'absolute',
    bottom: 70,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    // @ts-ignore — web-only shadow
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  tabletDevice: {
    width: TABLET_WIDTH,
    height: TABLET_HEIGHT,
    backgroundColor: '#F5F5F5',
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 10,
    borderColor: '#2A2A2A',
    // @ts-ignore — web-only shadow properties
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
  },
  tabletCamera: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2A2A2A',
    alignSelf: 'center',
    marginTop: 6,
    marginBottom: 2,
    zIndex: 10,
  },
});
