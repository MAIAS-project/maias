/**
 * IA types come from @maias/core — the single implementation of the MAIAS model
 * (R6.1). Aliases below map legacy component-facing names onto the core model.
 */
export type {
  ActionEntry,
  MaiasDocument,
  Element,
  Flow,
  NavigationItem,
  Presentation,
  Screen,
  ScreenData,
  ScreenNavigation,
} from '@maias/core';

export type {
  MaiasDocument as AppIA,
  Element as WireframeElement,
  NavigationAction as ActionItem,
  ScreenNavigation as Navigation,
} from '@maias/core';
