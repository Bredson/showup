// Shell — bottom navigation between the two MVP tabs (user decision 2026-07-15:
// start with "Dziś" + "Progres" only; the bar grows with future phases, no
// placeholder tabs). Tab state is ephemeral: a reload always lands on Today.
import { useState } from 'react';
import type { UserProfile } from '../domain/types';
import type { StorageAdapter } from '../storage/adapter';
import { useT } from './LangContext';
import TodayScreen from './screens/TodayScreen';
import ProgressScreen from './screens/ProgressScreen';

type Tab = 'today' | 'progress';

const TABS: ReadonlyArray<{ id: Tab; icon: string; labelKey: 'nav.today' | 'nav.progress' }> = [
  { id: 'today', icon: '💪', labelKey: 'nav.today' },
  { id: 'progress', icon: '📈', labelKey: 'nav.progress' },
];

export default function Shell({ adapter, profile }: { adapter: StorageAdapter; profile: UserProfile }) {
  const t = useT();
  const [tab, setTab] = useState<Tab>('today');

  return (
    <>
      {tab === 'today' ? (
        <TodayScreen adapter={adapter} profile={profile} />
      ) : (
        <ProgressScreen adapter={adapter} profile={profile} />
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
