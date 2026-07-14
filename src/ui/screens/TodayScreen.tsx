// Today screen (ux-spec §2, design variant 1c "zenlife hero"):
// two-color greeting + abstract art, streak/level pills, challenge card with a 2:00 ring, motto footer.
import type { CSSProperties } from 'react';
import type { Challenge, DailyEntry, ProgressState } from '../../domain/types';
import { dayPartFor } from '../../domain/dailyLoop';
import { COMPLETIONS_TO_ADVANCE } from '../../domain/streak';
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

  const doneInLevel = progress.completedByLevel[progress.currentLevel];
  // Ring fill mirrors the level pill (e.g. 3/7 ≈ 43% — exactly the mock's value).
  const ringFill = Math.round((doneInLevel / COMPLETIONS_TO_ADVANCE) * 100);

  return (
    <div className="screen">
      <header className="today-hero">
        <h1>
          {t(greetingKey)}
          <br />
          <span className="hero-accent">{t('today.greeting.warm')}</span>
        </h1>
        {/* decorative abstract shapes (mock 1c) — pure CSS, invisible to screen readers */}
        <div className="today-art" aria-hidden>
          <div />
          <div />
          <div />
        </div>
      </header>

      <div className="pill-row">
        {progress.currentStreak >= 2 && (
          <span className="pill">
            <span aria-hidden>🌿 </span>
            {t('today.streak', { days: progress.currentStreak })}
          </span>
        )}
        <span className="pill pill--soft">
          {t('today.levelPill', { level: progress.currentLevel, done: doneInLevel, total: COMPLETIONS_TO_ADVANCE })}
        </span>
      </div>

      {isFirstTime && <p className="today-first">{t('today.firstTime')}</p>}

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
        <div className="card today-card">
          <p className="eyebrow">{t('today.challengeEyebrow')}</p>
          <div className="today-card-row">
            {/* 2:00 = the two-minute rule badge; ring fill = level progress (decorative, data lives in the pill) */}
            <div className="ring" style={{ '--ring-fill': `${ringFill}%` } as CSSProperties} aria-hidden>
              <div className="ring-center">
                {t('today.ring.time')}
                <span>{t('today.ring.minutes')}</span>
              </div>
            </div>
            <div className="today-card-text">
              <h2>{t(`category.${challenge.category}`)}</h2>
              <p className="muted">{teaser(challenge.i18n[lang].lesson)}</p>
            </div>
          </div>
          <button className="btn-primary" onClick={onStartLoop}>
            {loopStarted ? t('today.resume') : t('today.start')}
          </button>
        </div>
      ) : (
        // Finished/skipped entry whose challenge was removed by a content deploy (spec §6).
        <div className="card">
          <p className="muted">{t('today.missingContent')}</p>
        </div>
      )}

      <p className="today-motto muted">{t('app.tagline')}</p>
    </div>
  );
}
