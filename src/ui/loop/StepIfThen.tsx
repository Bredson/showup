// Step 3.3 — optional if-then plan (Gollwitzer). Present for everyone, filling is optional;
// skipping is a muted link with zero guilt (ux-spec §3.3).
import { useState } from 'react';
import { useT } from '../LangContext';

interface Props {
  initialValue: string | null;
  /** After 3 consecutive skips the educational line disappears — the step stays (ux-spec §3.3). */
  hideEducation: boolean;
  onSave: (text: string | null) => void;
}

export default function StepIfThen({ initialValue, hideEducation, onSave }: Props) {
  const t = useT();
  const [text, setText] = useState(initialValue ?? '');
  const chips = [t('loop.ifthen.chip1'), t('loop.ifthen.chip2'), t('loop.ifthen.chip3')];

  return (
    <div className="loop-body">
      <h2>{t('loop.ifthen.question')}</h2>
      {!hideEducation && <p className="muted">{t('loop.ifthen.why')}</p>}
      <textarea
        className="text-input"
        value={text}
        aria-label={t('loop.ifthen.question')}
        placeholder={t('loop.ifthen.placeholder')}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="chip-row">
        {chips.map((chip) => (
          <button key={chip} className="chip" onClick={() => setText(`${t('loop.ifthen.template.when')} ${chip}, `)}>
            {chip}
          </button>
        ))}
      </div>
      <button className="btn-primary" onClick={() => onSave(text)}>
        {t('loop.ifthen.save')}
      </button>
      <button className="btn-link" onClick={() => onSave(null)}>
        {t('loop.ifthen.skip')}
      </button>
    </div>
  );
}
