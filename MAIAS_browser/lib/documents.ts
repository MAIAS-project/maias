/**
 * Bundled example documents. The Metro YAML transformer embeds these as raw
 * source text (D8); they are parsed + validated at runtime exactly like files
 * opened through the picker.
 */
export interface BundledDocument {
  id: string;
  name: string;
  description: string;
  text: string;
}

export const BUNDLED_DOCUMENTS: BundledDocument[] = [
  {
    id: 'todo_list',
    name: 'Todo List',
    description: 'Minimal 2-tab list app — CRUD, empty states.',
    text: require('../../examples/todo_list/maias.yaml') as string,
  },
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Single screen, action-heavy — the smallest useful document.',
    text: require('../../examples/calculator/maias.yaml') as string,
  },
  {
    id: 'social_network',
    name: 'SocialNet',
    description: '5 tabs — feed, modals & sheets, profiles, deep links.',
    text: require('../../examples/social_network/maias.yaml') as string,
  },
  {
    id: 'ecommerce',
    name: 'Shopfront',
    description: '4 tabs — catalogue hierarchy, cart, gated checkout journey.',
    text: require('../../examples/ecommerce/maias.yaml') as string,
  },
];
