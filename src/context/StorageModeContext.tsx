import { createContext, useContext, ReactNode, useMemo } from 'react';
import { StorageAdapter, BackendStorageAdapter, LocalStorageAdapter } from '@/lib/storage';

export type StorageMode = 'local' | 'backend' | 'fixed';

const FIXED_BACKEND_URL = (import.meta.env.VITE_FIXED_BACKEND_URL as string) || '';

interface StorageModeContextValue {
  mode: StorageMode;
  backendUrl: string | null;
  fixedBackendUrl: string | null;
  hasFixedBackend: boolean;
  adapter: StorageAdapter;
  isConfigured: boolean;
}

const StorageModeContext = createContext<StorageModeContextValue | undefined>(undefined);

export function StorageModeProvider({ children }: { children: ReactNode }) {
  const fixedBackendUrl = FIXED_BACKEND_URL || null;
  const hasFixedBackend = !!FIXED_BACKEND_URL;

  const adapter = useMemo<StorageAdapter>(() => {
    if (fixedBackendUrl) {
      return new BackendStorageAdapter(fixedBackendUrl);
    }
    // Keeps the app renderable enough to show the missing-backend warning page.
    return new LocalStorageAdapter();
  }, [fixedBackendUrl]);

  return (
    <StorageModeContext.Provider
      value={{
        mode: 'fixed',
        backendUrl: null,
        fixedBackendUrl,
        hasFixedBackend,
        adapter,
        isConfigured: hasFixedBackend,
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
