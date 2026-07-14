// App shell (Feature 5): tab routing + owning today's entry/progress state.
// The adapter is injected from main.tsx, so tests can pass the memory adapter.
import { useEffect, useMemo, useState } from 'react';
import type { Challenge, DailyEntry, Lang, QuizDraft, UserProfile } from './domain/types';
import { computeProgress } from './domain/streak';
import { getTodaysChallenge } from './domain/challenge';
import { shouldHideIfThenEducation } from './domain/dailyLoop';
import { challenges } from './content';
import type { StorageAdapter } from './storage/adapter';
import { currentHour, localToday, nowISO } from './ui/clock';
import { LangContext, useT } from './ui/LangContext';
import BottomNav, { type Tab } from './ui/components/BottomNav';
import TodayScreen from './ui/screens/TodayScreen';
import OnboardingScreen from './ui/screens/OnboardingScreen';
import ProgressScreen from './ui/screens/ProgressScreen';
import JournalScreen from './ui/screens/JournalScreen';
import DailyLoop from './ui/loop/DailyLoop';

function StubScreen({ textKey }: { textKey: 'stub.settings' }) {
  const t = useT();
  return (
    <div className="screen">
      <p className="muted">{t(textKey)}</p>
    </div>
  );
}

function Shell({ adapter }: { adapter: StorageAdapter }) {
  const [tab, setTab] = useState<Tab>('today');
  const [loopOpen, setLoopOpen] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [pastEntries, setPastEntries] = useState<DailyEntry[]>([]); // everything except today
  const [bootError, setBootError] = useState(false);
  const t = useT();

  const today = localToday();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await getTodaysChallenge(adapter, challenges, today, nowISO());
        const all = await adapter.getAllEntries();
        if (cancelled) return;
        setChallenge(result.challenge);
        setEntry(result.entry);
        setPastEntries(all.filter((e) => e.date !== today));
      } catch (err) {
        console.error('Unstuck boot failed', err);
        if (!cancelled) setBootError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adapter, today]);

  // ProgressState is always derived, never stored (data-model: single source of truth).
  const allEntries = useMemo(() => (entry ? [...pastEntries, entry] : pastEntries), [pastEntries, entry]);
  const progress = useMemo(() => computeProgress(allEntries, today), [allEntries, today]);

  // Persist every loop transition immediately — "×"/crash never loses progress (ux-spec §3).
  function handleEntryChange(updated: DailyEntry) {
    setEntry(updated);
    adapter.putEntry(updated).catch((err: unknown) => console.error('Unstuck: entry save failed', err));
  }

  if (bootError) {
    return (
      <div className="screen">
        <p className="muted">{t('app.loadError')}</p>
      </div>
    );
  }

  if (!entry) return null; // one-frame boot; IndexedDB open already happened in main.tsx

  if (loopOpen && challenge) {
    return (
      <DailyLoop
        key={entry.date} // midnight rollover: a new entry remounts the loop with a fresh resumeStep
        challenge={challenge}
        entry={entry}
        progress={progress}
        hideIfThenEducation={shouldHideIfThenEducation(pastEntries)}
        now={nowISO}
        onEntryChange={handleEntryChange}
        onExit={() => setLoopOpen(false)}
        onSeeProgress={() => {
          setLoopOpen(false);
          setTab('progress');
        }}
      />
    );
  }

  return (
    <>
      {tab === 'today' && (
        <TodayScreen
          challenge={challenge}
          entry={entry}
          progress={progress}
          hour={currentHour()}
          onStartLoop={() => setLoopOpen(true)}
          onSeeJournal={() => setTab('journal')}
        />
      )}
      {tab === 'progress' && (
        <ProgressScreen entries={allEntries} progress={progress} today={today} onBackToToday={() => setTab('today')} />
      )}
      {tab === 'journal' && <JournalScreen entries={allEntries} today={today} />}
      {tab === 'settings' && <StubScreen textKey="stub.settings" />}
      <BottomNav active={tab} onChange={setTab} />
    </>
  );
}

type BootPhase =
  | { phase: 'loading' }
  | { phase: 'onboarding'; draft: QuizDraft | null } // no profile yet → quiz (ux-spec §1)
  | { phase: 'ready' };

/** Sensible welcome-screen default; the user can switch on the spot (ux-spec §1.0). */
function detectLang(): Lang {
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('pl') ? 'pl' : 'en';
}

export default function App({ adapter }: { adapter: StorageAdapter }) {
  const [boot, setBoot] = useState<BootPhase>({ phase: 'loading' });
  const [lang, setLang] = useState<Lang>(detectLang);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const profile = await adapter.getProfile();
        if (cancelled) return;
        if (profile) {
          setLang(profile.language);
          setBoot({ phase: 'ready' });
          return;
        }
        // No profile → onboarding, even if the draft read fails (a lost draft only restarts the quiz).
        const draft = await adapter.getQuizDraft().catch((err: unknown) => {
          console.error('Unstuck: quiz draft read failed', err);
          return null;
        });
        if (cancelled) return;
        if (draft) setLang(draft.language); // an interrupted quiz keeps its language choice
        setBoot({ phase: 'onboarding', draft });
      } catch (err) {
        console.error('Unstuck boot failed', err);
        // Fall through to the shell — its own boot path shows the load-error screen.
        if (!cancelled) setBoot({ phase: 'ready' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adapter]);

  function completeOnboarding(profile: UserProfile) {
    // Enter the app immediately; persistence is fire-and-forget like every tap-time save.
    setLang(profile.language);
    setBoot({ phase: 'ready' });
    adapter.saveProfile(profile).then(
      () =>
        adapter.clearQuizDraft().catch((err: unknown) => console.error('Unstuck: quiz draft clear failed', err)),
      (err: unknown) => console.error('Unstuck: profile save failed', err),
    );
  }

  if (boot.phase === 'loading') return null; // one-frame boot; IndexedDB open already happened in main.tsx

  return (
    <LangContext.Provider value={lang}>
      {boot.phase === 'onboarding' ? (
        <OnboardingScreen
          initialDraft={boot.draft}
          onLanguageChange={setLang}
          onSaveDraft={(d) => {
            adapter.saveQuizDraft(d).catch((err: unknown) => console.error('Unstuck: quiz draft save failed', err));
          }}
          onComplete={completeOnboarding}
        />
      ) : (
        <Shell adapter={adapter} />
      )}
    </LangContext.Provider>
  );
}
