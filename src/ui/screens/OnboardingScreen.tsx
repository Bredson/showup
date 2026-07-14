// Onboarding quiz (ux-spec §1): welcome (language) → 5 questions → closing summary.
// Every selection persists the draft synchronously (tap-time save rule), so an interrupted
// quiz resumes exactly where it stopped. The profile itself is built only on the final CTA.
// Retake mode (ux-spec §6, dylemat 6): `onCancel` present → start at question 1 (no welcome),
// no draft persistence (interruption = cancel), "Back" on question 1 cancels to Settings.
import { useEffect, useRef, useState } from 'react';
import type { Lang, QuizDraft } from '../../domain/types';
import {
  QUIZ_QUESTIONS,
  firstUnansweredIndex,
  isQuizComplete,
  toggleMultiOption,
  type QuizAnswers,
  type QuizQuestionId,
} from '../../domain/quiz';
import { nowISO } from '../clock';
import { useLang, useT } from '../LangContext';

/** Step 0 = welcome, 1..N = questions, N+1 = closing screen. */
const DONE_STEP = QUIZ_QUESTIONS.length + 1;

const LANGS: readonly Lang[] = ['pl', 'en'];

// Valid option-label keys derived from QUIZ_QUESTIONS' literal types. Because t() only accepts
// TranslationKey, a quiz option without a dictionary entry fails the BUILD, not the runtime.
type QuizQuestionDef = (typeof QUIZ_QUESTIONS)[number];
type OptionLabelKey =
  | 'onboarding.opt.unsure'
  | {
      [Q in QuizQuestionDef as Q['id']]: `onboarding.q.${Q['id']}.opt.${Exclude<Q['options'][number], 'unsure'>}`;
    }[QuizQuestionId];

function optionLabelKey(questionId: QuizQuestionId, option: string): OptionLabelKey {
  if (option === 'unsure') return 'onboarding.opt.unsure';
  // Safe: (questionId, option) pairs always come from QUIZ_QUESTIONS itself.
  return `onboarding.q.${questionId}.opt.${option}` as OptionLabelKey;
}

function selectedOptions(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

interface Props {
  /** Interrupted quiz to resume, or null on a truly first launch. */
  initialDraft: QuizDraft | null;
  /** Applies immediately to the whole app (welcome-screen switch, ux-spec §1.0). */
  onLanguageChange: (lang: Lang) => void;
  /** Fire-and-forget persistence — called synchronously on every selection. */
  onSaveDraft: (draft: QuizDraft) => void;
  /** Quiz finished: complete answers — the caller builds/updates the profile and persists it. */
  onComplete: (answers: QuizAnswers) => void;
  /** Present = retake mode (dylemat 6). Called by "Back" on question 1; nothing was saved. */
  onCancel?: () => void;
}

export default function OnboardingScreen({ initialDraft, onLanguageChange, onSaveDraft, onComplete, onCancel }: Props) {
  const t = useT();
  const lang = useLang();
  const retake = onCancel !== undefined;
  const [answers, setAnswers] = useState<QuizAnswers>(() => initialDraft?.answers ?? {});
  // Resume at the first unanswered question; a draft with complete answers reopens the closing screen.
  // Retake starts fresh at question 1 — old answers stay in the profile until the final CTA.
  const [step, setStep] = useState(() => {
    if (retake) return 1;
    return initialDraft ? Math.min(firstUnansweredIndex(initialDraft.answers) + 1, DONE_STEP) : 0;
  });

  // React reuses the same DOM between steps, so focus would silently stay on the "Next" button
  // and screen readers would never announce the new question. Move focus to the heading instead.
  // Compare against the previous step (not "first run") — StrictMode re-runs effects on mount.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const prevStepRef = useRef(step);
  useEffect(() => {
    if (prevStepRef.current !== step) headingRef.current?.focus();
    prevStepRef.current = step;
  }, [step]);

  function persistDraft(next: QuizAnswers) {
    if (retake) return; // retake has no draft: an interrupted retake is simply a cancel (dylemat 6)
    onSaveDraft({
      id: 'quizDraft',
      language: lang,
      // QuizAnswers is Partial<>; the stored shape is the same minus the undefined holes.
      answers: next as QuizDraft['answers'],
      updatedAt: nowISO(),
    });
  }

  // --- 1.0 Welcome ---------------------------------------------------------
  if (step === 0) {
    return (
      <div className="screen onb">
        <div className="screen-art" aria-hidden>
          🌱
        </div>
        <h1 ref={headingRef} tabIndex={-1}>
          {t('onboarding.welcome.title')}
        </h1>
        <p className="muted">{t('onboarding.welcome.body')}</p>
        <div className="lang-switch" role="group" aria-label={t('onboarding.lang.aria')}>
          {LANGS.map((l) => (
            <button
              key={l}
              className={`lang-btn${lang === l ? ' lang-btn--selected' : ''}`}
              aria-pressed={lang === l}
              onClick={() => onLanguageChange(l)}
            >
              {t(`lang.${l}`)}
            </button>
          ))}
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            persistDraft(answers); // draft exists from now on → language survives an interruption
            setStep(1);
          }}
        >
          {t('onboarding.welcome.cta')}
        </button>
      </div>
    );
  }

  // --- 1.1–1.5 Questions ----------------------------------------------------
  const question = QUIZ_QUESTIONS[step - 1];
  if (step < DONE_STEP && question) {
    const options: readonly string[] = question.options;
    const chosen = selectedOptions(answers[question.id]);
    const answered = chosen.length > 0;

    function select(option: string) {
      if (!question) return;
      const nextValue =
        question.kind === 'multi' ? toggleMultiOption(chosen, option, question.maxSelections ?? 1) : option;
      if (nextValue === chosen) return; // tap ignored by the domain (cap reached) → no state, no save
      // Cast: toggleMultiOption returns readonly string[]; stored answers stay mutable-typed.
      const next: QuizAnswers = { ...answers, [question.id]: nextValue as string | string[] };
      setAnswers(next);
      persistDraft(next); // "zapis po każdym pytaniu" (ux-spec §1)
    }

    return (
      <div className="screen onb">
        <div
          className="onb-dots"
          role="img"
          aria-label={t('onboarding.progress', { n: step, total: QUIZ_QUESTIONS.length })}
        >
          {QUIZ_QUESTIONS.map((q, i) => (
            <span key={q.id} className={i === step - 1 ? 'active' : ''} />
          ))}
        </div>
        <h1 ref={headingRef} tabIndex={-1}>
          {t(`onboarding.q.${question.id}.title`)}
        </h1>
        {question.kind === 'multi' && <p className="muted">{t('onboarding.multiHint')}</p>}
        <div className="quiz-options">
          {options.map((option) => (
            <button
              key={option}
              className={`quiz-card${chosen.includes(option) ? ' quiz-card--selected' : ''}`}
              aria-pressed={chosen.includes(option)}
              onClick={() => select(option)}
            >
              {t(optionLabelKey(question.id, option))}
            </button>
          ))}
        </div>
        <button className="btn-primary" disabled={!answered} onClick={() => setStep(step + 1)}>
          {t('onboarding.next')}
        </button>
        {/* Retake: "Back" on question 1 cancels to Settings instead of showing the welcome screen. */}
        <button className="btn-link" onClick={() => (retake && step === 1 ? onCancel?.() : setStep(step - 1))}>
          {t('onboarding.back')}
        </button>
      </div>
    );
  }

  // --- 1.6 Closing summary ---------------------------------------------------
  const complete = isQuizComplete(answers);
  return (
    <div className="screen onb">
      <div className="screen-art" aria-hidden>
        🌿
      </div>
      <h1 ref={headingRef} tabIndex={-1}>
        {t('onboarding.done.title')}
      </h1>
      {/* The summary mirrors the answers back, so the quiz visibly mattered (ux-spec §1.6). */}
      <section className="onb-summary">
        <h2>{t('onboarding.summary.heading')}</h2>
        {QUIZ_QUESTIONS.map((q) => {
          const labels = selectedOptions(answers[q.id])
            .map((option) => t(optionLabelKey(q.id, option)))
            .join(', ');
          return <p key={q.id}>{t(`onboarding.summary.${q.id}`, { value: labels })}</p>;
        })}
      </section>
      <button className="btn-primary" disabled={!complete} onClick={() => complete && onComplete(answers)}>
        {t(retake ? 'settings.path.doneCta' : 'onboarding.done.cta')}
      </button>
    </div>
  );
}
