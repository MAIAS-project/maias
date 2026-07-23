import type { Screen, Flow } from './types';

export interface TreeNode {
  segment: string;
  label: string;
  depth: number;
  screen?: Screen;
  flow?: string;
  children: TreeNode[];
}

function titleCase(str: string): string {
  return str
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\band\b/gi, '&')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function getSectionLabel(segment: string): string {
  return titleCase(segment);
}

interface Section {
  key: string;
  label: string;
  flowName: string;
  screenIds: Set<string>;
  entryPath: string;
}

export function buildScreenTree(screens: Screen[], flows: Flow[]): TreeNode[] {
  const screenMap = new Map<string, Screen>();
  for (const s of screens) screenMap.set(s.id, s);

  // Build sections from flows
  const sections: Section[] = [];
  const screenToSection = new Map<string, string>();

  for (const flow of flows) {
    if (flow.name === 'main') {
      // Expand each primary screen into its own section
      for (const sid of flow.screens) {
        const s = screenMap.get(sid);
        if (!s) continue;
        sections.push({
          key: sid,
          label: s.title,
          flowName: flow.name,
          screenIds: new Set([sid]),
          entryPath: s.path,
        });
        screenToSection.set(sid, sid);
      }
    } else {
      const entryScreen = screenMap.get(flow.entry_screen);
      sections.push({
        key: flow.name,
        label: titleCase(flow.name),
        flowName: flow.name,
        screenIds: new Set(flow.screens),
        entryPath: entryScreen?.path || '',
      });
      for (const sid of flow.screens) {
        screenToSection.set(sid, flow.name);
      }
    }
  }

  // Assign unassigned screens to sections by path prefix matching
  for (const screen of screens) {
    if (screenToSection.has(screen.id)) continue;

    let bestMatch: Section | undefined;
    let bestLength = 0;
    for (const section of sections) {
      const ep = section.entryPath;
      if (ep && screen.path.startsWith(ep) && ep.length > bestLength) {
        bestMatch = section;
        bestLength = ep.length;
      }
    }

    if (bestMatch) {
      bestMatch.screenIds.add(screen.id);
      screenToSection.set(screen.id, bestMatch.key);
    }
  }

  // Build tree nodes
  const result: TreeNode[] = [];

  for (const section of sections) {
    const sectionNode: TreeNode = {
      segment: section.key,
      label: section.label,
      depth: 0,
      children: [],
    };

    // Get screens in YAML order
    const sectionScreens = screens.filter(s => section.screenIds.has(s.id));

    for (const screen of sectionScreens) {
      const entryPath = section.entryPath;

      if (screen.path === entryPath) {
        // Section root screen
        sectionNode.screen = screen;
        sectionNode.flow = section.flowName;
        continue;
      }

      if (entryPath && screen.path.startsWith(entryPath + '/')) {
        // Nested under entry path — build trie from relative segments
        const relativeParts = screen.path.slice(entryPath.length + 1).split('/').filter(Boolean);
        let parent = sectionNode;
        for (let i = 0; i < relativeParts.length; i++) {
          const seg = relativeParts[i];
          const isLeaf = i === relativeParts.length - 1;

          let child = parent.children.find(c => c.segment === seg);
          if (!child) {
            child = {
              segment: seg,
              label: titleCase(seg),
              depth: i + 1,
              children: [],
            };
            parent.children.push(child);
          }

          if (isLeaf) {
            child.screen = screen;
            child.flow = section.flowName;
          }

          parent = child;
        }
      } else {
        // Doesn't share entry path prefix — add as direct child
        sectionNode.children.push({
          segment: screen.id,
          label: screen.title,
          depth: 1,
          screen,
          flow: section.flowName,
          children: [],
        });
      }
    }

    result.push(sectionNode);
  }

  return result;
}

export function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  function walk(list: TreeNode[]) {
    for (const node of list) {
      if (node.screen) result.push(node);
      walk(node.children);
    }
  }
  walk(nodes);
  return result;
}
