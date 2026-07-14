// Today screen (ux-spec §2): exactly one challenge and an invitation into the loop.
import type { Challenge, DailyEntry, ProgressState } from '../../domain/types';
import { dayPartFor } from '../../domain/dailyLoop';
import { useLang, useT } from '../LangContext';

interface Props {
  challenge: Challenge | null;
  entry: DailyEntry;
  progress: ProgressState;
  /** Current local hour 0–23 — injected so the greeting is testable and clock-free here. */
  hour: number;
  onStartLoop: () => void;
  onSeeJournal: () => void;
}

/** First sentence of the lesson = the card teaser (full content only inside the loop). */
function teaser(text: string): string {
  const firstSentence = /^[^.!?]*[.!?]/.exec(text);
  return firstSentence ? firstSentence[0] : text;
}

export default function TodayScreen({ challenge, entry, progress, hour, onStartLoop, onSeeJournal }: Props) {
  const t = useT();
  const lang = useLang();
  const greetingKey = `today.greeting.${dayPartFor(hour)}` as const;
  const isDone = entry.status === 'completed';
  const isFirstTime = progress.totalCompleted === 0 && !isDone;
  const loopStarted = entry.emotionBefore !== null;

  return (
    <div className="screen">
      <h1>{t(greetingKey)}</h1>
      {progress.currentStreak >= 2 && <p className="muted">{t('today.streak', { days: progress.currentStreak })}</p>}
      {isFirstTime && <p>{t('today.firstTime')}</p>}

      {isDone ? (
        <div className="card center">
          <div className="done-check">✓</div>
          <h2>{t('today.done.title')}</h2>
          <p className="muted">{t('today.done.body')}</p>
          <button className="btn-link" onClick={onSeeJournal}>
            {t('today.done.journalLink')}
          </button>
        </div>
      ) : challenge ? (
        <>
          {/* plain card (headings inside a <button> are invalid HTML); the CTA below is the accessible path */}
          <div className="card">
            <span className="badge">{t('today.level', { level: challenge.level })}</span>
            <h2>{t(`category.${challenge.category}`)}</h2>
            <p className="muted">{teaser(challenge.i18n[lang].lesson)}</p>
          </div>
          <button className="btn-primary" onClick={onStartLoop}>
            {loopStarted ? t('today.resume') : t('today.start')}
          </button>
        </>
      ) : (
        // Finished/skipped entry whose challenge was removed by a content deploy (spec §6).
        <div className="card">
          <p className="muted">{t('today.missingContent')}</p>
        </div>
      )}
    </div>
  );
}
