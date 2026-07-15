// Shared date formatting for screens (Progress, Journal). Formatting only —
// the clock is never read here; dates always arrive as parameters (clock rule).
import type { ISODate, Lang } from '../domain/types';

const LOCALES: Record<Lang, string> = { pl: 'pl-PL', en: 'en-GB' };

/**
 * "niedziela, 12 lipca" / "Sunday, 12 July" — for entry previews and journal rows.
 * Pass `today` for unbounded lists (journal): entries from another year then include the year.
 * The Progress calendar (28-day window) can safely omit it.
 */
export function formatDayLong(date: ISODate, lang: Lang, today?: ISODate): string {
  const differentYear = today !== undefined && date.slice(0, 4) !== today.slice(0, 4);
  return new Date(`${date}T00:00:00`).toLocaleDateString(LOCALES[lang], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(differentYear ? { year: 'numeric' } : {}),
  });
}

/** "12 lip" / "12 Jul" — compact axis labels on the Max Test curve. */
export function formatDayShort(date: ISODate, lang: Lang): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(LOCALES[lang], {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Single-letter weekday ("P", "Ś" / "M", "W") — Progress calendar column headers.
 * Computed from the actual column dates: the 28-day window is rolling (ends today),
 * so hardcoded Mon–Sun letters would lie about the columns.
 */
export function formatWeekdayNarrow(date: ISODate, lang: Lang): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(LOCALES[lang], { weekday: 'narrow' });
}
