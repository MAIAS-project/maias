import { validate, type Diagnostic, type Presentation } from '@maias/core';
import { router } from 'expo-router';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';
import { IaRuntime } from './ia-runtime';

export interface LoadFailure {
  name: string;
  diagnostics: Diagnostic[];
}

export type LoadResult = { ok: true; runtime: IaRuntime } | { ok: false; failure: LoadFailure };

interface DocumentContextValue {
  /** The loaded document's runtime, or null when no document is open. */
  runtime: IaRuntime | null;
  /** Display name of the loaded document (example name or file name). */
  documentName: string | null;
  /**
   * Parse + validate source text; on success the document becomes current,
   * otherwise the validator's diagnostics come back for display (R3.7 —
   * errors are shown, never thrown).
   */
  loadDocument: (text: string, name: string) => LoadResult;
  closeDocument: () => void;
}

const DocumentContext = createContext<DocumentContextValue>({
  runtime: null,
  documentName: null,
  loadDocument: () => {
    throw new Error('DocumentProvider missing');
  },
  closeDocument: () => {},
});

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ runtime: IaRuntime; name: string } | null>(null);

  const loadDocument = useCallback((text: string, name: string): LoadResult => {
    const result = validate(text);
    if (!result.valid || !result.parsed) {
      return { ok: false, failure: { name, diagnostics: result.diagnostics.filter((d) => d.severity === 'error') } };
    }
    const runtime = new IaRuntime(result.parsed.data);
    setState({ runtime, name });
    return { ok: true, runtime };
  }, []);

  const closeDocument = useCallback(() => setState(null), []);

  const value = useMemo<DocumentContextValue>(
    () => ({
      runtime: state?.runtime ?? null,
      documentName: state?.name ?? null,
      loadDocument,
      closeDocument,
    }),
    [state, loadDocument, closeDocument],
  );

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
}

export function useIaDocument(): DocumentContextValue {
  return useContext(DocumentContext);
}

export interface NavigateOptions {
  /** Screen the navigation originates from (self-reference detection). */
  from?: string;
  /** Values for :param path segments. */
  params?: Record<string, string>;
  /** Link-level presentation override (spec §4.4). */
  presentation?: Presentation;
}

/** Document-aware navigation: screen id → route, honouring presentation modes. */
export function useIaNavigation() {
  const { runtime } = useIaDocument();

  const getPath = useCallback((screenId: string) => runtime?.pathFor(screenId), [runtime]);

  const navigateTo = useCallback(
    (screenId: string, opts: NavigateOptions = {}) => {
      if (!runtime) return;
      const path = runtime.pathFor(screenId);
      if (!path) {
        Alert.alert('Navigation Error', `Unknown screen: ${screenId}`);
        return;
      }
      if (opts.from && screenId === opts.from) {
        Alert.alert('Self Reference', 'This action loops back to the current screen.');
        return;
      }
      const resolved = path.replace(/:([a-z][a-z0-9_]*)/g, (_, key) => opts.params?.[key] || 'demo-1');
      const presentation = runtime.presentationFor(screenId, opts.presentation);
      if (presentation === 'replace') {
        router.replace(resolved as never);
      } else {
        // modal/sheet render as pushes in the browser for now (spec allows a
        // renderer to approximate); the header shows a dismiss affordance.
        router.push(resolved as never);
      }
    },
    [runtime],
  );

  /**
   * Follow a screen's declared `back` link (spec §4.3): navigate() semantics
   * backtrack through real history when the target is already on the stack,
   * otherwise navigate to it fresh — the destination is always the declared one.
   */
  const navigateBack = useCallback(
    (screenId: string) => {
      if (!runtime) return;
      const path = runtime.pathFor(screenId);
      if (!path) return;
      const resolved = path.replace(/:([a-z][a-z0-9_]*)/g, () => 'demo-1');
      router.navigate(resolved as never);
    },
    [runtime],
  );

  return { getPath, navigateTo, navigateBack };
}
