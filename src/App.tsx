import { translate } from './i18n';

// Skeleton (Faza 3): placeholder screen proving tokens + i18n wiring.
// Real screens land in Faza 4 (see docs/ux-spec.md).
export default function App() {
  const lang = 'pl';
  return (
    <main style={{ padding: 'var(--pad-screen)' }}>
      <h1>{translate(lang, 'app.name')}</h1>
      <p style={{ color: 'var(--text-muted)' }}>{translate(lang, 'app.tagline')}</p>
    </main>
  );
}
