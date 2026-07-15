// Progress — PRD §5 pkt 4: streak hero ("dni w rytmie"), rolling 28-day presence
// calendar, the Max Test curve segmented per variant, and the current program
// position. User decisions (2026-07-15): calendar dots show pure presence (green =
// any completed day, outline = forgiven; details behind a tap), streak copy is
// "dni w rytmie" everywhere, seeds/estimates are hollow points on the curve.
// RULE: everything here is derived from entries on render — nothing is persisted.
import { useEffect, useRef, useState } from 'react';
import type { DailyEntry, ISODate, ProgramState, UserProfile } from '../../domain/types';
import { computeCalendar, type CalendarDay } from '../../domain/calendar';
import { computeProgram, isGateTest, SLOTS_PER_WEEK } from '../../domain/program';
import { computeStreak, computeLongestStreak } from '../../domain/streak';
import { computeTestCurve, type TestCurve } from '../../domain/testCurve';
import { program } from '../../content/program';
import type { StorageAdapter } from '../../storage/adapter';
import { localToday } from '../clock';
import { formatDayLong, formatDayShort, formatWeekdayNarrow } from '../dates';
import { useLang, useT } from '../LangContext';

interface Props {
  adapter: StorageAdapter;
  profile: UserProfile;
}

type Boot =
  | { phase: 'loading' }
  | { phase: 'error' }
  | { phase: 'ready'; entries: readonly DailyEntry[] };

export default function ProgressScreen({ adapter, profile }: Props) {
  const t = useT();
  const todayRef = useRef<ISODate>(localToday());
  const today = todayRef.current;

  const [boot, setBoot] = useState<Boot>({ phase: 'loading' });
  const [sheetEntry, setSheetEntry] = useState<DailyEntry | null>(null);
  // Focus returns to the calendar dot that opened the sheet (a11y: modal contract).
  const sheetOpener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const entries = await adapter.getAllEntries();
        if (!cancelled) setBoot({ phase: 'ready', entries });
      } catch (err) {
        console.error('Showup: loading progress failed', err);
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
        <h1>{t('progress.title')}</h1>
        <p className="muted">{t('app.loadError')}</p>
      </div>
    );
  }

  const { entries } = boot;
  // Founding-day lesson (testing.md): computeProgram throws without a gate test.
  // A profile without one means a broken write mid-onboarding — degrade gracefully.
  const state = entries.some(isGateTest) ? computeProgram(entries, profile, program, today) : null;
  const streak = computeStreak(entries, today);
  const longest = computeLongestStreak(entries);
  const days = computeCalendar(entries, today);
  const curve = computeTestCurve(state?.testHistory ?? []);
  // Ring = presence over the last 7 calendar days (completed + forgiven), matching
  // the forgiving-streak philosophy: rhythm, not perfection.
  const last7 = days.slice(-7).filter((d) => d.status === 'completed' || d.status === 'forgiven');
  const ringFill = Math.round((last7.length / 7) * 100);

  return (
    <div className="screen">
      <h1>{t('progress.title')}</h1>

      <section className="card progress-hero">
        <div className="streak-ring" style={{ '--ring-fill': `${ringFill}%` } as React.CSSProperties}>
          <div className="streak-ring-center">
            <span className="streak-number">{streak}</span>
            <span className="streak-caption">{t('progress.hero.caption')}</span>
          </div>
        </div>
        <div className="progress-hero-info">
          <p className="progress-level-line">{t('progress.hero.longest', { n: longest })}</p>
          <p className="muted">{t('progress.hero.hint')}</p>
        </div>
      </section>

      <section className="card">
        <h2>{t('progress.calendar.title')}</h2>
        <Calendar
          days={days}
          today={today}
          onOpen={(entry, el) => {
            sheetOpener.current = el;
            setSheetEntry(entry);
          }}
        />
      </section>

      <section className="card">
        <h2>{t('progress.curve.title')}</h2>
        <Curve curve={curve} />
      </section>

      {state !== null && <PositionCard state={state} />}

      {sheetEntry !== null && (
        <EntrySheet
          entry={sheetEntry}
          today={today}
          onClose={() => {
            setSheetEntry(null);
            sheetOpener.current?.focus();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sections (top-level components — nesting them in render would remount on
// every parent state change and steal the sheet's focus; code-style lesson)
// ---------------------------------------------------------------------------

function Calendar({
  days,
  today,
  onOpen,
}: {
  days: CalendarDay<DailyEntry>[];
  today: ISODate;
  onOpen: (entry: DailyEntry, el: HTMLElement) => void;
}) {
  const t = useT();
  const lang = useLang();
  return (
    <>
      {/* Narrow weekday letters live on the actual column dates (rolling window). */}
      <div className="calendar-weekdays" aria-hidden="true">
        {days.slice(0, 7).map((d) => (
          <span key={d.date}>{formatWeekdayNarrow(d.date, lang)}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {days.map((d) => {
          const label = `${formatDayLong(d.date, lang, today)} — ${t(`progress.calendar.${d.status}`)}`;
          const dayNum = Number(d.date.slice(8, 10));
          if (d.entry !== null && d.entry.status === 'completed') {
            const entry = d.entry;
            return (
              <button
                key={d.date}
                type="button"
                className={`cal-dot cal-dot--${d.status}`}
                aria-label={label}
                onClick={(e) => onOpen(entry, e.currentTarget)}
              >
                {dayNum}
              </button>
            );
          }
          if (d.status === 'empty') {
            // Empty dot carries no information — hidden from SR (no guilt-noise; code-style rule).
            return (
              <span key={d.date} className="cal-dot cal-dot--empty" aria-hidden="true">
                {dayNum}
              </span>
            );
          }
          return (
            <span key={d.date} className={`cal-dot cal-dot--${d.status}`} role="img" aria-label={label}>
              {d.status === 'forgiven' ? '🍃' : dayNum}
            </span>
          );
        })}
      </div>
    </>
  );
}

/** Max Test curve — inline SVG, one polyline per variant segment (no chart lib). */
function Curve({ curve }: { curve: TestCurve }) {
  const t = useT();
  const lang = useLang();

  const W = 320;
  const H = 170;
  const L = 30; // room for y-axis labels
  const R = 310;
  const T = 22; // room for segment labels above points
  const B = 136; // plot bottom; date labels render below
  const yMax = Math.max(10, Math.ceil(curve.maxResult / 10) * 10);
  const x = (i: number) => (curve.pointCount <= 1 ? (L + R) / 2 : L + (i / (curve.pointCount - 1)) * (R - L));
  const y = (result: number) => B - (result / yMax) * (B - T);

  const allPoints = curve.segments.flatMap((s) => s.points);
  const first = allPoints[0];
  const last = allPoints[allPoints.length - 1];
  const hasSeeds = allPoints.some((p) => p.seed);

  /** Keep segment labels inside the viewBox: anchor to the nearest edge when close to it. */
  const labelAnchor = (px: number): { x: number; anchor: 'start' | 'middle' | 'end' } => {
    if (px < L + 50) return { x: L, anchor: 'start' };
    if (px > R - 50) return { x: R, anchor: 'end' };
    return { x: px, anchor: 'middle' };
  };

  if (first === undefined || last === undefined) {
    return <p className="muted">{t('progress.curve.empty')}</p>;
  }

  // testHistory[0] is always the real founding test (program invariant), so a
  // non-seed point always exists; `?? first` only satisfies the type system.
  const lastTest = [...allPoints].reverse().find((p) => !p.seed) ?? first;

  return (
    <>
      {/* Text equivalent of the chart for screen readers (SVG below is decorative). */}
      <p className="sr-only">
        {curve.segments
          .map((seg) => {
            const from = seg.points[0];
            const to = seg.points[seg.points.length - 1];
            if (from === undefined || to === undefined) return '';
            const variant = t(`variant.${seg.variant}`);
            return from.index === to.index
              ? t('progress.curve.srPoint', { variant, value: from.result })
              : t('progress.curve.srSegment', { variant, from: from.result, to: to.result });
          })
          .join('; ')}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="curve-svg" aria-hidden="true">
        {[yMax, yMax / 2].map((v) => (
          <g key={v}>
            <line x1={L} y1={y(v)} x2={R} y2={y(v)} className="curve-grid" />
            <text x={L - 6} y={y(v) + 3} textAnchor="end" className="curve-axis">
              {v}
            </text>
          </g>
        ))}
        <line x1={L} y1={B} x2={R} y2={B} className="curve-grid" />
        {curve.segments.map((seg) => {
          const mid = seg.points[Math.floor((seg.points.length - 1) / 2)];
          const topY = Math.min(...seg.points.map((p) => y(p.result)));
          return (
            <g key={`${seg.variant}-${seg.points[0]?.index}`}>
              {seg.points.length > 1 && (
                <polyline
                  className="curve-line"
                  points={seg.points.map((p) => `${x(p.index)},${y(p.result)}`).join(' ')}
                />
              )}
              {mid !== undefined &&
                (() => {
                  const { x: lx, anchor } = labelAnchor(x(mid.index));
                  return (
                    <text x={lx} y={Math.max(10, topY - 10)} textAnchor={anchor} className="curve-label">
                      {t(`variant.${seg.variant}`)}
                    </text>
                  );
                })()}
              {seg.points.map((p) => (
                <circle
                  key={p.index}
                  cx={x(p.index)}
                  cy={y(p.result)}
                  r={4}
                  className={p.seed ? 'curve-dot curve-dot--seed' : 'curve-dot'}
                />
              ))}
            </g>
          );
        })}
        <text
          x={x(first.index)}
          y={H - 4}
          textAnchor={curve.pointCount <= 1 ? 'middle' : 'start'}
          className="curve-axis"
        >
          {formatDayShort(first.date, lang)}
        </text>
        {last.index !== first.index && (
          <text x={x(last.index)} y={H - 4} textAnchor="end" className="curve-axis">
            {formatDayShort(last.date, lang)}
          </text>
        )}
      </svg>
      <p className="muted">
        {t('progress.curve.last', { result: lastTest.result, variant: t(`variant.${lastTest.variant}`) })}
      </p>
      {curve.pointCount === 1 && <p className="muted">{t('progress.curve.baseline')}</p>}
      {hasSeeds && <p className="muted">{t('progress.curve.seedNote')}</p>}
    </>
  );
}

function PositionCard({ state }: { state: ProgramState }) {
  const t = useT();
  const weekLine =
    state.blockWeek === 'regen' ? t('progress.position.regen') : t('progress.position.week', { n: state.blockWeek });
  return (
    <section className="card">
      <h2>{t('progress.position.title')}</h2>
      <p className="badge">{t('today.variantLabel', { variant: t(`variant.${state.variant}`) })}</p>
      <p>{weekLine}</p>
      <p className="muted">
        {t('progress.position.sessions', { done: state.sessionsDoneThisWeek, total: SLOTS_PER_WEEK })}
      </p>
      <div className="level-bar" aria-hidden="true">
        <div
          className="level-bar-fill"
          style={{ width: `${Math.min(100, Math.round((state.sessionsDoneThisWeek / SLOTS_PER_WEEK) * 100))}%` }}
        />
      </div>
    </section>
  );
}

/** Entry preview bottom sheet — dialog semantics, Escape/overlay dismissal.
 *  The close button is the only focusable control, so the "trap" is a Tab
 *  no-op: without it Tab would land on background controls that aria-modal
 *  declares hidden (keyboard and SR views would diverge). */
function EntrySheet({ entry, today, onClose }: { entry: DailyEntry; today: ISODate; onClose: () => void }) {
  const t = useT();
  const lang = useLang();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div
      className="sheet-overlay"
      role="presentation"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'Tab') e.preventDefault();
      }}
    >
      <div
        className="sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-label={formatDayLong(entry.date, lang, today)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-header">
          <h2>{formatDayLong(entry.date, lang, today)}</h2>
          <button
            ref={closeRef}
            type="button"
            className="loop-close"
            aria-label={t('progress.sheet.close')}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <p className="badge">
          {t('progress.sheet.kindVariant', {
            kind: t(`today.title.${entry.kind}`),
            variant: t(`variant.${entry.variant}`),
          })}
        </p>
        {entry.downgradedTo === 'easy' && <p className="muted">{t('progress.sheet.degraded')}</p>}
        {entry.sets !== null && entry.sets.length > 0 && (
          <p>{t('progress.sheet.sets', { sets: entry.sets.join(' · ') })}</p>
        )}
        {entry.testResult !== null && <p>{t('today.test.result', { result: entry.testResult })}</p>}
        {entry.easyContent !== null && <p>{t(`progress.sheet.easy.${entry.easyContent}`)}</p>}
        {entry.reflection !== null && entry.reflection !== '' && (
          <p className="muted">{t('progress.sheet.reflection', { text: entry.reflection })}</p>
        )}
      </div>
    </div>
  );
}
