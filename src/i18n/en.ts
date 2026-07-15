// English dictionary — must cover every TranslationKey from pl.ts.
import type { pl } from './pl';

export const en: Record<keyof typeof pl, string> = {
  'app.name': 'Showup',
  'app.tagline': 'The road to 100 pushups. Showing up counts, not the score.',
  'app.underConstruction': 'The app is under construction. Come back soon.',
  'app.loadError': 'Could not load your data. Refresh the page — your entries are safe.',
};
