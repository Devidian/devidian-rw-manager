import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { useStorageMode } from '@/context/StorageModeContext';
import { checkBackend } from '@/lib/storage';

interface BackendInfoContextValue {
  services: string[];
  maxPinnedServers: number;
}

const DEFAULT_MAX_PINNED_SERVERS = 50;
const BackendInfoContext = createContext<BackendInfoContextValue>({
  services: [],
  maxPinnedServers: DEFAULT_MAX_PINNED_SERVERS,
});

export function BackendInfoProvider({ children }: { children: ReactNode }) {
  const { fixedBackendUrl } = useStorageMode();
  const [value, setValue] = useState<BackendInfoContextValue>({
    services: [],
    maxPinnedServers: DEFAULT_MAX_PINNED_SERVERS,
  });

  useEffect(() => {
    let active = true;
    if (!fixedBackendUrl) {
      setValue({ services: [], maxPinnedServers: DEFAULT_MAX_PINNED_SERVERS });
      return;
    }
    checkBackend(fixedBackendUrl, 'storage').then((result) => {
      if (!active) return;
      setValue(result.ok
        ? {
            services: result.services,
            maxPinnedServers: result.limits?.maxPinnedServers ?? DEFAULT_MAX_PINNED_SERVERS,
          }
        : { services: [], maxPinnedServers: DEFAULT_MAX_PINNED_SERVERS });
    });
    return () => { active = false; };
  }, [fixedBackendUrl]);

  return <BackendInfoContext.Provider value={value}>{children}</BackendInfoContext.Provider>;
}

export function useBackendInfo(): BackendInfoContextValue {
  return useContext(BackendInfoContext);
}
