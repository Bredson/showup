// Shell — bottom navigation between the MVP tabs (user decisions: 2026-07-15 start
// with "Dziś" + "Progres"; Settings joined as the third tab in the Settings phase;
// the bar still grows with future phases — Journal is next, no placeholder tabs).
// Tab state is ephemeral: a reload always lands on Today.
import { useState } from 'react';
import type { UserProfile } from '../domain/types';
import type { StorageAdapter } from '../storage/adapter';
import { useT } from './LangContext';
import TodayScreen from './screens/TodayScreen';
import ProgressScreen from './screens/ProgressScreen';
import SettingsScreen from './screens/SettingsScreen';

type Tab = 'today' | 'progress' | 'settings';

const TABS: ReadonlyArray<{ id: Tab; icon: string; labelKey: `nav.${Tab}` }> = [
  { id: 'today', icon: '💪', labelKey: 'nav.today' },
  { id: 'progress', icon: '📈', labelKey: 'nav.progress' },
  { id: 'settings', icon: '⚙️', labelKey: 'nav.settings' },
];

export default function Shell({
  adapter,
  profile,
  onProfileChange,
  onDeleteAll,
  onImported,
}: {
  adapter: StorageAdapter;
  profile: UserProfile;
  /** The ONE path for profile edits (language, future requiz) — see App. */
  onProfileChange: (profile: UserProfile) => Promise<void>;
  /** Awaited wipe; resolves after data is truly gone (App then shows onboarding). */
  onDeleteAll: () => Promise<void>;
  /** Called after replaceAll committed; App remounts the shell via key. */
  onImported: (profile: UserProfile) => void;
}) {
  const t = useT();
  const [tab, setTab] = useState<Tab>('today');

  return (
    <>
      {tab === 'today' ? (
        <TodayScreen adapter={adapter} profile={profile} />
      ) : tab === 'progress' ? (
        <ProgressScreen adapter={adapter} profile={profile} />
      ) : (
        <SettingsScreen
          adapter={adapter}
          profile={profile}
          onProfileChange={onProfileChange}
          onDeleteAll={onDeleteAll}
          onImported={onImported}
        />
      )}
      <nav className="bottom-nav" aria-label={t('nav.label')}>
        {TABS.map(({ id, icon, labelKey }) => (
          <button
            key={id}
            type="button"
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => setTab(id)}
          >
            <span className="nav-icon" aria-hidden="true">
              {icon}
            </span>
            {t(labelKey)}
          </button>
        ))}
      </nav>
    </>
  );
}
