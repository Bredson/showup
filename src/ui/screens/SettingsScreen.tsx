// Settings screen (ux-spec §6): language, path retake, data export/delete, privacy, about.
// No .btn-primary here — nothing on this screen is "the one action" (ux-spec button rule).
import { useState } from 'react';
import type { DailyEntry, Lang, UserProfile } from '../../domain/types';
import { buildExportBlob, exportFilename } from '../../domain/export';
import { CURRENT_SCHEMA_VERSION } from '../../storage/adapter';
import { localToday, nowISO } from '../clock';
import { downloadJSON } from '../download';
import { useLang, useT } from '../LangContext';

const LANGS: readonly Lang[] = ['pl', 'en'];

interface Props {
  profile: UserProfile;
  /** All entries (past + today) — the export must contain everything. */
  entries: DailyEntry[];
  /** Applies immediately to the whole app and persists profile.language (ux-spec §6). */
  onChangeLanguage: (lang: Lang) => void;
  /** Opens the quiz in retake mode (dylemat 6). */
  onRetakeQuiz: () => void;
  /** Resolves after IndexedDB is actually cleared — the app then returns to onboarding (dylemat 7). */
  onDeleteAll: () => Promise<void>;
}

export default function SettingsScreen({ profile, entries, onChangeLanguage, onRetakeQuiz, onDeleteAll }: Props) {
  const t = useT();
  const lang = useLang();
  // Two-step delete (dylemat 7): idle → confirm (inline) → deleting; error shown calmly, no red.
  const [deleteState, setDeleteState] = useState<'idle' | 'confirm' | 'deleting' | 'error'>('idle');
  const [howOpen, setHowOpen] = useState(false);
  // While the wipe is in flight every other write path is disabled — a save racing clearAll()
  // could resurrect "deleted" data (App.handleProfileChange has a matching guard).
  const busy = deleteState === 'deleting';

  function exportData() {
    const blob = buildExportBlob(profile, entries, CURRENT_SCHEMA_VERSION, nowISO());
    downloadJSON(exportFilename(localToday()), blob);
  }

  function confirmDelete() {
    setDeleteState('deleting');
    onDeleteAll().catch((err: unknown) => {
      // Unlike tap-time saves this MUST be confirmed — pretending data is gone would be a lie.
      console.error('Unstuck: delete all failed', err);
      setDeleteState('error');
    });
  }

  return (
    <div className="screen">
      <h1>{t('settings.title')}</h1>

      <section className="card settings-section">
        <h2>{t('settings.lang.heading')}</h2>
        <div className="lang-switch" role="group" aria-label={t('settings.lang.heading')}>
          {LANGS.map((l) => (
            <button
              key={l}
              className={`lang-btn${lang === l ? ' lang-btn--selected' : ''}`}
              aria-pressed={lang === l}
              disabled={busy}
              onClick={() => onChangeLanguage(l)}
            >
              {t(`lang.${l}`)}
            </button>
          ))}
        </div>
      </section>

      <section className="card settings-section">
        <h2>{t('settings.path.heading')}</h2>
        <p className="muted">{t('settings.path.body')}</p>
        <button className="btn-secondary" disabled={busy} onClick={onRetakeQuiz}>
          {t('settings.path.cta')}
        </button>
      </section>

      <section className="card settings-section">
        <h2>{t('settings.data.heading')}</h2>
        <button className="btn-secondary" disabled={busy} onClick={exportData}>
          {t('settings.data.export')}
        </button>
        {deleteState === 'confirm' || deleteState === 'deleting' ? (
          <div className="settings-confirm">
            <p>{t('settings.data.deleteConfirm.body')}</p>
            <button className="btn-secondary" disabled={busy} onClick={confirmDelete}>
              {t('settings.data.deleteConfirm.yes')}
            </button>
            <button className="btn-link" disabled={busy} onClick={() => setDeleteState('idle')}>
              {t('settings.data.deleteConfirm.no')}
            </button>
          </div>
        ) : (
          <button className="btn-secondary" onClick={() => setDeleteState('confirm')}>
            {t('settings.data.delete')}
          </button>
        )}
        {deleteState === 'error' && (
          <p className="muted" role="status">
            {t('settings.data.deleteError')}
          </p>
        )}
        <p className="muted settings-privacy">{t('settings.privacy')}</p>
      </section>

      <section className="card settings-section">
        <h2>{t('settings.about.heading')}</h2>
        <p className="muted">{t('settings.about.version', { version: __APP_VERSION__ })}</p>
        {/* Dylemat 8: expandable section in place, no sub-screen. */}
        <button
          className="btn-link settings-how"
          aria-expanded={howOpen}
          aria-controls="settings-how-body"
          onClick={() => setHowOpen((o) => !o)}
        >
          {t('settings.about.how')} <span aria-hidden>{howOpen ? '▴' : '▾'}</span>
        </button>
        {howOpen && (
          <p className="muted" id="settings-how-body">
            {t('settings.about.howBody')}
          </p>
        )}
      </section>
    </div>
  );
}
