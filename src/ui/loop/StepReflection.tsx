// Step 3.5 — mandatory reflection (Dylemat 2): can't close the loop without an answer,
// but a chip is a full one-tap answer. The question comes from the challenge content.
import { useState } from 'react';
import type { Challenge } from '../../domain/types';
import { useLang, useT } from '../LangContext';

interface Props {
  challenge: Challenge | null;
  onSave: (reflection: string) => void;
}

export default function StepReflection({ challenge, onSave }: Props) {
  const t = useT();
  const lang = useLang();
  const [text, setText] = useState('');
  const chips = [t('loop.reflect.chip1'), t('loop.reflect.chip2'), t('loop.reflect.chip3')];
  const canSave = text.trim().length > 0;

  return (
    <div className="loop-body">
      <h2>{challenge ? challenge.i18n[lang].reflection : t('loop.reflect.placeholder')}</h2>
      <textarea
        className="text-input"
        value={text}
        aria-label={challenge ? challenge.i18n[lang].reflection : t('loop.reflect.placeholder')}
        placeholder={t('loop.reflect.placeholder')}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="chip-row">
        {chips.map((chip) => (
          <button
            key={chip}
            className={`chip${text === chip ? ' chip--selected' : ''}`}
            onClick={() => setText(chip)}
          >
            {chip}
          </button>
        ))}
      </div>
      <button className="btn-primary" disabled={!canSave} onClick={() => canSave && onSave(text)}>
        {t('loop.reflect.save')}
      </button>
    </div>
  );
}
