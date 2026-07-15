// Daily loop orchestrator (ux-spec §3): fullscreen modal sequence over the Today tab.
// Every transition persists the entry immediately — "×" or a crash never loses progress.
import { useEffect, useRef, useState } from 'react';
import type { Challenge, LegacyDailyEntry, Emotion, ISODateTime, ProgressState } from '../../domain/types';
import { completeEntry, LOOP_STEPS, nextStep, resumeStep, setEmotion, setIfThen, type LoopStep } from '../../domain/dailyLoop';
import { useT } from '../LangContext';
import StepEmotion from './StepEmotion';
import StepChallenge from './StepChallenge';
import StepIfThen from './StepIfThen';
import StepExecution from './StepExecution';
import StepReflection from './StepReflection';
import StepReinforce from './StepReinforce';

interface Props {
  challenge: Challenge;
  entry: LegacyDailyEntry;
  progress: ProgressState;
  hideIfThenEducation: boolean;
  now: () => ISODateTime;
  /** Persists and returns nothing; App owns state + storage. */
  onEntryChange: (entry: LegacyDailyEntry) => void;
  onExit: () => void;
  onSeeProgress: () => void;
}

export default function DailyLoop({
  challenge,
  entry,
  progress,
  hideIfThenEducation,
  now,
  onEntryChange,
  onExit,
  onSeeProgress,
}: Props) {
  const t = useT();
  const [step, setStep] = useState<LoopStep>(() => resumeStep(entry));
  const dialogRef = useRef<HTMLDivElement>(null);

  // Modal basics: take focus on open, close on Escape (state is persisted, closing is safe).
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit]);

  /** Single source of step order: domain's nextStep (review #8). */
  function advance(updated?: LegacyDailyEntry) {
    if (updated) onEntryChange(updated);
    const next = nextStep(step);
    if (next) setStep(next);
  }

  const stepIndex = LOOP_STEPS.indexOf(step);

  return (
    <div className="loop" role="dialog" aria-modal="true" aria-label={t('loop.stepOf', { n: stepIndex + 1 })}>
      <div className="loop-inner" ref={dialogRef} tabIndex={-1}>
        <div className="loop-header">
          <div className="loop-dots" role="img" aria-label={t('loop.stepOf', { n: stepIndex + 1 })}>
            {LOOP_STEPS.map((s, i) => (
              <span key={s} className={i <= stepIndex ? 'active' : ''} />
            ))}
          </div>
          {/* the escape valve (Dylemat 1) — state is already persisted, so closing is always safe */}
          <button className="loop-close" aria-label={t('loop.close')} onClick={onExit}>
            ×
          </button>
        </div>

        {step === 'emotion' && (
          <StepEmotion
            isFirstTime={progress.totalCompleted === 0}
            onPersist={(emotion: Emotion) => onEntryChange(setEmotion(entry, emotion, now()))}
            onAdvance={() => advance()}
          />
        )}
        {step === 'challenge' && (
          <StepChallenge challenge={challenge} emotion={entry.emotionBefore} onNext={() => advance()} />
        )}
        {step === 'ifThen' && (
          <StepIfThen
            initialValue={entry.ifThen}
            hideEducation={hideIfThenEducation}
            onSave={(text) => advance(setIfThen(entry, text, now()))}
          />
        )}
        {step === 'execution' && (
          <StepExecution ifThen={entry.ifThen} onDone={() => advance()} onLater={onExit} />
        )}
        {step === 'reflection' && (
          <StepReflection
            challenge={challenge}
            onSave={(reflection) => advance(completeEntry(entry, reflection, now()))}
          />
        )}
        {step === 'reinforce' && (
          <StepReinforce entry={entry} progress={progress} onClose={onExit} onSeeProgress={onSeeProgress} />
        )}
      </div>
    </div>
  );
}
