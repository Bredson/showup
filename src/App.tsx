// App shell (Feature 5): tab routing + owning today's entry/progress state.
// The adapter is injected from main.tsx, so tests can pass the memory adapter.
import { useEffect, useMemo, useState } from 'react';
import type { Challenge, DailyEntry } from './domain/types';
import { computeProgress } from './domain/streak';
import { getTodaysChallenge } from './domain/challenge';
import { shouldHideIfThenEducation } from './domain/dailyLoop';
import { challenges } from './content';
import type { StorageAdapter } from './storage/adapter';
import { currentHour, localToday, nowISO } from './ui/clock';
import { LangContext, useT } from './ui/LangContext';
import BottomNav, { type Tab } from './ui/components/BottomNav';
import TodayScreen from './ui/screens/TodayScreen';
import DailyLoop from './ui/loop/DailyLoop';

function StubScreen({ textKey }: { textKey: 'stub.progress' | 'stub.journal' | 'stub.settings' }) {
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
      {tab === 'progress' && <StubScreen textKey="stub.progress" />}
      {tab === 'journal' && <StubScreen textKey="stub.journal" />}
      {tab === 'settings' && <StubScreen textKey="stub.settings" />}
      <BottomNav active={tab} onChange={setTab} />
    </>
  );
}

export default function App({ adapter }: { adapter: StorageAdapter }) {
  // Language is fixed to PL until the Settings feature lands (profile.language).
  return (
    <LangContext.Provider value="pl">
      <Shell adapter={adapter} />
    </LangContext.Provider>
  );
}
