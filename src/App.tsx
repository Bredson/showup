// App shell (Feature 5): tab routing + owning today's entry/progress state.
// The adapter is injected from main.tsx, so tests can pass the memory adapter.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Challenge, DailyEntry, ExportBlob, Lang, QuizDraft, UserProfile } from './domain/types';
import { computeProgress, computeStreak } from './domain/streak';
import { getTodaysChallenge } from './domain/challenge';
import { shouldHideIfThenEducation } from './domain/dailyLoop';
import { buildProfile, updateProfileFromQuiz, type QuizAnswers } from './domain/quiz';
import { comebackKind, missedDaysBefore, type ComebackKind } from './domain/comeback';
import { challenges } from './content';
import type { StorageAdapter } from './storage/adapter';
import { currentHour, localToday, nowISO } from './ui/clock';
import { LangContext, useT } from './ui/LangContext';
import BottomNav, { type Tab } from './ui/components/BottomNav';
import TodayScreen from './ui/screens/TodayScreen';
import OnboardingScreen from './ui/screens/OnboardingScreen';
import ProgressScreen from './ui/screens/ProgressScreen';
import JournalScreen from './ui/screens/JournalScreen';
import SettingsScreen from './ui/screens/SettingsScreen';
import DailyLoop from './ui/loop/DailyLoop';
import ComebackScreen from './ui/screens/ComebackScreen';

interface ShellProps {
  adapter: StorageAdapter;
  /** Null only if the profile read failed at boot — Settings then degrades to the load error. */
  profile: UserProfile | null;
  /** Single write path for profile updates (language change, quiz retake): persists + applies. */
  onProfileChange: (updated: UserProfile) => void;
  /** Clears IndexedDB and returns the app to onboarding (ux-spec §6, dylemat 7). */
  onDeleteAll: () => Promise<void>;
  /** Replaces all data with an imported backup; on success App remounts this Shell. */
  onImportAll: (blob: ExportBlob) => Promise<void>;
}

function Shell({ adapter, profile, onProfileChange, onDeleteAll, onImportAll }: ShellProps) {
  const [tab, setTab] = useState<Tab>('today');
  const [loopOpen, setLoopOpen] = useState(false);
  const [requizOpen, setRequizOpen] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [pastEntries, setPastEntries] = useState<DailyEntry[]>([]); // everything except today
  // Comeback interstitial (ux-spec §7): derived once at boot, never persisted — "once per
  // return" holds because only the first open of a day creates the entry.
  const [comeback, setComeback] = useState<Exclude<ComebackKind, 'none'> | null>(null);
  const [bootError, setBootError] = useState(false);
  const t = useT();

  const today = localToday();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        // Entries are read BEFORE the assignment on purpose: under StrictMode's double effect
        // the surviving run would otherwise see the entry the cancelled run just created and
        // silently skip the interstitial (dev-only, but it made manual QA of §7 flaky).
        const all = await adapter.getAllEntries();
        const firstOpenOfDay = !all.some((e) => e.date === today);
        const result = await getTodaysChallenge(adapter, challenges, today, nowISO());
        if (cancelled) return;
        setChallenge(result.challenge);
        setEntry(result.entry);
        setPastEntries(all.filter((e) => e.date !== today));
        if (firstOpenOfDay) {
          // The streak feeds in so 'oneDay' ("Twoja passa jest bezpieczna") can never lie (dylemat 9).
          const kind = comebackKind(missedDaysBefore(all, today), computeStreak(all, today));
          if (kind !== 'none') setComeback(kind);
        }
      } catch (err) {
        console.error('Showup boot failed', err);
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
    adapter.putEntry(updated).catch((err: unknown) => console.error('Showup: entry save failed', err));
  }

  if (bootError) {
    return (
      <div className="screen">
        <p className="muted">{t('app.loadError')}</p>
      </div>
    );
  }

  if (!entry) return null; // one-frame boot; IndexedDB open already happened in main.tsx

  // Comeback interstitial (ux-spec §7): BEFORE the Today screen, single CTA forward.
  if (comeback) {
    return <ComebackScreen kind={comeback} onContinue={() => setComeback(null)} />;
  }

  // Quiz retake (ux-spec §6, dylemat 6) — full-screen like DailyLoop, so the tab state survives.
  if (requizOpen && profile) {
    return (
      <OnboardingScreen
        initialDraft={null}
        onLanguageChange={() => undefined} // welcome screen never renders in retake mode
        onSaveDraft={() => undefined} // retake has no draft; interruption = cancel
        onCancel={() => setRequizOpen(false)}
        onComplete={(answers: QuizAnswers) => {
          onProfileChange(updateProfileFromQuiz(profile, answers, nowISO()));
          setRequizOpen(false);
        }}
      />
    );
  }

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
      {tab === 'settings' &&
        (profile ? (
          <SettingsScreen
            profile={profile}
            entries={allEntries}
            onChangeLanguage={(l) => {
              if (profile.language !== l) onProfileChange({ ...profile, language: l });
            }}
            onRetakeQuiz={() => setRequizOpen(true)}
            onDeleteAll={onDeleteAll}
            onImportAll={onImportAll}
          />
        ) : (
          <div className="screen">
            <p className="muted">{t('app.loadError')}</p>
          </div>
        ))}
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
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stored = await adapter.getProfile();
        if (cancelled) return;
        if (stored) {
          setProfile(stored);
          setLang(stored.language);
          setBoot({ phase: 'ready' });
          return;
        }
        // No profile → onboarding, even if the draft read fails (a lost draft only restarts the quiz).
        const draft = await adapter.getQuizDraft().catch((err: unknown) => {
          console.error('Showup: quiz draft read failed', err);
          return null;
        });
        if (cancelled) return;
        if (draft) setLang(draft.language); // an interrupted quiz keeps its language choice
        setBoot({ phase: 'onboarding', draft });
      } catch (err) {
        console.error('Showup boot failed', err);
        // Fall through to the shell — its own boot path shows the load-error screen.
        if (!cancelled) setBoot({ phase: 'ready' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adapter]);

  function completeOnboarding(answers: QuizAnswers) {
    const created = buildProfile(answers, lang, localToday(), nowISO());
    // Enter the app immediately; persistence is fire-and-forget like every tap-time save.
    setProfile(created);
    setLang(created.language);
    setBoot({ phase: 'ready' });
    adapter.saveProfile(created).then(
      () =>
        adapter.clearQuizDraft().catch((err: unknown) => console.error('Showup: quiz draft clear failed', err)),
      (err: unknown) => console.error('Showup: profile save failed', err),
    );
  }

  // True only while clearAll() is in flight — a save landing after the wipe would resurrect
  // "deleted" data, breaking the privacy promise ("Nie da się tego cofnąć").
  const wipingRef = useRef(false);

  /** Single write path for later profile edits (Settings: language, quiz retake). */
  function handleProfileChange(updated: UserProfile) {
    if (wipingRef.current) return; // never write during a wipe
    setProfile(updated);
    setLang(updated.language);
    adapter.saveProfile(updated).catch((err: unknown) => console.error('Showup: profile save failed', err));
  }

  // Bumped after a successful import: the new key remounts Shell, whose boot effect
  // re-reads IndexedDB — today's entry, progress and the comeback check all reflect the
  // imported data without any manual state surgery (import = replace, data-model §5).
  const [importGeneration, setImportGeneration] = useState(0);

  /** "Importuj dane" (F8.1): atomic replace of everything, then a fresh Shell boot. */
  async function handleImportAll(blob: ExportBlob) {
    wipingRef.current = true; // same race guard as delete: no save may land mid-replace
    try {
      await adapter.replaceAll(blob.profile, blob.entries);
      setProfile(blob.profile);
      setLang(blob.profile.language);
      setImportGeneration((g) => g + 1);
    } finally {
      wipingRef.current = false;
    }
  }

  /** "Usuń wszystkie dane" (dylemat 7): awaited — only a confirmed wipe returns to onboarding. */
  async function handleDeleteAll() {
    wipingRef.current = true;
    try {
      await adapter.clearAll();
      setProfile(null);
      setLang(detectLang());
      setBoot({ phase: 'onboarding', draft: null }); // fresh install experience
    } finally {
      wipingRef.current = false;
    }
  }

  if (boot.phase === 'loading') return null; // one-frame boot; IndexedDB open already happened in main.tsx

  return (
    <LangContext.Provider value={lang}>
      {boot.phase === 'onboarding' ? (
        <OnboardingScreen
          initialDraft={boot.draft}
          onLanguageChange={setLang}
          onSaveDraft={(d) => {
            adapter.saveQuizDraft(d).catch((err: unknown) => console.error('Showup: quiz draft save failed', err));
          }}
          onComplete={completeOnboarding}
        />
      ) : (
        <Shell
          key={importGeneration}
          adapter={adapter}
          profile={profile}
          onProfileChange={handleProfileChange}
          onDeleteAll={handleDeleteAll}
          onImportAll={handleImportAll}
        />
      )}
    </LangContext.Provider>
  );
}
