import { isMap, isSeq, type YAMLMap, type YAMLSeq } from 'yaml';
import type { Element, Screen } from './model.js';
import type { DocPath } from './model.js';
import { ORDER, orderKeys } from './fmt.js';
import { whatLinksHere, type InboundRef } from './graph.js';
import type { ParsedDocument } from './parse.js';

const ID_PATTERN = /^[a-z][a-z0-9_]*$/;

export interface EditResult {
  ok: boolean;
  /** Human-readable reason when ok is false. */
  reason?: string;
  /** Number of scalar/node updates applied. */
  changes: number;
}

/**
 * Rename a screen, cascading to every reference: flows (entry_screen, screens),
 * the navigation registry, and all targets (navigation items, elements, state
 * elements). Edits go through the YAML document so comments and unrelated
 * formatting are untouched — the diff is exactly the renamed references.
 */
export function renameScreen(parsed: ParsedDocument, oldId: string, newId: string): EditResult {
  if (!ID_PATTERN.test(newId)) return { ok: false, reason: `'${newId}' is not a valid screen id (snake_case)`, changes: 0 };
  const doc = parsed.data;
  const screens = doc.screens ?? [];
  if (!screens.some((s) => s?.id === oldId)) return { ok: false, reason: `No screen with id '${oldId}'`, changes: 0 };
  if (screens.some((s) => s?.id === newId)) return { ok: false, reason: `Screen id '${newId}' already exists`, changes: 0 };

  const paths: DocPath[] = [];

  screens.forEach((screen, i) => {
    if (screen?.id === oldId) paths.push(['screens', i, 'id']);
  });
  (doc.app?.flows ?? []).forEach((flow, i) => {
    if (flow?.entry_screen === oldId) paths.push(['app', 'flows', i, 'entry_screen']);
    (flow?.screens ?? []).forEach((id, j) => {
      if (id === oldId) paths.push(['app', 'flows', i, 'screens', j]);
    });
  });
  (['primary', 'secondary'] as const).forEach((group) => {
    (doc.app?.navigation?.[group]?.screens ?? []).forEach((id, j) => {
      if (id === oldId) paths.push(['app', 'navigation', group, 'screens', j]);
    });
  });
  for (const ref of whatLinksHere(doc, oldId)) paths.push(ref.path);

  for (const path of paths) parsed.ydoc.setIn(path, newId);
  return { ok: true, changes: paths.length };
}

export interface AddScreenOptions {
  /** Which registry list the screen joins. Default: secondary. */
  registry?: 'primary' | 'secondary';
  /** Flow to append the screen to (added to its `screens` list). */
  flow?: string;
}

/** Add a screen and register it. The screen object should follow canonical key order (use fmt afterwards to be sure). */
export function addScreen(parsed: ParsedDocument, screen: Screen, opts: AddScreenOptions = {}): EditResult {
  const registry = opts.registry ?? 'secondary';
  const doc = parsed.data;
  if (!ID_PATTERN.test(screen?.id ?? '')) return { ok: false, reason: `'${screen?.id}' is not a valid screen id (snake_case)`, changes: 0 };
  if ((doc.screens ?? []).some((s) => s?.id === screen.id)) return { ok: false, reason: `Screen id '${screen.id}' already exists`, changes: 0 };
  if (opts.flow && !(doc.app?.flows ?? []).some((f) => f?.name === opts.flow)) {
    return { ok: false, reason: `No flow named '${opts.flow}'`, changes: 0 };
  }

  let changes = 0;
  parsed.ydoc.addIn(['screens'], parsed.ydoc.createNode(screen));
  changes++;
  parsed.ydoc.addIn(['app', 'navigation', registry, 'screens'], parsed.ydoc.createNode(screen.id));
  changes++;
  if (opts.flow) {
    const flowIndex = (doc.app?.flows ?? []).findIndex((f) => f?.name === opts.flow);
    parsed.ydoc.addIn(['app', 'flows', flowIndex, 'screens'], parsed.ydoc.createNode(screen.id));
    changes++;
  }
  return { ok: true, changes };
}

export interface RemoveScreenOptions {
  /**
   * When true, inbound references are removed too (navigation items pointing at
   * the screen are deleted; elements keep their content but lose their target).
   * When false (default), removal is refused if inbound references exist.
   */
  cascade?: boolean;
}

export interface RemoveScreenResult extends EditResult {
  /** References that pointed at the screen (removed when cascade, blocking otherwise). */
  inboundRefs: InboundRef[];
}

/** Remove a screen plus its registry and flow entries. Safe by default: refuses to leave dangling targets. */
export function removeScreen(parsed: ParsedDocument, id: string, opts: RemoveScreenOptions = {}): RemoveScreenResult {
  const doc = parsed.data;
  if (!(doc.screens ?? []).some((s) => s?.id === id)) {
    return { ok: false, reason: `No screen with id '${id}'`, changes: 0, inboundRefs: [] };
  }
  const inboundRefs = whatLinksHere(doc, id);
  if (inboundRefs.length > 0 && !opts.cascade) {
    return {
      ok: false,
      reason: `${inboundRefs.length} reference(s) point at '${id}' (from: ${[...new Set(inboundRefs.map((r) => r.from))].join(', ')}) — remove them or pass cascade`,
      changes: 0,
      inboundRefs,
    };
  }

  // Collect every deletion as a path, then apply children-first / high-index-first
  // so earlier deletions never shift later ones.
  const deletions: DocPath[] = [];

  (doc.screens ?? []).forEach((screen, i) => {
    if (screen?.id === id) deletions.push(['screens', i]);
  });
  (doc.app?.flows ?? []).forEach((flow, i) => {
    (flow?.screens ?? []).forEach((sid, j) => {
      if (sid === id) deletions.push(['app', 'flows', i, 'screens', j]);
    });
  });
  (['primary', 'secondary'] as const).forEach((group) => {
    (doc.app?.navigation?.[group]?.screens ?? []).forEach((sid, j) => {
      if (sid === id) deletions.push(['app', 'navigation', group, 'screens', j]);
    });
  });
  for (const ref of inboundRefs) {
    if (ref.kind === 'element' || ref.kind === 'state_element') {
      // The element survives, it just no longer navigates.
      deletions.push(ref.path);
    } else {
      // Navigation items and back links are objects around their target; delete the whole thing.
      deletions.push(ref.path.slice(0, -1));
    }
  }

  deletions
    .sort(comparePathsForDeletion)
    .forEach((path) => parsed.ydoc.deleteIn(path));

  return { ok: true, changes: deletions.length, inboundRefs };
}

export type ElementStateKey = 'empty' | 'loading' | 'error';

/** Stale-index guard: when given, the op is refused unless the addressed element matches. */
export interface ElementGuard {
  type?: string;
  label?: string;
}

/**
 * Patch for an `update` op: keys present are written, keys absent are left
 * untouched (so `x_` extension fields survive), an explicit `null` deletes
 * the key. `type` cannot be deleted.
 */
export type ElementPatch = Record<string, unknown>;

export type ElementOp =
  | { op: 'insert'; state?: ElementStateKey; index: number; element: Element }
  | { op: 'update'; state?: ElementStateKey; index: number; set: ElementPatch; expect?: ElementGuard }
  | { op: 'remove'; state?: ElementStateKey; index: number; expect?: ElementGuard }
  | { op: 'move'; state?: ElementStateKey; index: number; to: number; expect?: ElementGuard };

const STATE_KEYS: readonly ElementStateKey[] = ['empty', 'loading', 'error'];

/**
 * Edit a screen's `elements` list (or a declared state's list) in place:
 * insert, update, remove, move. The batch is atomic — every op is checked
 * against a simulated copy first, so a failing op leaves the document
 * untouched. Ops apply sequentially: each op's `index` addresses the list as
 * left by the previous ops. Safe by default: an op that would introduce a
 * `target` not matching any screen is refused, as is editing a state the
 * screen does not declare (declaring states is a screen-shape decision).
 */
export function editElements(parsed: ParsedDocument, screenId: string, ops: ElementOp[]): EditResult {
  const doc = parsed.data;
  const screens = doc.screens ?? [];
  const screenIdx = screens.findIndex((s) => s?.id === screenId);
  if (screenIdx === -1) return { ok: false, reason: `No screen with id '${screenId}'`, changes: 0 };
  if (ops.length === 0) return { ok: false, reason: 'No operations given', changes: 0 };

  const screen = screens[screenIdx];
  const screenIds = new Set(screens.map((s) => s?.id));

  // Pass 1 — validate every op against simulated lists; nothing is written unless all pass.
  const sim = new Map<string, { type?: unknown; label?: unknown }[]>();
  const listFor = (state?: ElementStateKey) => {
    const key = state ?? '';
    if (!sim.has(key)) {
      const source = state ? screen.states?.[state]?.elements : screen.elements;
      sim.set(key, (source ?? []).map((e) => ({ type: e?.type, label: e?.label })));
    }
    return sim.get(key)!;
  };

  for (let i = 0; i < ops.length; i++) {
    const o = ops[i];
    const listName = o.state ? `states.${o.state}.elements` : 'elements';
    const fail = (message: string): EditResult => ({ ok: false, reason: `op ${i} (${o.op}): ${message}`, changes: 0 });

    if (o.state !== undefined) {
      if (!STATE_KEYS.includes(o.state)) return fail(`'${o.state}' is not a state (empty | loading | error)`);
      const variant = screen.states?.[o.state];
      if (variant == null || typeof variant !== 'object') {
        return fail(`screen '${screenId}' does not declare state '${o.state}' — add the state to the screen first`);
      }
    }
    const list = listFor(o.state);
    if (!Number.isInteger(o.index) || o.index < 0) return fail(`index must be a non-negative integer, got ${o.index}`);

    // Address check: insert may point one past the end (append); everything else needs an existing element.
    const maxIndex = o.op === 'insert' ? list.length : list.length - 1;
    if (o.index > maxIndex) {
      return fail(`index ${o.index} out of range — ${listName} of '${screenId}' has ${list.length} element(s)`);
    }
    if (o.op !== 'insert' && o.expect) {
      const found = list[o.index];
      const mismatch =
        (o.expect.type !== undefined && o.expect.type !== found.type) ||
        (o.expect.label !== undefined && o.expect.label !== found.label);
      if (mismatch) {
        return fail(
          `guard mismatch at ${listName}[${o.index}] of '${screenId}' — found type '${found.type}', label '${found.label}'`,
        );
      }
    }

    switch (o.op) {
      case 'insert': {
        const shapeError = checkElementFields(o.element as unknown as Record<string, unknown>, { requireType: true });
        if (shapeError) return fail(shapeError);
        const target = o.element?.target;
        if (typeof target === 'string' && !screenIds.has(target)) {
          return fail(`target '${target}' does not match any screen`);
        }
        list.splice(o.index, 0, { type: o.element.type, label: o.element.label });
        break;
      }
      case 'update': {
        if (!o.set || Object.keys(o.set).length === 0) return fail('set must contain at least one key');
        if ('type' in o.set && o.set.type == null) return fail(`'type' cannot be deleted`);
        const shapeError = checkElementFields(o.set, { allowNull: true });
        if (shapeError) return fail(shapeError);
        if (typeof o.set.target === 'string' && !screenIds.has(o.set.target)) {
          return fail(`target '${o.set.target}' does not match any screen`);
        }
        const el = list[o.index];
        if ('type' in o.set) el.type = o.set.type;
        if ('label' in o.set) el.label = o.set.label ?? undefined;
        break;
      }
      case 'remove':
        list.splice(o.index, 1);
        break;
      case 'move': {
        if (!Number.isInteger(o.to) || o.to < 0 || o.to >= list.length) {
          return fail(`'to' ${o.to} out of range — ${listName} of '${screenId}' has ${list.length} element(s)`);
        }
        const [el] = list.splice(o.index, 1);
        list.splice(o.to, 0, el);
        break;
      }
      default:
        return fail(`unknown operation '${(o as { op: string }).op}'`);
    }
  }

  // Pass 2 — apply to the YAML document (comments and unrelated formatting untouched).
  const screenPath: DocPath = ['screens', screenIdx];
  const seqPath = (state?: ElementStateKey): DocPath =>
    state ? [...screenPath, 'states', state, 'elements'] : [...screenPath, 'elements'];
  const seqAt = (state?: ElementStateKey) => {
    const node = parsed.ydoc.getIn(seqPath(state));
    return isSeq(node) ? (node as YAMLSeq) : undefined;
  };

  for (const o of ops) {
    switch (o.op) {
      case 'insert': {
        const node = parsed.ydoc.createNode(canonicalElementLiteral(o.element));
        const seq = seqAt(o.state);
        if (seq) {
          seq.items.splice(o.index, 0, node);
        } else {
          // No `elements` key yet (screen without one, or documentation-only state):
          // create it, then restore canonical key order in the parent map.
          parsed.ydoc.setIn(seqPath(o.state), parsed.ydoc.createNode([]));
          seqAt(o.state)!.items.splice(0, 0, node);
          const parentPath = o.state ? [...screenPath, 'states', o.state] : screenPath;
          const parent = parsed.ydoc.getIn(parentPath);
          if (isMap(parent)) orderKeys(parent as YAMLMap, o.state ? ORDER.stateVariant : ORDER.screen);
        }
        break;
      }
      case 'update': {
        const itemPath = [...seqPath(o.state), o.index];
        for (const [key, value] of Object.entries(o.set)) {
          if (value === null) parsed.ydoc.deleteIn([...itemPath, key]);
          else parsed.ydoc.setIn([...itemPath, key], value);
        }
        const item = parsed.ydoc.getIn(itemPath);
        if (isMap(item)) orderKeys(item as YAMLMap, ORDER.item);
        break;
      }
      case 'remove': {
        parsed.ydoc.deleteIn([...seqPath(o.state), o.index]);
        // Omit-empty (spec §11.1): a now-empty list drops its key entirely.
        if (seqAt(o.state)?.items.length === 0) parsed.ydoc.deleteIn(seqPath(o.state));
        break;
      }
      case 'move': {
        const seq = seqAt(o.state)!;
        const [node] = seq.items.splice(o.index, 1);
        seq.items.splice(o.to, 0, node);
        break;
      }
    }
  }

  return { ok: true, changes: ops.length };
}

/** Scalar sanity for the four known element fields; deep shape errors stay validator territory. */
function checkElementFields(
  fields: Record<string, unknown> | undefined,
  opts: { requireType?: boolean; allowNull?: boolean } = {},
): string | undefined {
  if (!fields || typeof fields !== 'object') return 'element requires an object with at least a type';
  if (opts.requireType && (typeof fields.type !== 'string' || fields.type === '')) {
    return `element requires a non-empty 'type'`;
  }
  for (const key of ['label', 'type', 'target', 'presentation']) {
    const value = fields[key];
    if (value === undefined) continue;
    if (value === null && opts.allowNull) continue;
    if (typeof value !== 'string') return `'${key}' must be a string, got ${JSON.stringify(value)}`;
  }
  return undefined;
}

/** Element literal with canonical key order (label, type, target, presentation, then x_ in author order). */
function canonicalElementLiteral(element: Element): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const source = element as unknown as Record<string, unknown>;
  for (const key of ORDER.item) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  for (const [key, value] of Object.entries(element)) {
    if (!(key in out) && value !== undefined) out[key] = value;
  }
  return out;
}

/** Deeper paths first; within the same container, higher indices first. */
function comparePathsForDeletion(a: DocPath, b: DocPath): number {
  if (a.length !== b.length) return b.length - a.length;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue;
    if (typeof a[i] === 'number' && typeof b[i] === 'number') return (b[i] as number) - (a[i] as number);
    return String(a[i]).localeCompare(String(b[i]));
  }
  return 0;
}
