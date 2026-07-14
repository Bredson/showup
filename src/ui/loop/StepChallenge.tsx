// Step 3.2 — challenge content: level badge, mini-lesson, task block, emotion-adapted line.
import type { Challenge, Emotion } from '../../domain/types';
import { useLang, useT } from '../LangContext';

interface Props {
  challenge: Challenge;
  emotion: Emotion | null;
  onNext: () => void;
}

export default function StepChallenge({ challenge, emotion, onNext }: Props) {
  const t = useT();
  const lang = useLang();
  const content = challenge.i18n[lang];

  return (
    <div className="loop-body">
      <span className="badge">{t('today.level', { level: challenge.level })}</span>
      <h2>{t(`category.${challenge.category}`)}</h2>
      <p>{content.lesson}</p>
      <div className="card card--alt">
        <h3>{t('loop.challenge.taskHeading')}</h3>
        <p>{content.task}</p>
      </div>
      {emotion && <p className="muted">{t(`loop.challenge.adapt.${emotion}`)}</p>}
      <button className="btn-primary" onClick={onNext}>
        {t('loop.next')}
      </button>
    </div>
  );
}
