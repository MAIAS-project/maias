import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { MaiasAdapter, ElementComponent } from './types';
import { wireframeAdapter, wireframeFallback } from './wireframe';
import { shadcnAdapter } from './shadcn';
import { blueprintAdapter } from './blueprint';

/** Shipped adapters, in switcher order. Wireframe first — it is the reference. */
export const ADAPTERS: MaiasAdapter[] = [wireframeAdapter, shadcnAdapter, blueprintAdapter];

/**
 * Element resolution chain (R3.5, spec §10.1):
 *   active adapter → wireframe adapter → wireframe fallback box.
 * Unknown element types therefore always render something and never error.
 */
export function resolveElement(adapter: MaiasAdapter, type: string): ElementComponent {
  return adapter.components[type] ?? wireframeAdapter.components[type] ?? wireframeFallback;
}

interface AdapterContextValue {
  adapter: MaiasAdapter;
  setAdapterById: (id: string) => void;
}

const AdapterContext = createContext<AdapterContextValue>({
  adapter: wireframeAdapter,
  setAdapterById: () => {},
});

export function AdapterProvider({ children }: { children: ReactNode }) {
  const [adapter, setAdapter] = useState<MaiasAdapter>(wireframeAdapter);

  const value = useMemo<AdapterContextValue>(
    () => ({
      adapter,
      setAdapterById: (id: string) => {
        const next = ADAPTERS.find((a) => a.id === id);
        if (next) setAdapter(next);
      },
    }),
    [adapter],
  );

  return <AdapterContext.Provider value={value}>{children}</AdapterContext.Provider>;
}

export function useAdapter(): AdapterContextValue {
  return useContext(AdapterContext);
}
