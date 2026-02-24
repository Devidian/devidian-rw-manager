import { createContext, useContext, ReactNode } from 'react';
import { useServers } from '@/hooks/useServers';
import { useServerStatus } from '@/hooks/useServerStatus';
import { useStorageMode } from '@/context/StorageModeContext';
import { ServerConfig, ServerWithStatus } from '@/types/server';

interface ServerContextValue {
  servers: ServerConfig[];
  serverList: ServerWithStatus[];
  addServer: (data: Omit<ServerConfig, 'id' | 'createdAt'>) => Promise<ServerConfig>;
  updateServer: (id: string, data: Partial<Pick<ServerConfig, 'label' | 'backendUrl'>>) => Promise<ServerConfig>;
  removeServer: (id: string) => Promise<void>;
  getServer: (id: string) => ServerConfig | undefined;
  refreshAll: () => void;
  refreshOne: (id: string) => void;
}

const ServerContext = createContext<ServerContextValue | undefined>(undefined);

export function ServerProvider({ children }: { children: ReactNode }) {
  const { adapter } = useStorageMode();
  const { servers, addServer, updateServer, removeServer, getServer } = useServers(adapter);
  const { statusMap, refreshAll, refreshOne } = useServerStatus(servers);

  const serverList: ServerWithStatus[] = servers.map(s => statusMap[s.id] ?? { ...s, status: 'unknown' as const });

  return (
    <ServerContext.Provider value={{ servers, serverList, addServer, updateServer, removeServer, getServer, refreshAll, refreshOne }}>
      {children}
    </ServerContext.Provider>
  );
}

export function useServerContext() {
  const ctx = useContext(ServerContext);
  if (!ctx) throw new Error('useServerContext must be used within ServerProvider');
  return ctx;
}
