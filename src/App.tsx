// App shell: no profile → onboarding; with profile → the tab shell (Today + Progress + Settings).
// The "under construction" placeholder remains only as the boot-error screen.
// The adapter is injected from main.tsx, so tests can pass the memory adapter.
import { useEffect, useRef, useState } from 'react';
import type { Lang, UserProfile } from './domain/types';
import type { StorageAdapter } from './storage/adapter';
import { LangContext, useT } from './ui/LangContext';
import OnboardingScreen from './ui/screens/OnboardingScreen';
import Shell from './ui/Shell';

/** Sensible default before a profile exists; a stored profile wins after boot. */
function detectLang(): Lang {
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('pl') ? 'pl' : 'en';
}

function UnderConstruction({ error }: { error: boolean }) {
  const t = useT();
  return (
    <div className="screen">
      <h1>{t('app.name')}</h1>
      <p className="muted">{t('app.tagline')}</p>
      <p className="muted">{error ? t('app.loadError') : t('app.underConstruction')}</p>
    </div>
  );
}

type Boot =
  | { state: 'loading' }
  | { state: 'error' }
  | { state: 'ready'; profile: UserProfile | null };

export default function App({ adapter }: { adapter: StorageAdapter }) {
  const [lang, setLang] = useState<Lang>(detectLang);
  const [boot, setBoot] = useState<Boot>({ state: 'loading' });
  // Bumped after a data import: remounting Shell makes every boot effect re-read the
  // replaced IndexedDB world instead of hand-surgery on React state (code-style F8.1).
  const [importGeneration, setImportGeneration] = useState(0);
  // Guard against the save↔wipe race (code-style F9): a profile save that commits
  // after clearAll would resurrect deleted data — ignore saves while wiping.
  const wipingRef = useRef(false);

  /**
   * The ONE path for every profile edit after onboarding (language change, future
   * requiz): update state, switch UI language, persist. Screens never call
   * adapter.saveProfile directly. The UI update is optimistic, but the promise
   * rejects on a failed save so the caller can tell the user honestly (critical
   * saves never fail silently — code-style onboarding rule).
   */
  const handleProfileChange = async (profile: UserProfile): Promise<void> => {
    if (wipingRef.current) return;
    setBoot({ state: 'ready', profile });
    setLang(profile.language);
    try {
      await adapter.saveProfile(profile);
    } catch (err) {
      console.error('Showup profile save failed', err);
      throw err;
    }
  };

  /**
   * "Delete all data": NOT fire-and-forget (code-style F9) — the caller awaits and
   * shows its own error state; onboarding comes back only after the wipe truly
   * committed. The guard flag wraps the whole operation (finally resets it).
   */
  const deleteAllData = async () => {
    wipingRef.current = true;
    try {
      await adapter.clearAll();
      setBoot({ state: 'ready', profile: null });
    } finally {
      wipingRef.current = false;
    }
  };

  /** Import replaced profile+entries wholesale; adopt the new profile and remount the shell. */
  const handleImported = (profile: UserProfile) => {
    setBoot({ state: 'ready', profile });
    setLang(profile.language);
    setImportGeneration((g) => g + 1);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const profile = await adapter.getProfile();
        if (cancelled) return;
        if (profile) setLang(profile.language);
        setBoot({ state: 'ready', profile });
      } catch (err) {
        console.error('Showup boot failed', err);
        if (!cancelled) setBoot({ state: 'error' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adapter]);

  return (
    <LangContext.Provider value={lang}>
      {boot.state === 'loading' ? null : boot.state === 'error' ? (
        <UnderConstruction error />
      ) : boot.profile === null ? (
        <OnboardingScreen
          adapter={adapter}
          lang={lang}
          onLangChange={setLang}
          onDone={(profile) => setBoot({ state: 'ready', profile })}
        />
      ) : (
        <Shell
          key={importGeneration}
          adapter={adapter}
          profile={boot.profile}
          onProfileChange={handleProfileChange}
          onDeleteAll={deleteAllData}
          onImported={handleImported}
        />
      )}
    </LangContext.Provider>
  );
}
