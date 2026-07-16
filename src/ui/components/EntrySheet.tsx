// Shared entry-preview bottom sheet — used by the Progress calendar and the
// Journal list (extracted in the Journal phase; code-style rule: extract, don't copy).
// Shows everything a DailyEntry recorded: feel, kind·variant, degradation, sets,
// test result, easy-day minimum, reflection. It never judges execution — no
// status labels (ux-spec §5: the journal is not Progress).
import { useEffect, useRef } from 'react';
import type { DailyEntry, ISODate } from '../../domain/types';
import { formatDayLong } from '../dates';
import { FEEL_EMOJI } from '../feelEmoji';
import { useLang, useT } from '../LangContext';

/** Entry preview bottom sheet — dialog semantics, Escape/overlay dismissal.
 *  The close button is the only focusable control, so the "trap" is a Tab
 *  no-op: without it Tab would land on background controls that aria-modal
 *  declares hidden (keyboard and SR views would diverge).
 *  Focus lands on ✕ at mount and returns to the invoker in the effect
 *  cleanup (code-style F6) — callers need no focus bookkeeping. */
export default function EntrySheet({
  entry,
  today,
  onClose,
}: {
  entry: DailyEntry;
  today: ISODate;
  onClose: () => void;
}) {
  const t = useT();
  const lang = useLang();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // Cleanup (not onClose) also covers unmount paths that skip onClose.
    const invoker = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    return () => {
      invoker?.focus();
    };
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
          <button ref={closeRef} type="button" className="loop-close" aria-label={t('sheet.close')} onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="badge">
          {t('sheet.kindVariant', {
            kind: t(`today.title.${entry.kind}`),
            variant: t(`variant.${entry.variant}`),
          })}
        </p>
        {entry.feelBefore !== null && (
          <p>
            {/* Emoji is decorative here — the text label right after carries the meaning. */}
            <span aria-hidden="true">{FEEL_EMOJI[entry.feelBefore]} </span>
            {t('sheet.feel', { feel: t(`today.feel.${entry.feelBefore}`) })}
          </p>
        )}
        {entry.downgradedTo === 'easy' && <p className="muted">{t('sheet.degraded')}</p>}
        {entry.sets !== null && entry.sets.length > 0 && <p>{t('sheet.sets', { sets: entry.sets.join(' · ') })}</p>}
        {entry.testResult !== null && <p>{t('today.test.result', { result: entry.testResult })}</p>}
        {entry.easyContent !== null && <p>{t(`sheet.easy.${entry.easyContent}`)}</p>}
        {entry.longSetReps != null && <p>{t('sheet.easy.longSetReps', { n: entry.longSetReps })}</p>}
        {entry.reflection !== null && entry.reflection !== '' && (
          <p className="muted">{t('sheet.reflection', { text: entry.reflection })}</p>
        )}
      </div>
    </div>
  );
}
