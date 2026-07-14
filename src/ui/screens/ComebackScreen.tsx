// Comeback interstitial (ux-spec §7): full-screen self-compassion moment shown once per return,
// BEFORE the Today screen. One CTA, no secondary link — the only way is forward.
// Never shows the number of missed days (a number reads as reproach).
import type { ComebackKind } from '../../domain/comeback';
import { useT } from '../LangContext';

interface Props {
  /** 'oneDay' = streak verified alive; 'multiDay' = every other return (domain: comebackKind). */
  kind: Exclude<ComebackKind, 'none'>;
  /** Dismisses the interstitial for good — nothing is persisted, state is derived at boot. */
  onContinue: () => void;
}

export default function ComebackScreen({ kind, onContinue }: Props) {
  const t = useT();
  const bodyKey = kind === 'oneDay' ? 'comeback.body.oneDay' : 'comeback.body.multiDay';
  return (
    <div className="screen comeback">
      <div className="screen-art" aria-hidden>
        🌤️
      </div>
      <h1>{t('comeback.title')}</h1>
      <p className="comeback-body">{t(bodyKey)}</p>
      <button className="btn-primary" onClick={onContinue}>
        {t('comeback.cta')}
      </button>
    </div>
  );
}
