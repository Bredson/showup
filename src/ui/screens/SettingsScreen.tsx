// Settings screen (PRD §5.6, layout after ux-spec §6): language, "how Showup works",
// export / import / delete-all, privacy note, app version.
//
// Data-op state machine: one union drives the whole "Twoje dane" section — at most one
// confirm is ever open (opening one closes the other, code-style F8.1) and any in-flight
// operation disables EVERY other control (code-style F9: a save committing mid-wipe
// would resurrect deleted data; App holds the second guard layer).
import { useEffect, useRef, useState } from 'react';
import type { ExportBlob, Lang, UserProfile } from '../../domain/types';
import { buildExportBlob, exportFilename } from '../../domain/export';
import { validateExportBlob } from '../../domain/import';
import type { StorageAdapter } from '../../storage/adapter';
import { CURRENT_SCHEMA_VERSION } from '../../storage/adapter';
import { localToday, nowISO } from '../clock';
import { formatDayLong } from '../dates';
import { downloadJSON } from '../download';
import { readJSONFile } from '../upload';
import { useLang, useT } from '../LangContext';

/** Calm, self-clearing outcome messages (all failures share one status region). */
type MessageKey =
  | 'settings.language.error'
  | 'settings.export.error'
  | 'settings.import.invalid'
  | 'settings.import.newer'
  | 'settings.import.error'
  | 'settings.delete.error';

type DataOp =
  | { phase: 'idle' }
  | { phase: 'exporting' }
  | { phase: 'confirmImport'; blob: ExportBlob }
  | { phase: 'importing'; blob: ExportBlob }
  | { phase: 'confirmDelete' }
  | { phase: 'deleting' }
  | { phase: 'message'; key: MessageKey };

// Same options and copy as the onboarding welcome step (labels live in i18n so each
// stays in its own language; the `lang` attribute makes screen readers pronounce them).
const LANG_OPTIONS: ReadonlyArray<{ value: Lang; labelKey: 'onb.lang.pl' | 'onb.lang.en' }> = [
  { value: 'pl', labelKey: 'onb.lang.pl' },
  { value: 'en', labelKey: 'onb.lang.en' },
];

export default function SettingsScreen({
  adapter,
  profile,
  onProfileChange,
  onDeleteAll,
  onImported,
}: {
  adapter: StorageAdapter;
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => Promise<void>;
  onDeleteAll: () => Promise<void>;
  onImported: (profile: UserProfile) => void;
}) {
  const t = useT();
  const lang = useLang();
  const [op, setOp] = useState<DataOp>({ phase: 'idle' });
  const [howOpen, setHowOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const importTrigger = useRef<HTMLButtonElement>(null);
  const deleteTrigger = useRef<HTMLButtonElement>(null);
  // One ref serves both confirms: the DataOp union guarantees at most one is mounted.
  const confirmBox = useRef<HTMLDivElement>(null);
  const prevPhase = useRef<DataOp['phase']>('idle');

  const busy = op.phase === 'exporting' || op.phase === 'importing' || op.phase === 'deleting';

  // Focus follows the confirm dance (code-style: never let a focused element unmount
  // into body). Opening a confirm moves focus onto it; leaving one without success
  // ("keep" or an error message) returns focus to its trigger. Success paths unmount
  // the whole screen, so they need no handling here.
  useEffect(() => {
    const prev = prevPhase.current;
    prevPhase.current = op.phase;
    if (op.phase === 'confirmImport' || op.phase === 'confirmDelete') {
      confirmBox.current?.focus();
    } else if (op.phase === 'idle' || op.phase === 'message') {
      if (prev === 'confirmDelete' || prev === 'deleting') deleteTrigger.current?.focus();
      else if (prev === 'confirmImport' || prev === 'importing') importTrigger.current?.focus();
    }
  }, [op.phase]);

  const switchLanguage = async (language: Lang) => {
    if (language === profile.language) return; // ignored tap = zero side effects
    try {
      await onProfileChange({ ...profile, language });
    } catch {
      // Already logged in App; the UI switched optimistically — say so honestly.
      setOp({ phase: 'message', key: 'settings.language.error' });
    }
  };

  const handleExport = async () => {
    setOp({ phase: 'exporting' });
    try {
      const entries = await adapter.getAllEntries();
      const blob = buildExportBlob(profile, entries, CURRENT_SCHEMA_VERSION, nowISO());
      downloadJSON(exportFilename(localToday()), blob);
      setOp({ phase: 'idle' });
    } catch (err) {
      console.error('Showup export failed', err);
      setOp({ phase: 'message', key: 'settings.export.error' });
    }
  };

  const pickImportFile = () => {
    // Reset BEFORE reopening the picker: two identical rejections in a row must still
    // re-announce (role="status" only fires on DOM change, code-style F8.1).
    setOp({ phase: 'idle' });
    fileInput.current?.click();
  };

  const handleFilePicked = async (file: File) => {
    try {
      const raw = await readJSONFile(file);
      const result = validateExportBlob(raw, CURRENT_SCHEMA_VERSION);
      if (result.ok) {
        setOp({ phase: 'confirmImport', blob: result.blob });
      } else {
        console.error('Showup import rejected', result.errors);
        setOp({
          phase: 'message',
          key: result.reason === 'newer' ? 'settings.import.newer' : 'settings.import.invalid',
        });
      }
    } catch (err) {
      // Read failure or malformed JSON — same calm branch as a failed validation.
      console.error('Showup import file unreadable', err);
      setOp({ phase: 'message', key: 'settings.import.invalid' });
    }
  };

  const confirmImport = async (blob: ExportBlob) => {
    setOp({ phase: 'importing', blob });
    try {
      await adapter.replaceAll(blob.profile, blob.entries);
      onImported(blob.profile); // App remounts the shell — this screen unmounts
    } catch (err) {
      console.error('Showup import failed', err);
      // replaceAll is atomic: a failure honestly means "nothing changed".
      setOp({ phase: 'message', key: 'settings.import.error' });
    }
  };

  const confirmDelete = async () => {
    setOp({ phase: 'deleting' });
    try {
      await onDeleteAll(); // App shows onboarding — this screen unmounts
    } catch (err) {
      console.error('Showup delete-all failed', err);
      setOp({ phase: 'message', key: 'settings.delete.error' });
    }
  };

  return (
    <div className="screen">
      <h1>{t('settings.title')}</h1>

      <section className="settings-section">
        <h2>{t('settings.language')}</h2>
        <div className="lang-switch">
          {LANG_OPTIONS.map(({ value, labelKey }) => (
            <button
              key={value}
              type="button"
              lang={value}
              aria-pressed={profile.language === value}
              className={`lang-btn ${profile.language === value ? 'lang-btn--selected' : ''}`}
              disabled={busy}
              onClick={() => void switchLanguage(value)}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2>{t('settings.how.title')}</h2>
        <button
          type="button"
          className="btn-link"
          aria-expanded={howOpen}
          aria-controls="settings-how-body"
          onClick={() => setHowOpen((v) => !v)}
        >
          {howOpen ? t('settings.how.hide') : t('settings.how.show')}{' '}
          <span aria-hidden="true">{howOpen ? '▴' : '▾'}</span>
        </button>
        {howOpen && (
          <div id="settings-how-body" className="settings-how">
            <p>{t('settings.how.p1')}</p>
            <p>{t('settings.how.p2')}</p>
            <p>{t('settings.how.p3')}</p>
            <p>{t('settings.how.p4')}</p>
            <p className="muted">{t('settings.how.p5')}</p>
          </div>
        )}
      </section>

      <section className="settings-section">
        <h2>{t('settings.data')}</h2>

        <button type="button" className="btn-secondary" disabled={busy} onClick={() => void handleExport()}>
          {op.phase === 'exporting' ? t('settings.export.working') : t('settings.export.cta')}
        </button>

        <button ref={importTrigger} type="button" className="btn-secondary" disabled={busy} onClick={pickImportFile}>
          {t('settings.import.cta')}
        </button>
        {/* Hidden picker: name is mandatory; value reset lets the SAME fixed file re-trigger onChange. */}
        <input
          ref={fileInput}
          type="file"
          name="import-file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void handleFilePicked(file);
          }}
        />
        {(op.phase === 'confirmImport' || op.phase === 'importing') && (
          <div ref={confirmBox} tabIndex={-1} className="settings-confirm">
            <p>
              {t('settings.import.confirmBody', {
                // `today` param appends the year when the backup is from another year (F7).
                date: formatDayLong(localToday(new Date(op.blob.exportedAt)), lang, localToday()),
                count: op.blob.entries.length,
              })}
            </p>
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={() => void confirmImport(op.blob)}
            >
              {op.phase === 'importing' ? t('settings.import.working') : t('settings.import.confirmCta')}
            </button>
            <button type="button" className="btn-link" disabled={busy} onClick={() => setOp({ phase: 'idle' })}>
              {t('settings.confirm.keep')}
            </button>
          </div>
        )}

        {op.phase === 'confirmDelete' || op.phase === 'deleting' ? (
          <div ref={confirmBox} tabIndex={-1} className="settings-confirm">
            <p>{t('settings.delete.confirmBody')}</p>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => void confirmDelete()}>
              {op.phase === 'deleting' ? t('settings.delete.working') : t('settings.delete.confirmCta')}
            </button>
            <button type="button" className="btn-link" disabled={busy} onClick={() => setOp({ phase: 'idle' })}>
              {t('settings.confirm.keep')}
            </button>
          </div>
        ) : (
          <button
            ref={deleteTrigger}
            type="button"
            className="btn-link"
            disabled={busy}
            onClick={() => setOp({ phase: 'confirmDelete' })}
          >
            {t('settings.delete.cta')}
          </button>
        )}

        {/* Persistent status region: rendered from the start, content switched (code-style rule). */}
        <p role="status" className="muted">
          {op.phase === 'message' ? t(op.key) : ''}
        </p>

        <p className="settings-privacy muted">{t('settings.privacy')}</p>
      </section>

      <section className="settings-section">
        <h2>{t('settings.about')}</h2>
        <p className="muted">{t('settings.version', { version: __APP_VERSION__ })}</p>
      </section>
    </div>
  );
}
