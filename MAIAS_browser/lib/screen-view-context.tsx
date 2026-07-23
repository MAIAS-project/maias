import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type ScreenView = 'ui' | 'data';

interface ScreenViewContextValue {
  /** Which rendering of a screen is shown: the elements ('ui', default) or the IA metadata ('data'). */
  view: ScreenView;
  toggleView: () => void;
}

/**
 * App-wide screen-view preference. Lives above the router so it persists
 * across navigation events; tapping a screen's title toggles it. Screens
 * without elements always show the data view regardless.
 */
const ScreenViewContext = createContext<ScreenViewContextValue>({
  view: 'ui',
  toggleView: () => {},
});

export function ScreenViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ScreenView>('ui');
  const value = useMemo<ScreenViewContextValue>(
    () => ({ view, toggleView: () => setView((v) => (v === 'ui' ? 'data' : 'ui')) }),
    [view],
  );
  return <ScreenViewContext.Provider value={value}>{children}</ScreenViewContext.Provider>;
}

export function useScreenView(): ScreenViewContextValue {
  return useContext(ScreenViewContext);
}
