// Shared date formatting for screens (Progress, Journal). Formatting only —
// the clock is never read here; dates always arrive as parameters (clock rule).
import type { ISODate, Lang } from '../domain/types';

const LOCALES: Record<Lang, string> = { pl: 'pl-PL', en: 'en-GB' };

/** "niedziela, 12 lipca" / "Sunday, 12 July" — for entry previews and journal rows. */
export function formatDayLong(date: ISODate, lang: Lang): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(LOCALES[lang], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
