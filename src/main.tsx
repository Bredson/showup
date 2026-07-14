import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './tokens.css';
import './ui/styles.css';
import App from './App.tsx';
import { createIdbAdapter, requestPersistentStorage } from './storage/idbAdapter';

async function bootstrap() {
  // Best-effort: ask the browser not to evict our IndexedDB (data-model §2). Result ignored —
  // the app works either way, persistence just makes eviction unlikely.
  void requestPersistentStorage();

  const adapter = await createIdbAdapter();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App adapter={adapter} />
    </StrictMode>,
  );
}

void bootstrap();
