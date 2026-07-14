// Settings screen (ux-spec §6): language, path retake, data export/delete, privacy, about.
// No .btn-primary here — nothing on this screen is "the one action" (ux-spec button rule).
import { useRef, useState, type ChangeEvent } from 'react';
import type { DailyEntry, ExportBlob, Lang, UserProfile } from '../../domain/types';
import { buildExportBlob, exportFilename } from '../../domain/export';
import { validateExportBlob } from '../../domain/import';
import { CURRENT_SCHEMA_VERSION } from '../../storage/adapter';
import { localToday, nowISO } from '../clock';
import { formatDayLong } from '../dates';
import { downloadJSON } from '../download';
import { readJSONFile } from '../upload';
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
  /**
   * Replaces ALL data with the (already validated) blob. On success the app shell
   * remounts and re-reads storage, so this screen never sees a "success" state.
   */
  onImportAll: (blob: ExportBlob) => Promise<void>;
}

export default function SettingsScreen({
  profile,
  entries,
  onChangeLanguage,
  onRetakeQuiz,
  onDeleteAll,
  onImportAll,
}: Props) {
  const t = useT();
  const lang = useLang();
  // Two-step delete (dylemat 7): idle → confirm (inline) → deleting; error shown calmly, no red.
  const [deleteState, setDeleteState] = useState<'idle' | 'confirm' | 'deleting' | 'error'>('idle');
  // Import mirrors the delete flow (both are destructive replaces): pick file → inline
  // confirm → importing. Rejections ('invalid'/'newer') are calm statuses, never alerts.
  const [importState, setImportState] = useState<'idle' | 'confirm' | 'importing' | 'invalid' | 'newer' | 'error'>(
    'idle',
  );
  const [pendingBlob, setPendingBlob] = useState<ExportBlob | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [howOpen, setHowOpen] = useState(false);
  // While a wipe/replace is in flight all Settings controls are disabled and App's wipingRef
  // guards profile writes. (Known gap, shared with the delete flow: an entry save from the
  // daily loop is not guarded — the window is the few ms of one IndexedDB transaction.)
  const busy = deleteState === 'deleting' || importState === 'importing';

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

  function pickImportFile() {
    setDeleteState('idle'); // never show two destructive confirms at once
    // Back to idle so a repeated failure re-renders the status node — two identical
    // rejections in a row must both be announced (role="status" needs a DOM change).
    setImportState('idle');
    fileRef.current?.click();
  }

  async function handleFilePicked(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-picking the same file after a failed attempt
    if (!file) return;
    let parsed: unknown;
    try {
      parsed = await readJSONFile(file);
    } catch (err) {
      console.error('Unstuck: import file unreadable', err);
      setImportState('invalid');
      return;
    }
    const result = validateExportBlob(parsed, CURRENT_SCHEMA_VERSION);
    if (!result.ok) {
      // errors are a debugging aid (console only) — the UI copy stays calm and generic
      console.error('Unstuck: import rejected', result.errors);
      setImportState(result.reason);
      return;
    }
    setPendingBlob(result.blob);
    setImportState('confirm');
  }

  function confirmImport() {
    if (!pendingBlob) return;
    setImportState('importing');
    onImportAll(pendingBlob).catch((err: unknown) => {
      // replaceAll is atomic (one transaction), so a failure honestly means "nothing changed".
      console.error('Unstuck: import failed', err);
      setPendingBlob(null);
      setImportState('error');
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
        <input
          ref={fileRef}
          type="file"
          name="import-file"
          accept="application/json,.json"
          hidden
          onChange={handleFilePicked}
        />
        {importState === 'confirm' || importState === 'importing' ? (
          <div className="settings-confirm">
            <p>
              {t('settings.data.importConfirm.body', {
                // localToday(new Date(...)) converts the UTC timestamp to the LOCAL calendar
                // day — the same day boundary as the export filename (validation guarantees
                // exportedAt parses, so this can never render "Invalid Date").
                date: pendingBlob ? formatDayLong(localToday(new Date(pendingBlob.exportedAt)), lang, localToday()) : '',
                count: pendingBlob ? pendingBlob.entries.length : 0,
              })}
            </p>
            <button className="btn-secondary" disabled={busy} onClick={confirmImport}>
              {t('settings.data.importConfirm.yes')}
            </button>
            <button
              className="btn-link"
              disabled={busy}
              onClick={() => {
                setPendingBlob(null); // don't keep a full backup's data in state after "keep current"
                setImportState('idle');
              }}
            >
              {t('settings.data.importConfirm.no')}
            </button>
          </div>
        ) : (
          <button className="btn-secondary" disabled={busy} onClick={pickImportFile}>
            {t('settings.data.import')}
          </button>
        )}
        {(importState === 'invalid' || importState === 'newer' || importState === 'error') && (
          <p className="muted" role="status">
            {t(
              importState === 'invalid'
                ? 'settings.data.importInvalid'
                : importState === 'newer'
                  ? 'settings.data.importNewer'
                  : 'settings.data.importError',
            )}
          </p>
        )}
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
          <button
            className="btn-secondary"
            disabled={busy}
            onClick={() => {
              setImportState('idle'); // never show two destructive confirms at once
              setDeleteState('confirm');
            }}
          >
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
