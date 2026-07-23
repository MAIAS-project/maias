import type { MaiasDocument, DocPath, Element, Screen } from './model.js';

/** One outbound reference from a screen to another screen. */
export interface OutboundRef {
  /** Screen the reference points at (the `target`). */
  target: string;
  /** Where the reference lives. */
  kind: 'navigation.primary' | 'navigation.secondary' | 'element' | 'state_element' | 'back';
  label?: string;
  /** JSON path to the target scalar, relative to the document root. */
  path: DocPath;
}

export interface InboundRef extends OutboundRef {
  /** Screen the reference lives on. */
  from: string;
}

/** All screen-to-screen references declared on a screen (nav items, elements, state elements). */
export function outboundRefs(screen: Screen, screenIndex: number): OutboundRef[] {
  const refs: OutboundRef[] = [];
  const base: DocPath = ['screens', screenIndex];

  if (typeof screen.back?.target === 'string') {
    refs.push({
      target: screen.back.target,
      kind: 'back',
      label: screen.back.label,
      path: [...base, 'back', 'target'],
    });
  }

  for (const group of ['primary', 'secondary'] as const) {
    (screen.navigation?.[group] ?? []).forEach((item, i) => {
      if (typeof item?.target === 'string') {
        refs.push({
          target: item.target,
          kind: `navigation.${group}`,
          label: item.label,
          path: [...base, 'navigation', group, i, 'target'],
        });
      }
    });
  }

  const collectElements = (elements: Element[] | undefined, path: DocPath, kind: OutboundRef['kind']) => {
    (elements ?? []).forEach((el, i) => {
      if (typeof el?.target === 'string') {
        refs.push({ target: el.target, kind, label: el.label, path: [...path, i, 'target'] });
      }
    });
  };
  collectElements(screen.elements, [...base, 'elements'], 'element');
  for (const state of ['empty', 'loading', 'error'] as const) {
    collectElements(screen.states?.[state]?.elements, [...base, 'states', state, 'elements'], 'state_element');
  }

  return refs;
}

/** Index of screens by ID. First occurrence wins when IDs are duplicated (lint reports the duplicate). */
export function screenIndex(doc: MaiasDocument): Map<string, Screen> {
  const map = new Map<string, Screen>();
  for (const screen of doc.screens ?? []) {
    if (screen?.id && !map.has(screen.id)) map.set(screen.id, screen);
  }
  return map;
}

export function getScreen(doc: MaiasDocument, id: string): Screen | undefined {
  return screenIndex(doc).get(id);
}

/**
 * Screens reachable from the app's structure (spec §3.3): primary navigation,
 * flow entry screens, then transitively via outbound references.
 */
export function reachableScreens(doc: MaiasDocument): Set<string> {
  const index = screenIndex(doc);
  const queue: string[] = [
    ...(doc.app?.navigation?.primary?.screens ?? []),
    ...(doc.app?.flows ?? []).map((f) => f?.entry_screen),
  ].filter((id): id is string => typeof id === 'string' && index.has(id));

  const reachable = new Set<string>();
  while (queue.length > 0) {
    const id = queue.pop()!;
    if (reachable.has(id)) continue;
    reachable.add(id);
    const screen = index.get(id)!;
    const idx = (doc.screens ?? []).indexOf(screen);
    for (const ref of outboundRefs(screen, idx)) {
      if (index.has(ref.target) && !reachable.has(ref.target)) queue.push(ref.target);
    }
  }
  return reachable;
}

/** Screens in no flow AND unreachable (spec §3.2). */
export function orphanScreens(doc: MaiasDocument): string[] {
  const inFlows = new Set((doc.app?.flows ?? []).flatMap((f) => f?.screens ?? []));
  const reachable = reachableScreens(doc);
  return (doc.screens ?? [])
    .map((s) => s?.id)
    .filter((id): id is string => typeof id === 'string' && !inFlows.has(id) && !reachable.has(id));
}

/** All references across the document pointing at `id`. */
export function whatLinksHere(doc: MaiasDocument, id: string): InboundRef[] {
  const refs: InboundRef[] = [];
  (doc.screens ?? []).forEach((screen, i) => {
    for (const ref of outboundRefs(screen, i)) {
      if (ref.target === id) refs.push({ ...ref, from: screen.id });
    }
  });
  return refs;
}
