// Progress screen (ux-spec §4, design variant 1h): "look what you already have" — never
// what's missing. No historical streak record here (a record is a hidden guilt mechanic).
import { useMemo, useState, type CSSProperties } from 'react';
import type { LegacyDailyEntry, ISODate, ProgressState } from '../../domain/types';
import { computeCalendar, type CalendarDay } from '../../domain/calendar';
import { COMPLETIONS_TO_ADVANCE } from '../../domain/streak';
import EntrySheet from '../components/EntrySheet';
import { formatDayLong, formatWeekdayNarrow } from '../dates';
import { useLang, useT } from '../LangContext';

interface Props {
  /** All entries including today's — calendar and progress are derived, never stored. */
  entries: LegacyDailyEntry[];
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

      {/* Hero card (1h): streak number + "days in rhythm" inside a conic ring; ring fill and
          the green bar both show level progress — the numbers live in the text line */}
      <div className="card progress-hero">
        <div
          className="streak-ring"
          style={{ '--ring-fill': `${Math.round((inLevel / COMPLETIONS_TO_ADVANCE) * 100)}%` } as CSSProperties}
        >
          <div className="streak-ring-center">
            <span className="streak-number">{progress.currentStreak}</span>
            <span className="streak-caption">
              {t(progress.currentStreak === 1 ? 'progress.streak.one' : 'progress.streak.many')}
            </span>
          </div>
        </div>
        <div className="progress-hero-info">
          <p className="progress-level-line">
            {t('progress.level.line', { level: progress.currentLevel, done: inLevel, total: COMPLETIONS_TO_ADVANCE })}
          </p>
          <div className="level-bar" aria-hidden>
            <div className="level-bar-fill" style={{ width: `${(inLevel / COMPLETIONS_TO_ADVANCE) * 100}%` }} />
          </div>
          {isComeback && <p className="muted">{t('progress.comeback')}</p>}
        </div>
      </div>

      {/* Calendar card: green ✓ = done, cream = nothing, forgiven = green outline + 🌿 (Dylemat 3 = A).
          Weekday letters come from the actual column dates — the window rolls, it is not Mon-aligned. */}
      <div className="card">
        <p className="muted">{t('progress.calendar.heading')}</p>
        <div className="calendar-weekdays" aria-hidden>
          {calendar.slice(0, 7).map((day) => (
            <span key={day.date}>{formatWeekdayNarrow(day.date, lang)}</span>
          ))}
        </div>
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
        {calendar.some((day) => day.status === 'forgiven') && (
          <p className="muted center">{t('progress.calendar.legend')}</p>
        )}
        {/* tooltip substitute that also works on touch — content includes the date, so tapping
            another forgiven dot changes the text and the status region re-announces it */}
        {restNote && (
          <p className="muted center" role="status">
            {t('progress.calendar.rest', { date: formatDayLong(restNote, lang) })}
          </p>
        )}
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
      >
        ✓
      </button>
    );
  }
  if (day.status === 'forgiven') {
    return (
      <button
        className="cal-dot cal-dot--forgiven"
        aria-label={t('progress.calendar.forgivenAria', { date: formatDayLong(day.date, lang) })}
        onClick={onRestTap}
      >
        🌿
      </button>
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
