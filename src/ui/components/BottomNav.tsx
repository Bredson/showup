// Bottom tab bar (ux-spec: nav map — 4 tabs, pill on the active one; hidden during the loop).
import { useT } from '../LangContext';

export type Tab = 'today' | 'progress' | 'journal' | 'settings';

const TABS: { tab: Tab; icon: string; labelKey: 'nav.today' | 'nav.progress' | 'nav.journal' | 'nav.settings' }[] = [
  { tab: 'today', icon: '☀', labelKey: 'nav.today' },
  { tab: 'progress', icon: '◔', labelKey: 'nav.progress' },
  { tab: 'journal', icon: '✎', labelKey: 'nav.journal' },
  { tab: 'settings', icon: '⚙', labelKey: 'nav.settings' },
];

export default function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  const t = useT();
  return (
    <nav className="bottom-nav">
      {TABS.map(({ tab, icon, labelKey }) => (
        <button key={tab} aria-current={tab === active ? 'true' : undefined} onClick={() => onChange(tab)}>
          <span className="nav-icon" aria-hidden>
            {icon}
          </span>
          {t(labelKey)}
        </button>
      ))}
    </nav>
  );
}
