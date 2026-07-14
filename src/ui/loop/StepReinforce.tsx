// Step 3.6 — reinforcement: warm ~1.5s animation, concrete message, small progress bar.
import type { DailyEntry, ProgressState } from '../../domain/types';
import { COMPLETIONS_TO_ADVANCE } from '../../domain/streak';
import { useT } from '../LangContext';

interface Props {
  entry: DailyEntry;
  progress: ProgressState;
  onClose: () => void;
  onSeeProgress: () => void;
}

export default function StepReinforce({ entry, progress, onClose, onSeeProgress }: Props) {
  const t = useT();
  const emotion = entry.emotionBefore;
  const isFirstDay = progress.totalCompleted === 1;
  const inLevel = Math.min(progress.completedByLevel[progress.currentLevel], COMPLETIONS_TO_ADVANCE);

  return (
    <div className="loop-body bloom">
      <div className="done-check" aria-hidden>
        ✓
      </div>
      <h2 className="center">
        {isFirstDay
          ? t('loop.reinforce.firstDay')
          : emotion
            ? t('loop.reinforce.message', { emotion: t(`loop.emotion.${emotion}`).toLocaleLowerCase() })
            : t('loop.reinforce.messageNoEmotion')}
      </h2>
      <p className="muted center">
        {t('loop.reinforce.progress', { streak: Math.max(progress.currentStreak, 1), level: progress.currentLevel })}
      </p>
      <div className="level-dots" aria-hidden>
        {Array.from({ length: COMPLETIONS_TO_ADVANCE }, (_, i) => (
          <span key={i} className={i < inLevel ? 'filled' : ''} />
        ))}
      </div>
      <button className="btn-primary" onClick={onClose}>
        {t('loop.reinforce.bye')}
      </button>
      <button className="btn-link" onClick={onSeeProgress}>
        {t('loop.reinforce.seeProgress')}
      </button>
    </div>
  );
}
