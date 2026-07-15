// Temporary app shell for the storage-rewrite phase: the legacy Unstuck UI is gone,
// the pushup program UI is not built yet. This keeps the live PWA honest ("under
// construction") while still booting storage — so persistence and language survive.
// The adapter is injected from main.tsx, so tests can pass the memory adapter.
import { useEffect, useState } from 'react';
import type { Lang } from './domain/types';
import type { StorageAdapter } from './storage/adapter';
import { LangContext, useT } from './ui/LangContext';

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

export default function App({ adapter }: { adapter: StorageAdapter }) {
  const [lang, setLang] = useState<Lang>(detectLang);
  const [bootError, setBootError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const profile = await adapter.getProfile();
        if (!cancelled && profile) setLang(profile.language);
      } catch (err) {
        console.error('Showup boot failed', err);
        if (!cancelled) setBootError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adapter]);

  return (
    <LangContext.Provider value={lang}>
      <UnderConstruction error={bootError} />
    </LangContext.Provider>
  );
}
