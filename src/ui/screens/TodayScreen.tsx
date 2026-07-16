// Today — the whole daily loop (PRD §4): session (feel → sets → reflection →
// reinforcement), easy day (2-minute minimum), Max Test (warmup → test → gate),
// pain degradation and the comeback interstitial after missed days.
//
// Step order lives in domain (stepsFor/nextStep/resumeStep in loop.ts) — this screen
// only renders the current step and persists at the moment of each event. The plan is
// never persisted (data-model §7 #13): it is recomputed from entries on every render.
import { useEffect, useRef, useState } from 'react';
import type {
  DailyEntry,
  EasyContent,
  Feel,
  ISODate,
  UserProfile,
} from '../../domain/types';
import {
  computeGateLog,
  computeProgram,
  dayKindFor,
  easyContentRange,
  longSetOffered,
  longSetRange,
  sessionPlan,
  type GateOutcome,
} from '../../domain/program';
import { balanceNudgeDue } from '../../domain/nudge';
import { computeStreak } from '../../domain/streak';
import {
  comebackKind,
  missedDaysBefore,
  nextStep,
  openDayEntry,
  resumeStep,
  type ComebackKind,
  type LoopStep,
} from '../../domain/loop';
import { program } from '../../content/program';
import type { StorageAdapter } from '../../storage/adapter';
import { localToday, nowISO, nowMs } from '../clock';
import { useT } from '../LangContext';

interface Props {
  adapter: StorageAdapter;
  profile: UserProfile;
}

type Boot =
  | { phase: 'loading' }
  | { phase: 'error' }
  | { phase: 'ready'; entries: readonly DailyEntry[]; entry: DailyEntry };

const FEELS: readonly Feel[] = ['fresh', 'ok', 'tired', 'pain'];

export default function TodayScreen({ adapter, profile }: Props) {
  const t = useT();
  // The day is frozen at first render: crossing midnight mid-flow must not swap the
  // entry under the user's feet — a reload starts the new day cleanly.
  const todayRef = useRef<ISODate>(localToday());
  const today = todayRef.current;

  const [boot, setBoot] = useState<Boot>({ phase: 'loading' });
  const [step, setStep] = useState<LoopStep>('feel');
  const [comeback, setComeback] = useState<Exclude<ComebackKind, 'none'> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        // Read BEFORE the conditional write (code-style F10): under StrictMode both
        // effect passes read the pre-mutation world (IDB runs same-scope transactions
        // in creation order), so the "entry was just created" one-shot signal survives
        // and the double write is harmless — openDayEntry is deterministic.
        const before = await adapter.getAllEntries();
        const existing = before.find((e) => e.date === today);
        let entry = existing;
        if (entry === undefined) {
          const kind = dayKindFor(before, profile, program, today);
          const state = computeProgram(before, profile, program, today);
          entry = openDayEntry(today, kind, state.variant, nowISO());
          await adapter.putEntry(entry);
          const missed = missedDaysBefore(before, today);
          const kindBack = comebackKind(missed, computeStreak(before, today));
          if (!cancelled && kindBack !== 'none') setComeback(kindBack);
        }
        if (cancelled) return;
        const entries = existing === undefined ? [...before, entry] : before;
        const resumed = resumeStep(entry, plannedSetCountFor(entry, entries, profile, today));
        setBoot({ phase: 'ready', entries, entry });
        prevStep.current = resumed; // resuming is not a step CHANGE — opening must not steal focus
        setStep(resumed);
      } catch (err) {
        console.error('Showup: opening the day failed', err);
        if (!cancelled) setBoot({ phase: 'error' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adapter, profile, today]);

  // Screen-reader announcement on step change; prev-value ref, not a mounted flag
  // (StrictMode runs effects twice — code-style F8).
  const headingRef = useRef<HTMLHeadingElement>(null);
  const prevStep = useRef<LoopStep>(step);
  const prevComeback = useRef(comeback);
  useEffect(() => {
    // Dismissing the comeback unmounts its button — move focus to the step heading
    // so screen readers regain context.
    const dismissed = prevComeback.current !== null && comeback === null;
    if (prevStep.current !== step || dismissed) headingRef.current?.focus();
    prevStep.current = step;
    prevComeback.current = comeback;
  }, [step, comeback]);

  if (boot.phase === 'loading') return null;
  if (boot.phase === 'error') {
    return (
      <div className="screen today">
        <h1>{t('app.name')}</h1>
        <p className="muted">{t('app.loadError')}</p>
      </div>
    );
  }

  const { entries, entry } = boot;
  const downgraded = entry.downgradedTo === 'easy';

  async function persist(next: DailyEntry, to: LoopStep) {
    if (saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      await adapter.putEntry(next);
      setBoot((b) =>
        b.phase === 'ready'
          ? { phase: 'ready', entry: next, entries: b.entries.map((e) => (e.date === next.date ? next : e)) }
          : b,
      );
      setStep(to);
    } catch (err) {
      console.error('Showup: saving the day failed', err);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  function chooseFeel(feel: Feel) {
    const degradedNow = feel === 'pain';
    void persist(
      { ...entry, feelBefore: feel, downgradedTo: degradedNow ? 'easy' : entry.downgradedTo, updatedAt: nowISO() },
      nextStep(entry.kind, degradedNow, 'feel'),
    );
  }

  function complete(fields: Partial<DailyEntry>, to: LoopStep) {
    const now = nowISO();
    void persist({ ...entry, ...fields, status: 'completed', completedAt: now, updatedAt: now }, to);
  }

  const saveErrorNote = saveError && (
    <p className="muted" role="alert">
      {t('today.saveError')}
    </p>
  );

  if (comeback !== null) {
    return (
      <div className="screen today comeback">
        <p className="screen-art" aria-hidden="true">
          🌱
        </p>
        <h1 ref={headingRef} tabIndex={-1}>
          {t(comeback === 'oneDay' ? 'comeback.oneDay.title' : 'comeback.multiDay.title')}
        </h1>
        <p className="muted">
          {t(comeback === 'oneDay' ? 'comeback.oneDay.body' : 'comeback.multiDay.body')}
        </p>
        <button type="button" className="btn-primary" onClick={() => setComeback(null)}>
          {t('comeback.cta')}
        </button>
      </div>
    );
  }

  const header = (
    <header>
      <h1 ref={headingRef} tabIndex={-1}>
        {t(`today.title.${entry.kind}`)}
      </h1>
      <p className="badge">{t('today.variantLabel', { variant: t(`variant.${entry.variant}`) })}</p>
    </header>
  );

  // --- feel check (sessions and tests) ------------------------------------
  if (step === 'feel') {
    return (
      <div className="screen today">
        {header}
        <h2>{t('today.feel.title')}</h2>
        <p className="muted">{t('today.feel.hint')}</p>
        <div className="chip-row" role="group" aria-label={t('today.feel.title')}>
          {FEELS.map((f) => (
            <button key={f} type="button" className="chip" disabled={saving} onClick={() => chooseFeel(f)}>
              {t(`today.feel.${f}`)}
            </button>
          ))}
        </div>
        {saveErrorNote}
      </div>
    );
  }

  // --- easy day / pain-degraded day ----------------------------------------
  if (step === 'easy') {
    return (
      <EasyStep
        entry={entry}
        entries={entries}
        profile={profile}
        today={today}
        header={header}
        saving={saving}
        saveErrorNote={saveErrorNote}
        onComplete={(content, longSetReps) =>
          complete({ easyContent: content, longSetReps }, nextStep(entry.kind, downgraded, 'easy'))
        }
      />
    );
  }

  // --- test: warmup + safety copy -------------------------------------------
  if (step === 'warmup') {
    return (
      <div className="screen today">
        {header}
        <h2>{t('today.test.warmup.title')}</h2>
        <p className="muted">{t('today.test.warmup.body')}</p>
        <div className="card card--alt">{t('onb.disclaimer.redFlags')}</div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setStep(nextStep(entry.kind, downgraded, 'warmup'))}
        >
          {t('today.test.warmup.cta')}
        </button>
      </div>
    );
  }

  // --- test: the max attempt -------------------------------------------------
  if (step === 'test') {
    return (
      <TestStep
        header={header}
        saving={saving}
        saveErrorNote={saveErrorNote}
        onSubmit={(result) =>
          void persist({ ...entry, testResult: result, updatedAt: nowISO() }, nextStep(entry.kind, downgraded, 'test'))
        }
      />
    );
  }

  // --- session: planned sets ---------------------------------------------------
  if (step === 'sets') {
    return (
      <SetsStep
        entry={entry}
        entries={entries}
        profile={profile}
        today={today}
        header={header}
        saving={saving}
        saveErrorNote={saveErrorNote}
        onSet={(reps, done) =>
          void persist(
            { ...entry, sets: [...(entry.sets ?? []), reps], updatedAt: nowISO() },
            done ? nextStep(entry.kind, downgraded, 'sets') : 'sets',
          )
        }
      />
    );
  }

  // --- reflection (sessions and tests) ---------------------------------------
  if (step === 'reflection') {
    return (
      <ReflectionStep
        header={header}
        saving={saving}
        saveErrorNote={saveErrorNote}
        onFinish={(text) => complete({ reflection: text }, nextStep(entry.kind, downgraded, 'reflection'))}
      />
    );
  }

  // --- done: reinforcement / gate outcome --------------------------------------
  return (
    <DoneStep entry={entry} entries={entries} today={today} headingRef={headingRef} />
  );
}

/** Session plan length for resume — only computable once feel is answered (plan input). */
function plannedSetCountFor(
  entry: DailyEntry,
  entries: readonly DailyEntry[],
  profile: UserProfile,
  today: ISODate,
): number | null {
  if (entry.kind !== 'session' || entry.downgradedTo === 'easy' || entry.feelBefore === null) return null;
  const state = computeProgram(entries, profile, program, today);
  const plan = sessionPlan(state, program, entry.feelBefore);
  return plan.kind === 'plan' ? plan.sets.length : null;
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

interface StepChrome {
  header: React.ReactNode;
  saving: boolean;
  saveErrorNote: React.ReactNode;
}

function EasyStep({
  entry,
  entries,
  profile,
  today,
  header,
  saving,
  saveErrorNote,
  onComplete,
}: StepChrome & {
  entry: DailyEntry;
  entries: readonly DailyEntry[];
  profile: UserProfile;
  today: ISODate;
  onComplete: (content: EasyContent, longSetReps: number | null) => void;
}) {
  const t = useT();
  const [choice, setChoice] = useState<EasyContent | null>(null);
  const [repsInput, setRepsInput] = useState('');
  const state = computeProgram(entries, profile, program, today);
  const [min, max] = easyContentRange(state, program);
  const degraded = entry.downgradedTo === 'easy';
  // long-set is a third option only past the MT threshold, ~1x/week, never on a
  // pain-degraded day (all gating lives in longSetOffered, domain/program.ts).
  const options: readonly EasyContent[] = longSetOffered(entries, state, program, today)
    ? ['gtg-set', 'warmup', 'long-set']
    : ['gtg-set', 'warmup'];
  const [longMin, longMax] = longSetRange(state, program);
  const labels: Record<EasyContent, string> = {
    'gtg-set': t('today.easy.gtg', { min, max }),
    warmup: t('today.easy.warmup'),
    'long-set': t('today.easy.longSet', { min: longMin, max: longMax }),
  };
  // Result field is optional: empty -> null (skipped), 1–999 -> number, junk -> undefined (blocks CTA).
  const trimmed = repsInput.trim();
  const longSetReps: number | null | undefined =
    choice !== 'long-set' || trimmed === ''
      ? null
      : /^\d{1,3}$/.test(trimmed) && Number(trimmed) >= 1
        ? Number(trimmed)
        : undefined;

  return (
    <div className="screen today">
      {header}
      {degraded && (
        <div className="card card--alt">
          <h2>{t('today.pain.title')}</h2>
          <p className="muted">{t('today.pain.body')}</p>
          <p className="muted">{t('onb.disclaimer.redFlags')}</p>
        </div>
      )}
      <h2>{t('today.easy.title')}</h2>
      <p className="muted">{t('today.easy.hint')}</p>
      <div className="chip-row" role="group" aria-label={t('today.easy.title')}>
        {options.map((c) => (
          <button
            key={c}
            type="button"
            className={`chip ${choice === c ? 'chip--selected' : ''}`}
            aria-pressed={choice === c}
            onClick={() => setChoice(c)}
          >
            {labels[c]}
          </button>
        ))}
      </div>
      {choice === 'long-set' && (
        <>
          <p className="muted">{t('today.easy.longSetHint')}</p>
          <label>
            <span className="muted">{t('today.easy.longSetReps')}</span>
            <input
              className="text-input"
              name="long-set-reps"
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={3}
              value={repsInput}
              onChange={(e) => setRepsInput(e.target.value)}
            />
          </label>
        </>
      )}
      <button
        type="button"
        className="btn-primary"
        disabled={choice === null || saving || longSetReps === undefined}
        onClick={() => choice !== null && longSetReps !== undefined && onComplete(choice, longSetReps)}
      >
        {t('today.easy.cta')}
      </button>
      {saveErrorNote}
    </div>
  );
}

function TestStep({
  header,
  saving,
  saveErrorNote,
  onSubmit,
}: StepChrome & { onSubmit: (result: number) => void }) {
  const t = useT();
  const [input, setInput] = useState('');
  const result = /^\d{1,3}$/.test(input.trim()) ? Number(input.trim()) : null;

  return (
    <div className="screen today">
      {header}
      <h2>{t('today.test.title')}</h2>
      <p className="muted">{t('onb.test.intro')}</p>
      <label>
        <span className="muted">{t('onb.test.inputLabel')}</span>
        <input
          className="text-input"
          name="test-result"
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </label>
      <button
        type="button"
        className="btn-primary"
        disabled={result === null || saving}
        onClick={() => result !== null && onSubmit(result)}
      >
        {t('onb.test.cta')}
      </button>
      {saveErrorNote}
    </div>
  );
}

function SetsStep({
  entry,
  entries,
  profile,
  today,
  header,
  saving,
  saveErrorNote,
  onSet,
}: StepChrome & {
  entry: DailyEntry;
  entries: readonly DailyEntry[];
  profile: UserProfile;
  today: ISODate;
  onSet: (reps: number, done: boolean) => void;
}) {
  const t = useT();
  const [input, setInput] = useState('');
  const doneSets = entry.sets ?? [];
  const idx = doneSets.length;

  // Rest countdown (PRD §5, decision 2026-07-16): auto-starts only when idx grows,
  // i.e. on a successful persist of a non-final set — never on mount, so a reload
  // mid-rest resumes without a stale timer (endAt is ephemeral by design).
  const [endAt, setEndAt] = useState<number | null>(null);
  const [, setTick] = useState(0); // re-render driver while counting down
  const prevIdxRef = useRef(idx);
  useEffect(() => {
    if (idx > prevIdxRef.current) {
      setEndAt(nowMs() + program.restSeconds * 1000);
      // Clearing the controlled input is owned here, and only on a grown idx:
      // after a save failure the typed reps must survive for retry (idx unchanged).
      // Fixes a stale-value bug where a second tap on the still-enabled button
      // logged a phantom set. (Reps typed during the ms-scale in-flight persist
      // are cleared too — the save semantics win.)
      setInput('');
    }
    prevIdxRef.current = idx;
  }, [idx]);
  // Deadline math, not tick decrements — background tabs throttle intervals
  // (code-style: "Odliczanie = deadline, nie ticki").
  const secondsLeft = endAt === null ? null : Math.max(0, Math.ceil((endAt - nowMs()) / 1000));
  const restOver = secondsLeft !== null && secondsLeft <= 0;
  useEffect(() => {
    if (endAt === null || restOver) return;
    const id = setInterval(() => setTick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [endAt, restOver]);

  // Invariant, not a fallback: the step machine only reaches 'sets' with feel answered.
  if (entry.feelBefore === null) throw new Error('sets step without a feel check');
  const state = computeProgram(entries, profile, program, today);
  const plan = sessionPlan(state, program, entry.feelBefore);
  if (plan.kind !== 'plan') throw new Error('sets step on a downgraded day');

  const current = plan.sets[idx];
  if (current === undefined) throw new Error('sets step past the plan length');
  const reps = /^\d{1,3}$/.test(input.trim()) ? Number(input.trim()) : null;

  return (
    <div className="screen today">
      {header}
      <h2>{t('today.sets.progress', { current: idx + 1, total: plan.sets.length })}</h2>
      {entry.feelBefore === 'tired' && <p className="muted">{t('today.sets.tiredNote')}</p>}
      <div className="card">
        <p>{current.type === 'reps' ? t('today.sets.target', { reps: current.reps }) : t('today.sets.amrapTarget')}</p>
        <p className="muted">{current.type === 'amrap' ? t('today.sets.amrapHint') : t('today.sets.restHint')}</p>
        {/* Help, not a gate: the input below stays live — saving the next set IS the skip.
            Ticking digits are silent for screen readers (role="timer" defaults to
            aria-live="off"); only the finish is announced via the status region below,
            which stays mounted for the whole rest — a live region inserted together
            with its content is often not announced (code-style: aria-live regions
            are always rendered, content is toggled). */}
        {secondsLeft !== null && (
          <>
            {!restOver && (
              <p className="timer" role="timer" aria-label={t('today.sets.timerLabel')}>
                {formatRest(secondsLeft)}
              </p>
            )}
            <p className="muted" role="status">
              {restOver ? t('today.sets.timerDone') : ''}
            </p>
          </>
        )}
      </div>
      <label>
        <span className="muted">{t('today.sets.inputLabel')}</span>
        <input
          className="text-input"
          name="set-reps"
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </label>
      <button
        type="button"
        className="btn-primary"
        disabled={reps === null || saving}
        onClick={() => {
          if (reps === null) return;
          // No setInput('') here: on save failure the typed reps must survive for
          // retry; on success the idx-grew effect above clears it.
          onSet(reps, idx + 1 >= plan.sets.length);
        }}
      >
        {t('today.sets.confirm')}
      </button>
      {saveErrorNote}
    </div>
  );
}

/** m:ss for the rest countdown — rest is always minutes-scale, hours never happen. */
function formatRest(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function ReflectionStep({
  header,
  saving,
  saveErrorNote,
  onFinish,
}: StepChrome & { onFinish: (text: string | null) => void }) {
  const t = useT();
  const [text, setText] = useState('');
  const trimmed = text.trim();

  return (
    <div className="screen today">
      {header}
      <h2>{t('today.reflection.title')}</h2>
      <textarea
        className="text-input"
        name="reflection"
        rows={3}
        placeholder={t('today.reflection.placeholder')}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        type="button"
        className="btn-primary"
        disabled={trimmed === '' || saving}
        onClick={() => onFinish(trimmed)}
      >
        {t('today.reflection.save')}
      </button>
      <button type="button" className="btn-link" disabled={saving} onClick={() => onFinish(null)}>
        {t('today.reflection.skip')}
      </button>
      {saveErrorNote}
    </div>
  );
}

function DoneStep({
  entry,
  entries,
  today,
  headingRef,
}: {
  entry: DailyEntry;
  entries: readonly DailyEntry[];
  today: ISODate;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const t = useT();
  const streak = computeStreak(entries, today);
  const isRealTest = entry.kind === 'test' && entry.downgradedTo === null && entry.testResult !== null;

  // The gate reports its own verdict (computeGateLog replays every test through it) —
  // today's test is simply its row in the log. The founding Max Test needs no special
  // case anymore: the log opens with it as 'calibrated' (or 'goal' at 100+ on full).
  const outcome: GateOutcome | null = isRealTest
    ? (computeGateLog(entries, program).find((i) => i.date === today)?.outcome ?? null)
    : null;

  // Never undercut the 100-pushup celebration with a "too many easy days" nudge —
  // a UI concern, so the guard lives here, not in balanceNudgeDue (which knows
  // nothing about gate verdicts by design).
  const showNudge = outcome?.type !== 'goal' && balanceNudgeDue(entries, today);

  const { title, body } = doneCopy(entry, outcome, t);

  return (
    <div className="screen today">
      <p className="screen-art" aria-hidden="true">
        {outcome?.type === 'goal' ? '🎉' : '💪'}
      </p>
      <h1 ref={headingRef} tabIndex={-1} className="center">
        {title}
      </h1>
      {isRealTest && entry.testResult !== null && (
        <p className="badge center">{t('today.test.result', { result: entry.testResult })}</p>
      )}
      <p className="muted center">{body}</p>
      <p className="badge center">{t('today.streak', { n: streak })}</p>
      {showNudge && (
        <div className="card card--alt">
          <h2>{t('today.nudge.title')}</h2>
          <p className="muted">{t('today.nudge.body')}</p>
        </div>
      )}
    </div>
  );
}

function doneCopy(
  entry: DailyEntry,
  outcome: GateOutcome | null,
  t: ReturnType<typeof useT>,
): { title: string; body: string } {
  if (outcome !== null) {
    switch (outcome.type) {
      case 'goal':
        return { title: t('gate.goal.title'), body: t('gate.goal.body') };
      case 'variant-advance':
        return {
          title: t('gate.advance.title', { variant: t(`variant.${outcome.variant}`) }),
          body: t('gate.advance.body'),
        };
      case 'calibrated':
        return { title: t('gate.calibrated.title'), body: t('gate.calibrated.body') };
      case 'step-down':
        return { title: t('gate.stepDown.title'), body: t('gate.stepDown.body') };
      case 'regen':
        return { title: t('gate.regen.title'), body: t('gate.regen.body') };
      case 'consolidation':
        return { title: t('gate.consolidation.title'), body: t('gate.consolidation.body') };
      case 'new-block':
        return { title: t('gate.newBlock.title'), body: t('gate.newBlock.body') };
    }
  }
  if (entry.downgradedTo === 'easy') {
    return { title: t('today.done.degraded.title'), body: t('today.done.degraded.body') };
  }
  if (entry.kind === 'easy') {
    return { title: t('today.done.easy.title'), body: t('today.done.easy.body') };
  }
  return { title: t('today.done.session.title'), body: t('today.done.session.body') };
}
