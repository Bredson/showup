// English dictionary — must mirror every key from pl.ts (build fails otherwise via type check).
import type { pl } from './pl';

export const en: Record<keyof typeof pl, string> = {
  'app.name': 'Unstuck',
  'app.tagline': 'One small challenge a day, no pressure.',
};
