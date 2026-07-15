// Onboarding (PRD §5.1): disclaimer → rep standard → first Max Test (top-down
// cascade, max 2 real attempts) → 3 session days + IF-THEN → local profile.
// The cascade decisions live in domain (onboardingNextStep / resolveOnboardingResult);
// this screen only walks the steps and persists via buildOnboardingRecords at the end.
//
// Back navigation exists ONLY before the first test attempt: a recorded attempt is a
// real physical effort — you cannot "go back" and un-do it, so the flow moves forward.
import { useEffect, useRef, useState } from 'react';
import type { Lang, UserProfile, Variant, Weekday } from '../../domain/types';
import {
  onboardingNextStep,
  resolveOnboardingResult,
  validateSessionDays,
  type OnboardingAttempt,
} from '../../domain/program';
import { buildOnboardingRecords } from '../../domain/onboarding';
import { program } from '../../content/program';
import type { StorageAdapter } from '../../storage/adapter';
import { localToday, nowISO } from '../clock';
import type { ISODate, ISODateTime } from '../../domain/types';
import { useT } from '../LangContext';

type Step = 'welcome' | 'disclaimer' | 'standard' | 'test' | 'rest' | 'result' | 'days';

/** Dot index per step — rest/result share their neighbours' dots (5 visible stages). */
const DOT: Record<Step, number> = {
  welcome: 0,
  disclaimer: 1,
  standard: 2,
  test: 3,
  rest: 3,
  result: 4,
  days: 4,
};
const DOTS = 5;

/** Monday-first display order for the weekday chips (Weekday: 0 = Sunday). */
const WEEK_MON_FIRST: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0];

interface Props {
  adapter: StorageAdapter;
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  onDone: (profile: UserProfile) => void;
}

export default function OnboardingScreen({ adapter, lang, onLangChange, onDone }: Props) {
  const t = useT();
  const [step, setStep] = useState<Step>('welcome');
  const [attempts, setAttempts] = useState<readonly OnboardingAttempt[]>([]);
  const [repsInput, setRepsInput] = useState('');
  const [days, setDays] = useState<readonly Weekday[]>([]);
  const [ifThen, setIfThen] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const disclaimerAcceptedAt = useRef<string | null>(null);
  // Clock is frozen on the FIRST save attempt: a retry after local midnight must not
  // produce a second test entry on a different date (the first putEntry may have landed).
  const finishClock = useRef<{ today: ISODate; now: ISODateTime } | null>(null);

  // Screen-reader announcement: headings receive focus on step change (.onb h1:focus).
  // Skipped on mount — a fresh app open must not steal focus from the document.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) headingRef.current?.focus();
    mounted.current = true;
  }, [step]);

  // Both arms of OnboardingStep carry `variant`: for 'attempt' it is the variant to
  // try next (test/rest screens), for 'done' it is the resolved starting variant.
  const currentVariant: Variant = onboardingNextStep(attempts, program).variant;
  const variantName = (v: Variant) => t(`variant.${v}`);

  const reps = /^\d{1,3}$/.test(repsInput.trim()) ? Number(repsInput.trim()) : null;

  function submitAttempt() {
    if (reps === null) return;
    const done = [...attempts, { variant: currentVariant, result: reps }];
    setAttempts(done);
    setRepsInput('');
    setStep(onboardingNextStep(done, program).kind === 'attempt' ? 'rest' : 'result');
  }

  function toggleDay(d: Weekday) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  async function finish() {
    const last = attempts[attempts.length - 1];
    if (last === undefined || saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      // Invariant, not a fallback: the health gate timestamp must never be fabricated.
      if (disclaimerAcceptedAt.current === null) {
        throw new Error('onboarding: disclaimer not accepted');
      }
      finishClock.current ??= { today: localToday(), now: nowISO() };
      const { profile, entry } = buildOnboardingRecords({
        language: lang,
        today: finishClock.current.today,
        now: finishClock.current.now,
        disclaimerAcceptedAt: disclaimerAcceptedAt.current,
        sessionDays: days,
        ifThen,
        lastAttempt: last,
      });
      // Entry first: the profile's presence is the "onboarded" flag, so a failure
      // in between cannot leave a profile without its founding test entry.
      await adapter.putEntry(entry);
      await adapter.saveProfile(profile);
      onDone(profile);
    } catch (err) {
      console.error('Showup onboarding save failed', err);
      setSaveError(true);
      setSaving(false);
    }
  }

  const dots = (
    <div
      className="onb-dots"
      role="img"
      aria-label={t('onb.progress', { current: DOT[step] + 1, total: DOTS })}
    >
      {Array.from({ length: DOTS }, (_, i) => (
        <span key={i} className={i === DOT[step] ? 'active' : ''} />
      ))}
    </div>
  );

  if (step === 'welcome') {
    return (
      <div className="screen onb">
        <p className="screen-art" aria-hidden="true">
          💪
        </p>
        <h1 ref={headingRef} tabIndex={-1} className="center">
          {t('app.name')}
        </h1>
        <p className="muted center">{t('app.tagline')}</p>
        <div className="lang-switch">
          <button
            type="button"
            lang="pl"
            aria-pressed={lang === 'pl'}
            className={`lang-btn ${lang === 'pl' ? 'lang-btn--selected' : ''}`}
            onClick={() => onLangChange('pl')}
          >
            {t('onb.lang.pl')}
          </button>
          <button
            type="button"
            lang="en"
            aria-pressed={lang === 'en'}
            className={`lang-btn ${lang === 'en' ? 'lang-btn--selected' : ''}`}
            onClick={() => onLangChange('en')}
          >
            {t('onb.lang.en')}
          </button>
        </div>
        <button type="button" className="btn-primary" onClick={() => setStep('disclaimer')}>
          {t('onb.welcome.cta')}
        </button>
        {dots}
      </div>
    );
  }

  if (step === 'disclaimer') {
    return (
      <div className="screen onb">
        <h1 ref={headingRef} tabIndex={-1}>
          {t('onb.disclaimer.title')}
        </h1>
        <p className="muted">{t('onb.disclaimer.body')}</p>
        <div className="card card--alt">{t('onb.disclaimer.redFlags')}</div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            disclaimerAcceptedAt.current = nowISO();
            setStep('standard');
          }}
        >
          {t('onb.disclaimer.cta')}
        </button>
        <button type="button" className="btn-link" onClick={() => setStep('welcome')}>
          {t('onb.back')}
        </button>
        {dots}
      </div>
    );
  }

  if (step === 'standard') {
    return (
      <div className="screen onb">
        <h1 ref={headingRef} tabIndex={-1}>
          {t('onb.standard.title')}
        </h1>
        <ul className="muted">
          <li>{t('onb.standard.item1')}</li>
          <li>{t('onb.standard.item2')}</li>
          <li>{t('onb.standard.item3')}</li>
          <li>{t('onb.standard.item4')}</li>
        </ul>
        <div className="card card--alt">{t('onb.standard.note')}</div>
        <button type="button" className="btn-primary" onClick={() => setStep('test')}>
          {t('onb.standard.cta')}
        </button>
        <button type="button" className="btn-link" onClick={() => setStep('disclaimer')}>
          {t('onb.back')}
        </button>
        {dots}
      </div>
    );
  }

  if (step === 'test') {
    return (
      <div className="screen onb">
        <h1 ref={headingRef} tabIndex={-1}>
          {t('onb.test.title')}
        </h1>
        <p className="badge">{t('onb.test.variantLabel', { variant: variantName(currentVariant) })}</p>
        <p className="muted">{t('onb.test.intro')}</p>
        <label>
          <span className="muted">{t('onb.test.inputLabel')}</span>
          <input
            className="text-input"
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={3}
            value={repsInput}
            onChange={(e) => setRepsInput(e.target.value)}
          />
        </label>
        <button type="button" className="btn-primary" disabled={reps === null} onClick={submitAttempt}>
          {t('onb.test.cta')}
        </button>
        {attempts.length === 0 && (
          <button type="button" className="btn-link" onClick={() => setStep('standard')}>
            {t('onb.back')}
          </button>
        )}
        {dots}
      </div>
    );
  }

  if (step === 'rest') {
    return (
      <div className="screen onb">
        <p className="screen-art" aria-hidden="true">
          🌤
        </p>
        <h1 ref={headingRef} tabIndex={-1} className="center">
          {t('onb.rest.title')}
        </h1>
        <p className="muted center">{t('onb.rest.body', { variant: variantName(currentVariant) })}</p>
        <button type="button" className="btn-primary" onClick={() => setStep('test')}>
          {t('onb.rest.cta')}
        </button>
        {dots}
      </div>
    );
  }

  if (step === 'result') {
    const last = attempts[attempts.length - 1];
    // Defensive: the flow cannot reach 'result' without an attempt.
    const resolved = last !== undefined ? resolveOnboardingResult(last.variant, last.result, program) : null;
    return (
      <div className="screen onb">
        <p className="screen-art" aria-hidden="true">
          🎯
        </p>
        <h1 ref={headingRef} tabIndex={-1} className="center">
          {t('onb.result.title')}
        </h1>
        {resolved && (
          <p className="center">
            {t('onb.result.body', { variant: variantName(resolved.variant), mt: resolved.lastMT })}
          </p>
        )}
        {resolved?.lastMTisSeed && <div className="card card--alt">{t('onb.result.seedNote')}</div>}
        <button type="button" className="btn-primary" onClick={() => setStep('days')}>
          {t('onb.result.cta')}
        </button>
        {dots}
      </div>
    );
  }

  // step === 'days'
  const daysValid = validateSessionDays(days);
  return (
    <div className="screen onb">
      <h1 ref={headingRef} tabIndex={-1}>
        {t('onb.days.title')}
      </h1>
      <p className="muted">{t('onb.days.hint')}</p>
      <div className="chip-row" role="group" aria-label={t('onb.days.title')}>
        {WEEK_MON_FIRST.map((d) => (
          <button
            key={d}
            type="button"
            className={`chip ${days.includes(d) ? 'chip--selected' : ''}`}
            aria-pressed={days.includes(d)}
            onClick={() => toggleDay(d)}
          >
            {t(`weekday.${d}`)}
          </button>
        ))}
      </div>
      <p className="muted" role="status" aria-live="polite">
        {daysValid
          ? null
          : days.length < 3
            ? t('onb.days.count', { n: days.length })
            : t('onb.days.invalid')}
      </p>
      <label>
        <span className="muted">{t('onb.ifthen.label')}</span>
        <textarea
          className="text-input"
          rows={2}
          placeholder={t('onb.ifthen.placeholder')}
          value={ifThen}
          onChange={(e) => setIfThen(e.target.value)}
        />
      </label>
      <button type="button" className="btn-primary" disabled={!daysValid || saving} onClick={() => void finish()}>
        {t('onb.finish.cta')}
      </button>
      {saveError && (
        <p className="muted" role="alert">
          {t('onb.saveError')}
        </p>
      )}
      {dots}
    </div>
  );
}
