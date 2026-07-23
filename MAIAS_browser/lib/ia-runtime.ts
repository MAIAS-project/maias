import type { MaiasDocument, Flow, Presentation, Screen } from '@maias/core';

interface PatternEntry {
  regex: RegExp;
  screenId: string;
}

/**
 * Per-document runtime: screen registry + URL↔screen resolution for one loaded
 * MAIAS document. Replaces the old import-time singletons (screen-registry.ts /
 * path-resolver.ts) — instances are created per document and provided through
 * React context (R3.3).
 */
export class IaRuntime {
  readonly doc: MaiasDocument;
  private readonly byId = new Map<string, Screen>();
  private readonly exactPaths = new Map<string, string>(); // path → screen id
  private readonly patterns: PatternEntry[] = [];
  private readonly pathById = new Map<string, string>(); // screen id → path

  constructor(doc: MaiasDocument) {
    this.doc = doc;
    for (const screen of doc.screens) {
      if (!this.byId.has(screen.id)) this.byId.set(screen.id, screen);
      this.pathById.set(screen.id, screen.path);
      if (screen.path.includes(':')) {
        const regexStr = '^' + screen.path.replace(/:[a-z][a-z0-9_]*/g, '([^/]+)') + '$';
        this.patterns.push({ regex: new RegExp(regexStr), screenId: screen.id });
      } else {
        this.exactPaths.set(screen.path, screen.id);
      }
    }
  }

  get appName(): string {
    return this.doc.app.name;
  }

  getScreen(id: string): Screen | undefined {
    return this.byId.get(id);
  }

  getAllScreens(): Screen[] {
    return this.doc.screens;
  }

  getFlows(): Flow[] {
    return this.doc.app.flows;
  }

  /** Screens of the persistent tab bar, in tab order (spec §6.1). */
  primaryScreens(): Screen[] {
    return this.doc.app.navigation.primary.screens
      .map((id) => this.byId.get(id))
      .filter((s): s is Screen => s !== undefined);
  }

  /** URL path → screen id (exact paths win over :param patterns, spec §2.4). */
  resolveScreenId(urlPath: string): string | undefined {
    const exact = this.exactPaths.get(urlPath);
    if (exact) return exact;
    for (const p of this.patterns) {
      if (p.regex.test(urlPath)) return p.screenId;
    }
    return undefined;
  }

  pathFor(screenId: string): string | undefined {
    return this.pathById.get(screenId);
  }

  /** Where the app opens: the first flow's entry screen (spec §3.2). */
  entryPath(): string {
    const entry = this.doc.app.flows[0]?.entry_screen;
    return (entry && this.pathFor(entry)) || this.primaryScreens()[0]?.path || '/';
  }

  /** Effective presentation for navigating to a screen (spec §4.4). */
  presentationFor(screenId: string, linkPresentation?: Presentation): Presentation {
    return linkPresentation ?? this.getScreen(screenId)?.presentation ?? 'push';
  }
}
