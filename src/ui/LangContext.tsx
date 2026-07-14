// Language context + useT hook. The ONLY bridge between React and src/i18n.
import { createContext, useContext } from 'react';
import type { Lang } from '../domain/types';
import { translate, type TranslationKey } from '../i18n';

export const LangContext = createContext<Lang>('pl');

/** Translation hook bound to the current language. */
export function useT(): (key: TranslationKey, params?: Record<string, string | number>) => string {
  const lang = useContext(LangContext);
  return (key, params) => translate(lang, key, params);
}

export function useLang(): Lang {
  return useContext(LangContext);
}
