// Journal — PRD §5 pt 5, ux-spec §5. Reverse-chronological feed of session/test
// days with the feel check answered (user decision: easy days live only in the
// Progress calendar; started-but-unfinished days DO appear — the journal never
// judges execution, so there are no status markers of any kind).
// No editing, no deleting, no search, no "new entry" button (scope guard).
// RULE: everything here is derived from entries on render — nothing is persisted.
import { useEffect, useRef, useState } from 'react';
import type { ISODate } from '../../domain/types';
import { addDays } from '../../domain/calendar';
import { journalEntries, type JournalEntry } from '../../domain/journal';
import type { StorageAdapter } from '../../storage/adapter';
import { localToday } from '../clock';
import EntrySheet from '../components/EntrySheet';
import { formatDayLong } from '../dates';
import { FEEL_EMOJI } from '../feelEmoji';
import { useLang, useT } from '../LangContext';

type Boot = { phase: 'loading' } | { phase: 'error' } | { phase: 'ready'; feed: JournalEntry[] };

export default function JournalScreen({ adapter }: { adapter: StorageAdapter }) {
  const t = useT();
  const lang = useLang();
  const todayRef = useRef<ISODate>(localToday());
  const today = todayRef.current;
  const yesterday = addDays(today, -1);

  const [boot, setBoot] = useState<Boot>({ phase: 'loading' });
  const [sheetEntry, setSheetEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const entries = await adapter.getAllEntries();
        if (!cancelled) setBoot({ phase: 'ready', feed: journalEntries(entries) });
      } catch (err) {
        console.error('Showup: loading journal failed', err);
        if (!cancelled) setBoot({ phase: 'error' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adapter]);

  if (boot.phase === 'loading') return null;
  if (boot.phase === 'error') {
    return (
      <div className="screen">
        <h1>{t('journal.title')}</h1>
        <p className="muted">{t('app.loadError')}</p>
      </div>
    );
  }

  const { feed } = boot;

  if (feed.length === 0) {
    return (
      <div className="screen">
        <h1>{t('journal.title')}</h1>
        <section className="card center">
          <p className="journal-empty-art" aria-hidden="true">
            ✎
          </p>
          <p className="muted">{t('journal.empty')}</p>
        </section>
      </div>
    );
  }

  const dateLabel = (date: ISODate): string =>
    date === today
      ? t('journal.date.today')
      : date === yesterday
        ? t('journal.date.yesterday')
        : formatDayLong(date, lang, today);

  return (
    <div className="screen">
      <h1>{t('journal.title')}</h1>
      <ul className="journal-list">
        {feed.map((entry) => (
          <li key={entry.date}>
            {/* No aria-label on the row: its text content IS the accessible name
                (code-style F7 lesson — a label would override the content). */}
            <button type="button" className="journal-row" onClick={() => setSheetEntry(entry)}>
              <span className="journal-row-emoji" role="img" aria-label={t(`today.feel.${entry.feelBefore}`)}>
                {FEEL_EMOJI[entry.feelBefore]}
              </span>
              <span className="journal-row-body">
                <span className="muted">{dateLabel(entry.date)}</span>
                <span className="journal-row-title">
                  {t('sheet.kindVariant', {
                    kind: t(`today.title.${entry.kind}`),
                    variant: t(`variant.${entry.variant}`),
                  })}
                </span>
                {entry.reflection !== null && entry.reflection !== '' ? (
                  <span className="journal-row-reflection">{entry.reflection}</span>
                ) : (
                  /* A dash carries no information — hidden from SR (no guilt-noise; ux-spec §5). */
                  <span className="journal-row-reflection muted" aria-hidden="true">
                    {t('journal.noReflection')}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {sheetEntry !== null && (
        <EntrySheet entry={sheetEntry} today={today} onClose={() => setSheetEntry(null)} />
      )}
    </div>
  );
}
