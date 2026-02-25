import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { StorageAdapter, LocalStorageAdapter, BackendStorageAdapter } from '@/lib/storage';

const MODE_KEY = 'rwm_storage_mode';
const BACKEND_URL_KEY = 'rwm_backend_url';

export type StorageMode = 'local' | 'backend' | 'fixed';

const FIXED_BACKEND_URL = (import.meta.env.VITE_FIXED_BACKEND_URL as string) || '';

interface StorageModeContextValue {
  mode: StorageMode;
  backendUrl: string | null;
  fixedBackendUrl: string | null;
  hasFixedBackend: boolean;
  adapter: StorageAdapter;
  isConfigured: boolean;
  setLocalMode: () => void;
  setBackendMode: (url: string) => void;
  setFixedMode: () => void;
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

  const fixedBackendUrl = FIXED_BACKEND_URL || null;
  const hasFixedBackend = !!FIXED_BACKEND_URL;

  const adapter = useMemo<StorageAdapter>(() => {
    if (mode === 'fixed' && fixedBackendUrl) {
      return new BackendStorageAdapter(fixedBackendUrl);
    }
    if (mode === 'backend' && backendUrl) {
      return new BackendStorageAdapter(backendUrl);
    }
    return new LocalStorageAdapter();
  }, [mode, backendUrl, fixedBackendUrl]);

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

  const setFixedMode = () => {
    localStorage.setItem(MODE_KEY, 'fixed');
    localStorage.removeItem(BACKEND_URL_KEY);
    setModeState('fixed');
    setBackendUrlState(null);
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
        fixedBackendUrl,
        hasFixedBackend,
        adapter,
        isConfigured: mode !== null,
        setLocalMode,
        setBackendMode,
        setFixedMode,
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
