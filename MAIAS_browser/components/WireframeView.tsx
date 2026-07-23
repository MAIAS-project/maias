import { View } from 'react-native';
import type { Presentation } from '@maias/core';
import { resolveElement, useAdapter } from '@/lib/adapters/context';
import { useIaNavigation } from '@/lib/document-context';
import { wireframeElementStyles as s } from '@/styles/wireframe';
import type { WireframeElement } from '@/lib/types';

interface WireframeViewProps {
  elements: WireframeElement[];
  screenId: string;
}

/** Renders a screen's `elements:` list through the active adapter (R3.5). */
export function WireframeView({ elements, screenId }: WireframeViewProps) {
  const { adapter } = useAdapter();
  const { navigateTo } = useIaNavigation();

  return (
    <View style={[s.container, { backgroundColor: adapter.theme.colors.background }]}>
      {elements.map((element, i) => {
        const Component = resolveElement(adapter, element.type);
        const handleNavigate = (target: string, presentation?: Presentation) =>
          navigateTo(target, { from: screenId, presentation: presentation ?? element.presentation });
        return <Component key={`${element.type}-${i}`} element={element} onNavigate={handleNavigate} />;
      })}
    </View>
  );
}
