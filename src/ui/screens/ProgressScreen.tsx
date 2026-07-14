// Progress screen (ux-spec §4): "look what you already have" — never what's missing.
// No historical streak record here (comparing to a record is a hidden guilt mechanic).
import { useMemo, useState } from 'react';
import type { DailyEntry, ISODate, ProgressState } from '../../domain/types';
import { computeCalendar, type CalendarDay } from '../../domain/calendar';
import { COMPLETIONS_TO_ADVANCE } from '../../domain/streak';
import EntrySheet from '../components/EntrySheet';
import { formatDayLong } from '../dates';
import { useLang, useT } from '../LangContext';

interface Props {
  /** All entries including today's — calendar and progress are derived, never stored. */
  entries: DailyEntry[];
  progress: ProgressState;
  today: ISODate;
  onBackToToday: () => void;
}

export default function ProgressScreen({ entries, progress, today, onBackToToday }: Props) {
  const t = useT();
  const lang = useLang();
  const [preview, setPreview] = useState<CalendarDay | null>(null);
  const [restNote, setRestNote] = useState<ISODate | null>(null);

  const calendar = useMemo(() => computeCalendar(entries, today), [entries, today]);
  const todayDone = entries.some((e) => e.date === today && e.status === 'completed');
  const isComeback = progress.currentStreak === 0 && progress.totalCompleted > 0;
  const inLevel = Math.min(progress.completedByLevel[progress.currentLevel], COMPLETIONS_TO_ADVANCE);

  return (
    <div className="screen">
      <h1>{t('progress.title')}</h1>

      {/* Streak card: big number + "days in rhythm" (never "in a row") inside a soft ring */}
      <div className="card streak-card">
        <div className="streak-ring">
          <span className="streak-number">{progress.currentStreak}</span>
        </div>
        <p className="muted">{t(progress.currentStreak === 1 ? 'progress.streak.one' : 'progress.streak.many')}</p>
        {isComeback && <p className="center">{t('progress.comeback')}</p>}
      </div>

      {/* Calendar card: green = done, cream = nothing, forgiven = explicit green outline (Dylemat 3 = A) */}
      <div className="card">
        <p className="muted">{t('progress.calendar.heading')}</p>
        <div className="calendar-grid" role="group" aria-label={t('progress.calendar.heading')}>
          {calendar.map((day) => (
            <CalendarDot
              key={day.date}
              day={day}
              onPreview={() => setPreview(day)}
              onRestTap={() => setRestNote(day.date)}
            />
          ))}
        </div>
        {/* tooltip substitute that also works on touch — content includes the date, so tapping
            another forgiven dot changes the text and the status region re-announces it */}
        {restNote && (
          <p className="muted center" role="status">
            {t('progress.calendar.rest', { date: formatDayLong(restNote, lang) })}
          </p>
        )}
      </div>

      {/* Level card + the same 7 dots the loop's reinforcement step uses */}
      <div className="card center">
        <h2>{t('progress.level.heading', { level: progress.currentLevel })}</h2>
        <div className="level-dots" aria-hidden>
          {Array.from({ length: COMPLETIONS_TO_ADVANCE }, (_, i) => (
            <span key={i} className={i < inLevel ? 'filled' : ''} />
          ))}
        </div>
        <p className="muted">{t('progress.level.count', { done: inLevel, total: COMPLETIONS_TO_ADVANCE })}</p>
      </div>

      {/* Contextual CTA — only while today's challenge is still open (ux-spec §4) */}
      {!todayDone && (
        <button className="btn-primary" onClick={onBackToToday}>
          {t('progress.cta.backToToday')}
        </button>
      )}

      {preview?.entry && (
        <EntrySheet entry={preview.entry} date={formatDayLong(preview.date, lang)} onClose={() => setPreview(null)} />
      )}
    </div>
  );
}

function CalendarDot({ day, onPreview, onRestTap }: { day: CalendarDay; onPreview: () => void; onRestTap: () => void }) {
  const t = useT();
  const lang = useLang();

  if (day.status === 'completed') {
    return (
      <button
        className="cal-dot cal-dot--completed"
        aria-label={t('progress.calendar.completedAria', { date: formatDayLong(day.date, lang) })}
        onClick={onPreview}
      />
    );
  }
  if (day.status === 'forgiven') {
    return (
      <button
        className="cal-dot cal-dot--forgiven"
        aria-label={t('progress.calendar.forgivenAria', { date: formatDayLong(day.date, lang) })}
        onClick={onRestTap}
      />
    );
  }
  if (day.status === 'pending') {
    // today carries real information ("still open"), so it must be visible to assistive tech
    return (
      <span
        className="cal-dot cal-dot--pending"
        role="img"
        aria-label={t('progress.calendar.todayAria', { date: formatDayLong(day.date, lang) })}
      />
    );
  }
  // empty: nothing happens on tap (ux-spec §4) — non-interactive and hidden (no guilt markers)
  return <span className="cal-dot" aria-hidden />;
}
