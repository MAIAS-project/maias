import { Redirect, useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';
import { WireframeScreen } from '@/components/WireframeScreen';
import { useIaDocument } from '@/lib/document-context';

/**
 * The single catch-all: every screen of the loaded document renders here (D12).
 * URL path → runtime.resolveScreenId → WireframeScreen. No per-screen or
 * per-tab route files exist — the shell is fully derived from the document.
 */
export default function CatchAllScreen() {
  const { runtime } = useIaDocument();
  const { path } = useLocalSearchParams<{ path: string[] }>();

  if (!runtime) return <Redirect href="/" />;

  const segments = Array.isArray(path) ? path : [path];
  const urlPath = '/' + segments.join('/');
  const screenId = runtime.resolveScreenId(urlPath);

  if (!screenId) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>Screen not found</Text>
        <Text style={{ color: '#888', marginTop: 4 }}>{urlPath}</Text>
      </View>
    );
  }

  return <WireframeScreen screenId={screenId} />;
}
