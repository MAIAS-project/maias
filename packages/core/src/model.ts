/**
 * Typed object model for MAIAS documents, mirroring spec v0.2 (docs/spec/) 1:1.
 * `x_`-prefixed extension fields may appear on any object; they are typed as
 * an index signature so they survive typed access without casts.
 */

export type Presentation = 'push' | 'replace' | 'modal' | 'sheet';
export type AuthGate = 'none' | 'required';

export type CoreScreenType =
  | 'action'
  | 'action_sheet'
  | 'container'
  | 'detail'
  | 'form'
  | 'informational'
  | 'list'
  | 'map'
  | 'marketing'
  | 'menu'
  | 'search'
  | 'status';

/** Core screen types plus `x_`-prefixed custom types. */
export type ScreenType = CoreScreenType | `x_${string}`;

export const CORE_SCREEN_TYPES: readonly CoreScreenType[] = [
  'action',
  'action_sheet',
  'container',
  'detail',
  'form',
  'informational',
  'list',
  'map',
  'marketing',
  'menu',
  'search',
  'status',
];

/** The 29 core element types (spec chapter 5). Custom types are `x_`-prefixed. */
export const CORE_ELEMENT_TYPES: readonly string[] = [
  // Text
  'title',
  'heading',
  'paragraph',
  'caption',
  'bullets',
  'label_value',
  // Layout
  'divider',
  'spacer',
  'card',
  // Actions
  'button',
  'icon_button',
  'link',
  'chips',
  // Inputs
  'text_field',
  'search_bar',
  'toggle',
  'checkbox',
  'radio_group',
  'dropdown',
  'slider',
  // Media
  'image',
  'avatar',
  'map',
  'video',
  // Lists & collections
  'list_item',
  'empty_state',
  // Feedback & status
  'banner',
  'progress',
  'segmented_control',
];

export interface Extensible {
  [key: `x_${string}`]: unknown;
}

export interface Element extends Extensible {
  type: string;
  label?: string;
  target?: string;
  presentation?: Presentation;
}

export interface NavigationItem extends Extensible {
  label: string;
  target: string;
  presentation?: Presentation;
}

export interface NavigationAction extends Extensible {
  label: string;
  external?: boolean;
}

/** Screen `actions` entries: plain string or labelled object. */
export type ActionEntry = string | NavigationAction;

export interface ScreenNavigation extends Extensible {
  primary?: NavigationItem[];
  secondary?: NavigationItem[];
  actions?: NavigationAction[];
}

/** Declared back affordance (spec §4.3, since 0.2). Label defaults to the target screen's title. */
export interface BackLink extends Extensible {
  target: string;
  label?: string;
}

export interface StateVariant extends Extensible {
  description?: string;
  elements?: Element[];
}

export interface ScreenStates extends Extensible {
  empty?: StateVariant;
  loading?: StateVariant;
  error?: StateVariant;
}

export interface ScreenData extends Extensible {
  reads?: string[];
  writes?: string[];
}

export interface Screen extends Extensible {
  id: string;
  title: string;
  type: ScreenType | string;
  path: string;
  description?: string;
  presentation?: Presentation;
  auth?: AuthGate;
  deep_link?: boolean;
  back?: BackLink;
  features?: string[];
  actions?: ActionEntry[];
  elements?: Element[];
  states?: ScreenStates;
  navigation?: ScreenNavigation;
  data?: ScreenData;
}

export interface Flow extends Extensible {
  name: string;
  description?: string;
  entry_screen: string;
  screens: string[];
}

export interface NavigationGroup extends Extensible {
  label?: string;
  screens: string[];
}

export interface NavigationRegistry extends Extensible {
  primary: NavigationGroup;
  secondary: NavigationGroup;
}

export interface AppLinks extends Extensible {
  scheme: string;
}

export interface App extends Extensible {
  name: string;
  description?: string;
  links?: AppLinks;
  navigation: NavigationRegistry;
  flows: Flow[];
}

export interface MaiasDocument extends Extensible {
  maias: string;
  app: App;
  screens: Screen[];
}

/** JSON path into the document: object keys and array indices. */
export type DocPath = (string | number)[];
