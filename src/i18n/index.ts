// Showup — minimal i18n (2 languages, flat keys). No library needed (~40 lines).
// RULE: every user-facing string goes through t() — hardcoded strings are bugs.

import { pl } from './pl';
import { en } from './en';
import type { Lang } from '../domain/types';

export type TranslationKey = keyof typeof pl;

const dictionaries: Record<Lang, Record<TranslationKey, string>> = { pl, en };

export function translate(lang: Lang, key: TranslationKey, params?: Record<string, string | number>): string {
  let text: string = dictionaries[lang][key] ?? dictionaries.pl[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}
