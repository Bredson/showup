// Bottom sheet with a read-only entry preview (emotion + IF-THEN + reflection).
// Shared by Progress (tap a calendar dot) and Journal (tap a list row).
import { useEffect, useRef } from 'react';
import type { LegacyDailyEntry } from '../../domain/types';
import { challengeById } from '../../content';
import { EMOTION_EMOJI } from '../emotions';
import { useLang, useT } from '../LangContext';

interface Props {
  entry: LegacyDailyEntry;
  /** Already formatted for the current language (formatting stays in the caller). */
  date: string;
  onClose: () => void;
}

export default function EntrySheet({ entry, date, onClose }: Props) {
  const t = useT();
  const lang = useLang();
  const panelRef = useRef<HTMLDivElement>(null);
  const challenge = challengeById.get(entry.challengeId) ?? null;

  // Same modal basics as DailyLoop, plus focus restore: unlike the fullscreen loop,
  // the sheet has interactive content behind it, so focus must return to the invoking element.
  useEffect(() => {
    const invoker = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();
    return () => invoker?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div
        className="sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-label={date}
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-header">
          <p className="muted">{date}</p>
          <button className="loop-close" aria-label={t('sheet.close')} onClick={onClose}>
            ×
          </button>
        </div>
        {challenge && <h2>{t(`category.${challenge.category}`)}</h2>}
        {entry.emotionBefore && (
          <p>
            <span aria-hidden>{EMOTION_EMOJI[entry.emotionBefore]}</span> {t(`loop.emotion.${entry.emotionBefore}`)}
          </p>
        )}
        {entry.ifThen && <p className="muted">{t('sheet.plan', { value: entry.ifThen })}</p>}
        <p>{t('sheet.reflection', { value: entry.reflection ?? '—' })}</p>
        {challenge && <p className="muted">{challenge.i18n[lang].task}</p>}
      </div>
    </div>
  );
}
