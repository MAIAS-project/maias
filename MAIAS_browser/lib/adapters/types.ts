import type { ComponentType } from 'react';
import type { Element, Presentation } from '@maias/core';

/** Props every element component receives — identical across all adapters. */
export interface ElementComponentProps {
  element: Element;
  /** Navigate to a screen; presentation defaults per spec §4.4 when omitted. */
  onNavigate?: (target: string, presentation?: Presentation) => void;
}

export type ElementComponent = ComponentType<ElementComponentProps>;

/** Design tokens an adapter's components draw from. */
export interface AdapterTheme {
  colors: {
    background: string;
    surface: string;
    border: string;
    text: string;
    textMuted: string;
    accent: string;
    accentText: string;
  };
}

/**
 * A design-system renderer for MAIAS documents (R3.5, docs/adapters.md):
 * a component registry mapping MAIAS element types → components, plus a theme.
 *
 * Adapters may be PARTIAL: any element type without an entry falls back to the
 * wireframe adapter's rendering of it, and types unknown to every adapter render
 * as the wireframe fallback box — never an error (spec §10.1).
 */
export interface MaiasAdapter {
  id: string;
  name: string;
  /** One-liner shown in the adapter switcher. */
  description: string;
  components: Partial<Record<string, ElementComponent>>;
  theme: AdapterTheme;
}
