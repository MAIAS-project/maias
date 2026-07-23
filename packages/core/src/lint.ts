import { CORE_ELEMENT_TYPES, type MaiasDocument, type DocPath, type Element } from './model.js';
import { CODES, type Diagnostic } from './diagnostics.js';
import { orphanScreens, outboundRefs, reachableScreens } from './graph.js';
import type { ParsedDocument } from './parse.js';

/**
 * Semantic lint (spec rules marked [lint]). Runs on the plain-data view and is
 * defensive about shape: it assumes nothing the schema hasn't guaranteed, so it
 * can produce useful findings even alongside schema errors.
 */
export function lint(parsed: ParsedDocument): Diagnostic[] {
  const doc = parsed.data;
  const out: Diagnostic[] = [];
  const at = (path: DocPath, code: string, severity: Diagnostic['severity'], message: string) =>
    out.push({ code, severity, message, path, ...parsed.position(path) });

  const screens = Array.isArray(doc?.screens) ? doc.screens : [];
  const flows = Array.isArray(doc?.app?.flows) ? doc.app.flows : [];
  const ids = new Set(screens.map((s) => s?.id).filter((id): id is string => typeof id === 'string'));

  // E001 duplicate screen IDs
  const seenIds = new Map<string, number>();
  screens.forEach((screen, i) => {
    if (typeof screen?.id !== 'string') return;
    if (seenIds.has(screen.id)) {
      at(['screens', i, 'id'], CODES.DUPLICATE_ID, 'error', `Duplicate screen id '${screen.id}' (first defined at screens[${seenIds.get(screen.id)}])`);
    } else {
      seenIds.set(screen.id, i);
    }
  });

  // E002 duplicate / colliding paths (parameter segments collide regardless of name)
  const seenPaths = new Map<string, { id: string; index: number }>();
  screens.forEach((screen, i) => {
    if (typeof screen?.path !== 'string') return;
    const shape = screen.path.replace(/:[a-z][a-z0-9_]*/g, ':param');
    const prev = seenPaths.get(shape);
    if (prev) {
      at(['screens', i, 'path'], CODES.DUPLICATE_PATH, 'error', `Path '${screen.path}' collides with '${prev.id}' — two screens would match the same URL`);
    } else {
      seenPaths.set(shape, { id: screen.id, index: i });
    }
  });

  // E003 dangling targets + W004 self-targets — the register-apple class of bug
  screens.forEach((screen, i) => {
    for (const ref of outboundRefs(screen, i)) {
      if (!ids.has(ref.target)) {
        at(ref.path, CODES.DANGLING_TARGET, 'error', `Dangling target '${ref.target}' on screen '${screen.id}' (${ref.kind}${ref.label ? ` '${ref.label}'` : ''}) — no such screen`);
      } else if (ref.target === screen.id) {
        at(ref.path, CODES.SELF_TARGET, 'warning', `Screen '${screen.id}' targets itself (${ref.kind}${ref.label ? ` '${ref.label}'` : ''})`);
      }
    }
  });

  // E004/E005/E009 flow integrity
  const seenFlows = new Set<string>();
  flows.forEach((flow, i) => {
    if (typeof flow?.name === 'string') {
      if (seenFlows.has(flow.name)) at(['app', 'flows', i, 'name'], CODES.DUPLICATE_FLOW, 'error', `Duplicate flow name '${flow.name}'`);
      seenFlows.add(flow.name);
    }
    const flowScreens = Array.isArray(flow?.screens) ? flow.screens : [];
    if (typeof flow?.entry_screen === 'string') {
      if (!ids.has(flow.entry_screen)) {
        at(['app', 'flows', i, 'entry_screen'], CODES.FLOW_ENTRY, 'error', `Flow '${flow.name}' entry_screen '${flow.entry_screen}' does not exist`);
      } else if (!flowScreens.includes(flow.entry_screen)) {
        at(['app', 'flows', i, 'entry_screen'], CODES.FLOW_ENTRY, 'error', `Flow '${flow.name}' entry_screen '${flow.entry_screen}' is not listed in its screens`);
      }
    }
    flowScreens.forEach((id, j) => {
      if (typeof id === 'string' && !ids.has(id)) {
        at(['app', 'flows', i, 'screens', j], CODES.FLOW_UNKNOWN_SCREEN, 'error', `Flow '${flow.name}' lists unknown screen '${id}'`);
      }
    });
  });

  // E006/E007/E008 navigation registry membership
  const primary = Array.isArray(doc?.app?.navigation?.primary?.screens) ? doc.app.navigation.primary.screens : [];
  const secondary = Array.isArray(doc?.app?.navigation?.secondary?.screens) ? doc.app.navigation.secondary.screens : [];
  const primarySet = new Set(primary);
  const secondarySet = new Set(secondary);
  (['primary', 'secondary'] as const).forEach((group) => {
    (group === 'primary' ? primary : secondary).forEach((id, j) => {
      if (typeof id === 'string' && !ids.has(id)) {
        at(['app', 'navigation', group, 'screens', j], CODES.REGISTRY_UNKNOWN_SCREEN, 'error', `Navigation registry (${group}) lists unknown screen '${id}'`);
      }
    });
  });
  screens.forEach((screen, i) => {
    if (typeof screen?.id !== 'string') return;
    const inPrimary = primarySet.has(screen.id);
    const inSecondary = secondarySet.has(screen.id);
    if (!inPrimary && !inSecondary) {
      at(['screens', i, 'id'], CODES.UNREGISTERED_SCREEN, 'error', `Screen '${screen.id}' is missing from the navigation registry — add it to app.navigation primary.screens or secondary.screens`);
    } else if (inPrimary && inSecondary) {
      at(['screens', i, 'id'], CODES.DOUBLY_REGISTERED_SCREEN, 'error', `Screen '${screen.id}' is in both primary.screens and secondary.screens — it must be in exactly one`);
    }
  });

  // W001 missing descriptions
  screens.forEach((screen, i) => {
    if (typeof screen?.id === 'string' && !screen.description) {
      at(['screens', i], CODES.MISSING_DESCRIPTION, 'warning', `Screen '${screen.id}' has no description — intent should travel with structure (spec §1.5)`);
    }
  });

  // W002/W003 reachability & orphans
  const reachable = reachableScreens(doc);
  const orphans = new Set(orphanScreens(doc));
  screens.forEach((screen, i) => {
    if (typeof screen?.id !== 'string' || reachable.has(screen.id)) return;
    if (orphans.has(screen.id)) {
      at(['screens', i], CODES.ORPHAN_SCREEN, 'warning', `Screen '${screen.id}' is an orphan — in no flow and unreachable from any entry point or primary navigation`);
    } else {
      at(['screens', i], CODES.UNREACHABLE_SCREEN, 'warning', `Screen '${screen.id}' is unreachable — no navigation path leads to it`);
    }
  });

  // W005 unknown element types without x_ prefix (probable typo; never an error — spec §10.1)
  const coreTypes = new Set(CORE_ELEMENT_TYPES);
  const checkElements = (elements: Element[] | undefined, base: DocPath, screenId: string) => {
    (elements ?? []).forEach((el, j) => {
      if (typeof el?.type === 'string' && !coreTypes.has(el.type) && !el.type.startsWith('x_')) {
        at([...base, j, 'type'], CODES.UNKNOWN_ELEMENT_TYPE, 'warning', `Unknown element type '${el.type}' on screen '${screenId}' — not in the core taxonomy and not x_-prefixed (typo? custom types should be x_<vendor>_<name>)`);
      }
    });
  };
  screens.forEach((screen, i) => {
    if (typeof screen?.id !== 'string') return;
    checkElements(screen.elements, ['screens', i, 'elements'], screen.id);
    for (const state of ['empty', 'loading', 'error'] as const) {
      checkElements(screen.states?.[state]?.elements, ['screens', i, 'states', state, 'elements'], screen.id);
    }
  });

  // W006 deep_link without an app scheme
  if (!doc?.app?.links?.scheme) {
    screens.forEach((screen, i) => {
      if (screen?.deep_link === true) {
        at(['screens', i, 'deep_link'], CODES.DEEP_LINK_NO_SCHEME, 'warning', `Screen '${screen.id}' declares deep_link but app.links.scheme is not set`);
      }
    });
  }

  // W007 navigation.primary on non-primary screens / inconsistent with the registry
  screens.forEach((screen, i) => {
    const items = screen?.navigation?.primary;
    if (!Array.isArray(items) || items.length === 0 || typeof screen?.id !== 'string') return;
    if (!primarySet.has(screen.id)) {
      at(['screens', i, 'navigation', 'primary'], CODES.PRIMARY_NAV_MISUSE, 'warning', `Screen '${screen.id}' declares navigation.primary but is not a primary screen — use navigation.secondary for contextual links`);
      return;
    }
    const declared = items.map((it) => it?.target).filter((t): t is string => typeof t === 'string');
    const mismatch = declared.filter((t) => !primarySet.has(t));
    if (mismatch.length > 0) {
      at(['screens', i, 'navigation', 'primary'], CODES.PRIMARY_NAV_MISUSE, 'warning', `Screen '${screen.id}' navigation.primary targets [${mismatch.join(', ')}] not in app.navigation.primary.screens`);
    }
  });

  // W008 action_sheet screens should present as sheet
  screens.forEach((screen, i) => {
    if (screen?.type === 'action_sheet' && !screen.presentation) {
      at(['screens', i], CODES.SHEET_PRESENTATION, 'warning', `Screen '${screen.id}' is an action_sheet but declares no presentation — add 'presentation: sheet' (spec §4.4)`);
    }
  });

  // W009 0.2-only features under a 0.1 version header (D28). The version
  // header is a declaration of the feature set in use — minor versions are
  // additive, so the fix is always "declare the higher version".
  if (doc?.maias === '0.1') {
    screens.forEach((screen, i) => {
      if (screen?.back !== undefined) {
        at(['screens', i, 'back'], CODES.VERSION_FEATURE_MISMATCH, 'warning', `Screen '${screen.id}' uses 'back' — a 0.2 feature — but the document declares maias: "0.1"; declare maias: "0.2"`);
      }
    });
  }

  return out;
}
