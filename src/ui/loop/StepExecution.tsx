// Step 3.4 — execution (2-minute rule). The timer is an aid, never a gate; no auto-fail.
// The countdown derives from an end TIMESTAMP, not from interval ticks: the user is expected
// to leave the app to do the task, and browsers throttle intervals in background tabs.
import { useEffect, useState } from 'react';
import { nowMs } from '../clock';
import { useT } from '../LangContext';

const TWO_MINUTES_MS = 120_000;

interface Props {
  ifThen: string | null;
  onDone: () => void;
  onLater: () => void;
}

export default function StepExecution({ ifThen, onDone, onLater }: Props) {
  const t = useT();
  const [endAt, setEndAt] = useState<number | null>(null); // null = timer not started
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (endAt === null) return;
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((endAt - nowMs()) / 1000)));
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [endAt]);

  const timerFinished = secondsLeft === 0;

  return (
    <div className="loop-body">
      <h2>{t('loop.exec.heading')}</h2>
      <p className="muted">{t('loop.exec.body')}</p>

      {ifThen && (
        <div className="card card--alt">
          <p className="muted">{t('loop.exec.yourPlan')}</p>
          <p>{ifThen}</p>
        </div>
      )}

      {endAt === null ? (
        <button className="btn-link" onClick={() => setEndAt(nowMs() + TWO_MINUTES_MS)}>
          {t('loop.exec.timerStart')}
        </button>
      ) : timerFinished ? (
        // announce only the finish to screen readers, never every second (review #6)
        <p className="center" role="status">
          {t('loop.exec.timerDone')}
        </p>
      ) : (
        secondsLeft !== null && (
          <p className="timer">
            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
          </p>
        )
      )}

      <button className="btn-primary" onClick={onDone}>
        {t('loop.exec.done')}
      </button>
      <button className="btn-link" onClick={onLater}>
        {t('loop.exec.later')}
      </button>
    </div>
  );
}
