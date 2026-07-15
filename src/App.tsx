// App shell: no profile → onboarding; with profile → the program UI (for now still
// the "under construction" placeholder — the daily loop arrives in the next phase).
// The adapter is injected from main.tsx, so tests can pass the memory adapter.
import { useEffect, useState } from 'react';
import type { Lang, UserProfile } from './domain/types';
import type { StorageAdapter } from './storage/adapter';
import { LangContext, useT } from './ui/LangContext';
import OnboardingScreen from './ui/screens/OnboardingScreen';

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
      {boot.state === 'ready' && boot.profile === null ? (
        <OnboardingScreen
          adapter={adapter}
          lang={lang}
          onLangChange={setLang}
          onDone={(profile) => setBoot({ state: 'ready', profile })}
        />
      ) : boot.state === 'loading' ? null : (
        <UnderConstruction error={boot.state === 'error'} />
      )}
    </LangContext.Provider>
  );
}
