// Journal screen (ux-spec §5): a record of emotions and reflections — never a judgment
// of execution (that's Progress). No edit/delete, no search, no "new entry" (scope creep).
import { useMemo, useState } from 'react';
import type { DailyEntry, ISODate } from '../../domain/types';
import { relativeDay, selectJournalEntries, type JournalEntry } from '../../domain/journal';
import { challengeById } from '../../content';
import EntrySheet from '../components/EntrySheet';
import { EMOTION_EMOJI } from '../emotions';
import { formatDayLong } from '../dates';
import { useLang, useT } from '../LangContext';

interface Props {
  /** All entries including today's — the journal is derived, never stored separately. */
  entries: DailyEntry[];
  today: ISODate;
}

export default function JournalScreen({ entries, today }: Props) {
  const t = useT();
  const lang = useLang();
  const [preview, setPreview] = useState<JournalEntry | null>(null);

  const journal = useMemo(() => selectJournalEntries(entries), [entries]);

  // "Dziś"/"Wczoraj" for the two freshest days, full date for everything older (ux-spec §5);
  // `today` makes entries from a past year include the year (the list is unbounded).
  function dateLabel(date: ISODate): string {
    const rel = relativeDay(date, today);
    if (rel === 'today') return t('journal.date.today');
    if (rel === 'yesterday') return t('journal.date.yesterday');
    return formatDayLong(date, lang, today);
  }

  if (journal.length === 0) {
    return (
      <div className="screen">
        <h1>{t('journal.title')}</h1>
        <div className="card center">
          <p className="journal-empty-art" aria-hidden>
            🌱
          </p>
          <p className="muted">{t('journal.empty')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <h1>{t('journal.title')}</h1>
      <ul className="journal-list">
        {journal.map((entry) => {
          const challenge = challengeById.get(entry.challengeId) ?? null;
          return (
            <li key={entry.date}>
              {/* No aria-label override: the row's text IS its accessible name, so screen readers
                  get the same date + title + reflection sighted users see. The emotion is data,
                  not decoration — role="img" with the same label EntrySheet uses. */}
              <button className="journal-row" onClick={() => setPreview(entry)}>
                <span
                  className="journal-row-emoji"
                  role="img"
                  aria-label={t(`loop.emotion.${entry.emotionBefore}`)}
                >
                  {EMOTION_EMOJI[entry.emotionBefore]}
                </span>
                <span className="journal-row-body">
                  <span className="muted">{dateLabel(entry.date)}</span>
                  {challenge && <span className="journal-row-title">{t(`category.${challenge.category}`)}</span>}
                  {/* entry without a reflection = "—", never "no reflection" (ux-spec §5) */}
                  <span className="journal-row-reflection">{entry.reflection ?? '—'}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {preview && <EntrySheet entry={preview} date={dateLabel(preview.date)} onClose={() => setPreview(null)} />}
    </div>
  );
}
