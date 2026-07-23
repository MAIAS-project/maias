import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

/**
 * How the browser presents itself on web (native always renders full width):
 * - 'full'   — fill the browser window, no device chrome ("Full width layout")
 * - 'mobile' — centred phone frame, 390×844 ("Mobile layout", default)
 * - 'tablet' — centred landscape tablet frame, 1024×768 ("Tablet layout")
 */
export type LayoutMode = 'full' | 'mobile' | 'tablet';

export const LAYOUT_MODES: { mode: LayoutMode; label: string; icon: string }[] = [
  { mode: 'full', label: 'Full width layout', icon: 'expand-outline' },
  { mode: 'mobile', label: 'Mobile layout', icon: 'phone-portrait-outline' },
  { mode: 'tablet', label: 'Tablet layout', icon: 'tablet-landscape-outline' },
];

interface LayoutModeContextValue {
  mode: LayoutMode;
  label: string;
  icon: string;
  /** Advance to the next mode: full → mobile → tablet → full. */
  cycleMode: () => void;
}

const LayoutModeContext = createContext<LayoutModeContextValue>({
  mode: 'mobile',
  label: 'Mobile layout',
  icon: 'phone-portrait-outline',
  cycleMode: () => {},
});

export function LayoutModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<LayoutMode>('mobile');

  useEffect(() => {
    // Small web viewports can't fit a device frame — start full width there.
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.innerWidth <= 500) {
      setMode('full');
    }
  }, []);

  const value = useMemo<LayoutModeContextValue>(() => {
    const index = LAYOUT_MODES.findIndex((m) => m.mode === mode);
    const current = LAYOUT_MODES[index];
    return {
      mode,
      label: current.label,
      icon: current.icon,
      cycleMode: () => setMode(LAYOUT_MODES[(index + 1) % LAYOUT_MODES.length].mode),
    };
  }, [mode]);

  return <LayoutModeContext.Provider value={value}>{children}</LayoutModeContext.Provider>;
}

export function useLayoutMode(): LayoutModeContextValue {
  return useContext(LayoutModeContext);
}
