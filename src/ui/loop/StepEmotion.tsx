// Step 3.1 — mandatory emotion check-in (Dylemat 1: tap = action, auto-advance, no skip).
// The tap PERSISTS immediately (crash-safe rule); the 900 ms delay is visual-only and the
// timeout is cleaned up, so exiting via "×" during the window cannot touch unmounted state.
import { useEffect, useState } from 'react';
import type { Emotion } from '../../domain/types';
import { EMOTIONS } from '../../domain/dailyLoop';
import { EMOTION_EMOJI } from '../emotions';
import { useT } from '../LangContext';

const ADVANCE_DELAY_MS = 900; // just enough to read the one-line acknowledgement

interface Props {
  isFirstTime: boolean;
  /** Called synchronously at tap time — must persist the emotion. */
  onPersist: (emotion: Emotion) => void;
  /** Called after the acknowledgement delay — advances to the next step. */
  onAdvance: () => void;
}

export default function StepEmotion({ isFirstTime, onPersist, onAdvance }: Props) {
  const t = useT();
  const [picked, setPicked] = useState<Emotion | null>(null);

  useEffect(() => {
    if (!picked) return;
    const id = window.setTimeout(onAdvance, ADVANCE_DELAY_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onAdvance identity is stable enough; re-arming on parent re-render would double the delay
  }, [picked]);

  function pick(emotion: Emotion) {
    if (picked) return; // ignore double taps during the auto-advance window
    onPersist(emotion);
    setPicked(emotion);
  }

  return (
    <div className="loop-body">
      <h2>{t('loop.emotion.question')}</h2>
      {isFirstTime && <p className="muted">{t('loop.emotion.firstTime')}</p>}
      {/* list layout (design variant 1f): bigger touch targets than the old 2-col grid */}
      <div className="emotion-list">
        {EMOTIONS.map((emotion) => (
          <button
            key={emotion}
            className={`emotion-row${picked === emotion ? ' emotion-row--selected' : ''}`}
            aria-pressed={picked === emotion}
            onClick={() => pick(emotion)}
          >
            <span className="emotion-chip" aria-hidden>
              {EMOTION_EMOJI[emotion]}
            </span>
            {t(`loop.emotion.${emotion}`)}
            {picked === emotion && (
              <span className="emotion-dot" aria-hidden>
                ●
              </span>
            )}
          </button>
        ))}
      </div>
      {/* micro-validation as a speech bubble (1f), one sentence, then auto-advance (ux-spec §3.1) */}
      {picked && (
        <p className="ack-bubble" role="status">
          {t(`loop.emotion.ack.${picked}`)}
        </p>
      )}
    </div>
  );
}
