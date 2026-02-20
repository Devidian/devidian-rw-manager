import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { StorageAdapter, LocalStorageAdapter, BackendStorageAdapter } from '@/lib/storage';

const MODE_KEY = 'rwm_storage_mode';
const BACKEND_URL_KEY = 'rwm_backend_url';

export type StorageMode = 'local' | 'backend';

interface StorageModeContextValue {
  mode: StorageMode;
  backendUrl: string | null;
  adapter: StorageAdapter;
  isConfigured: boolean;
  setLocalMode: () => void;
  setBackendMode: (url: string) => void;
  reset: () => void;
}

const StorageModeContext = createContext<StorageModeContextValue | undefined>(undefined);

function loadPersistedMode(): { mode: StorageMode | null; backendUrl: string | null } {
  const mode = localStorage.getItem(MODE_KEY) as StorageMode | null;
  const backendUrl = localStorage.getItem(BACKEND_URL_KEY);
  return { mode, backendUrl };
}

export function StorageModeProvider({ children }: { children: ReactNode }) {
  const persisted = loadPersistedMode();
  const [mode, setModeState] = useState<StorageMode | null>(persisted.mode);
  const [backendUrl, setBackendUrlState] = useState<string | null>(persisted.backendUrl);

  const adapter = useMemo<StorageAdapter>(() => {
    if (mode === 'backend' && backendUrl) {
      return new BackendStorageAdapter(backendUrl);
    }
    return new LocalStorageAdapter();
  }, [mode, backendUrl]);

  const setLocalMode = () => {
    localStorage.setItem(MODE_KEY, 'local');
    localStorage.removeItem(BACKEND_URL_KEY);
    setModeState('local');
    setBackendUrlState(null);
  };

  const setBackendMode = (url: string) => {
    localStorage.setItem(MODE_KEY, 'backend');
    localStorage.setItem(BACKEND_URL_KEY, url);
    setModeState('backend');
    setBackendUrlState(url);
  };

  const reset = () => {
    localStorage.removeItem(MODE_KEY);
    localStorage.removeItem(BACKEND_URL_KEY);
    setModeState(null);
    setBackendUrlState(null);
  };

  return (
    <StorageModeContext.Provider
      value={{
        mode: mode ?? 'local',
        backendUrl,
        adapter,
        isConfigured: mode !== null,
        setLocalMode,
        setBackendMode,
        reset,
      }}
    >
      {children}
    </StorageModeContext.Provider>
  );
}

export function useStorageMode() {
  const ctx = useContext(StorageModeContext);
  if (!ctx) throw new Error('useStorageMode must be used within StorageModeProvider');
  return ctx;
}
