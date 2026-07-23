import { isMap, isScalar, isSeq, Scalar, type Pair, type YAMLMap, type YAMLSeq } from 'yaml';
import type { ParsedDocument } from './parse.js';

/**
 * Canonical form (spec chapter 11): fixed key order per object kind, derived
 * screen ordering, omit-empty/default keys, quoted version header. Mutates the
 * underlying YAML document; comments move with their nodes. Idempotent.
 */
export function canonicalize(parsed: ParsedDocument): ParsedDocument {
  const root = parsed.ydoc.contents;
  if (!isMap(root)) return parsed;

  orderKeys(root, ORDER.root);
  quoteVersionHeader(root);
  forceBlockStyle(root);

  const app = getMap(root, 'app');
  if (app) {
    orderKeys(app, ORDER.app);
    const links = getMap(app, 'links');
    if (links) orderKeys(links, ORDER.links);
    const navigation = getMap(app, 'navigation');
    if (navigation) {
      orderKeys(navigation, ORDER.registry);
      for (const group of ['primary', 'secondary']) {
        const groupMap = getMap(navigation, group);
        if (groupMap) orderKeys(groupMap, ORDER.navGroup);
      }
    }
    const flows = getSeq(app, 'flows');
    if (flows) for (const flow of flows.items) if (isMap(flow)) orderKeys(flow, ORDER.flow);
  }

  const screens = getSeq(root, 'screens');
  if (screens) {
    for (const screen of screens.items) if (isMap(screen)) canonicalizeScreen(screen);
    reorderScreens(parsed, screens);
    syncSecondaryRegistry(parsed, root);
    dropEmptyKeys(screens);
  }

  return parsed;
}

/** Canonical text for the document (fmt = canonicalize + serialise). */
export function format(parsed: ParsedDocument): string {
  canonicalize(parsed);
  return parsed.toString();
}

/** Canonical key order per object kind (spec §11.1). Shared with edit.ts; not part of the package surface. */
export const ORDER = {
  root: ['maias', 'app', 'screens'],
  app: ['name', 'description', 'links', 'navigation', 'flows'],
  links: ['scheme'],
  registry: ['primary', 'secondary'],
  navGroup: ['label', 'screens'],
  flow: ['name', 'description', 'entry_screen', 'screens'],
  screen: ['id', 'title', 'type', 'path', 'description', 'presentation', 'auth', 'deep_link', 'back', 'features', 'actions', 'elements', 'states', 'navigation', 'data'],
  screenNav: ['primary', 'secondary', 'actions'],
  item: ['label', 'type', 'target', 'presentation', 'external'],
  states: ['empty', 'loading', 'error'],
  stateVariant: ['description', 'elements'],
  data: ['reads', 'writes'],
};

function canonicalizeScreen(screen: YAMLMap): void {
  orderKeys(screen, ORDER.screen);
  removeDefaults(screen);

  const back = getMap(screen, 'back');
  if (back) orderKeys(back, ORDER.item);

  const elements = getSeq(screen, 'elements');
  if (elements) canonicalizeItems(elements);

  const states = getMap(screen, 'states');
  if (states) {
    orderKeys(states, ORDER.states);
    for (const state of ['empty', 'loading', 'error']) {
      const variant = getMap(states, state);
      if (variant) {
        orderKeys(variant, ORDER.stateVariant);
        const stateElements = getSeq(variant, 'elements');
        if (stateElements) canonicalizeItems(stateElements);
      }
    }
  }

  const navigation = getMap(screen, 'navigation');
  if (navigation) {
    orderKeys(navigation, ORDER.screenNav);
    for (const group of ['primary', 'secondary', 'actions']) {
      const items = getSeq(navigation, group);
      if (items) canonicalizeItems(items);
    }
  }

  const data = getMap(screen, 'data');
  if (data) orderKeys(data, ORDER.data);
}

function canonicalizeItems(seq: YAMLSeq): void {
  for (const item of seq.items) {
    if (isMap(item)) {
      orderKeys(item, ORDER.item);
      removeDefaults(item);
    }
  }
}

/** Reorder pairs: known keys in table order, then x_/unknown keys in author order. */
export function orderKeys(map: YAMLMap, order: string[]): void {
  const rank = (pair: Pair): number => {
    const key = keyOf(pair);
    const i = order.indexOf(key);
    return i === -1 ? order.length : i;
  };
  // Stable sort keeps author order for keys outside the table (x_ extensions).
  map.items = map.items
    .map((pair, i) => ({ pair, i }))
    .sort((a, b) => rank(a.pair) - rank(b.pair) || a.i - b.i)
    .map(({ pair }) => pair);
}

/**
 * Spec §11.1: block style everywhere — never inline (`[]`/`{}`) collections.
 * Clears the flow flag on every non-empty map/seq so authored inline
 * collections serialise as block. Empty collections keep flow style — `[]` is
 * their only sensible rendering (schema-required empties like the calculator's
 * secondary registry stay `screens: []`; optional empties are dropped by
 * pruneEmpty anyway).
 */
function forceBlockStyle(node: unknown): void {
  if (isMap(node)) {
    if (node.items.length > 0) node.flow = false;
    for (const pair of node.items) forceBlockStyle(pair.value);
  } else if (isSeq(node)) {
    if (node.items.length > 0) node.flow = false;
    for (const item of node.items) forceBlockStyle(item);
  }
}

/** Spec §11.1: omit keys at their default value. */
function removeDefaults(map: YAMLMap): void {
  map.items = map.items.filter((pair) => {
    const key = keyOf(pair);
    const value = isScalar(pair.value) ? pair.value.value : undefined;
    if (key === 'deep_link' && value === false) return false;
    if (key === 'auth' && value === 'none') return false;
    if (key === 'presentation' && value === 'push') return false;
    if (key === 'external' && value === false) return false;
    return true;
  });
}

/**
 * Spec §11.1: omit empty collections, and the legacy `- None` placeholder lists
 * for features/actions. Applied to screen subtrees (where every collection is
 * optional) — recursing bottom-up so `data: {reads: [], writes: []}` collapses
 * away entirely. Registry and flow lists are schema-required and untouched.
 */
function dropEmptyKeys(screens: YAMLSeq): void {
  for (const screen of screens.items) {
    if (!isMap(screen)) continue;
    pruneEmpty(screen);
  }
}

function pruneEmpty(map: YAMLMap): void {
  map.items = map.items.filter((pair) => {
    const value = pair.value;
    if (isMap(value)) {
      pruneEmpty(value);
      return value.items.length > 0;
    }
    if (isSeq(value)) {
      if (value.items.length === 0) return false;
      const key = keyOf(pair);
      if ((key === 'actions' || key === 'features') && value.items.length === 1) {
        const only = value.items[0];
        if (isScalar(only) && (only.value === 'None' || only.value === 'none')) return false;
      }
    }
    return true;
  });
}

/**
 * Spec §11.2: screens ordered by flow membership — flows in document order,
 * screens in within-flow order, multi-flow screens under their first flow,
 * flowless screens last sorted by id. Fully derived, so formatters converge.
 */
function reorderScreens(parsed: ParsedDocument, screens: YAMLSeq): void {
  const doc = parsed.data;
  const currentIds = (doc.screens ?? []).map((s) => s?.id);

  const placed = new Set<string>();
  const desired: string[] = [];
  for (const flow of doc.app?.flows ?? []) {
    for (const id of flow?.screens ?? []) {
      if (typeof id === 'string' && currentIds.includes(id) && !placed.has(id)) {
        placed.add(id);
        desired.push(id);
      }
    }
  }
  const rest = currentIds.filter((id): id is string => typeof id === 'string' && !placed.has(id)).sort();
  desired.push(...rest);

  const byId = new Map<string, unknown>();
  screens.items.forEach((item, i) => {
    const id = currentIds[i];
    if (typeof id === 'string' && !byId.has(id)) byId.set(id, item);
  });
  // Only reorder if every screen resolved cleanly (duplicates/invalid shapes are validator territory).
  if (byId.size === screens.items.length) {
    screens.items = desired.map((id) => byId.get(id));
  }
}

/** Spec §11.2: secondary registry list follows the screens ordering; primary keeps tab order. */
function syncSecondaryRegistry(parsed: ParsedDocument, root: YAMLMap): void {
  const doc = parsed.data;
  const screenOrder = new Map((doc.screens ?? []).map((s, i) => [s?.id, i]));
  const navigation = getMap(root, 'app') && getMap(getMap(root, 'app')!, 'navigation');
  const secondary = navigation && getMap(navigation, 'secondary');
  const list = secondary && getSeq(secondary, 'screens');
  if (!list) return;
  const ids = list.items.filter(isScalar);
  if (ids.length !== list.items.length) return;
  list.items = [...list.items].sort((a, b) => {
    const ai = screenOrder.get((a as Scalar).value as string) ?? Number.MAX_SAFE_INTEGER;
    const bi = screenOrder.get((b as Scalar).value as string) ?? Number.MAX_SAFE_INTEGER;
    return ai - bi;
  });
}

function quoteVersionHeader(root: YAMLMap): void {
  const pair = root.items.find((p) => keyOf(p) === 'maias');
  if (pair && isScalar(pair.value)) pair.value.type = Scalar.QUOTE_DOUBLE;
}

function keyOf(pair: Pair): string {
  return isScalar(pair.key) ? String(pair.key.value) : String(pair.key);
}

function getMap(map: YAMLMap, key: string): YAMLMap | undefined {
  const value = map.get(key, true);
  return isMap(value) ? value : undefined;
}

function getSeq(map: YAMLMap, key: string): YAMLSeq | undefined {
  const value = map.get(key, true);
  return isSeq(value) ? value : undefined;
}
