import { createContext, useContext, useState, ReactNode } from 'react';
import { useServers } from '@/hooks/useServers';
import { useServerStatus } from '@/hooks/useServerStatus';
import { ServerConfig, ServerWithStatus } from '@/types/server';

interface ServerContextValue {
  servers: ServerConfig[];
  serverList: ServerWithStatus[];
  addServer: (data: Omit<ServerConfig, 'id' | 'createdAt'>) => ServerConfig;
  removeServer: (id: string) => void;
  updateServer: (id: string, data: Partial<Omit<ServerConfig, 'id' | 'createdAt'>>) => void;
  getServer: (id: string) => ServerConfig | undefined;
  refreshAll: () => void;
  refreshOne: (id: string) => void;
}

const ServerContext = createContext<ServerContextValue | undefined>(undefined);

export function ServerProvider({ children }: { children: ReactNode }) {
  const { servers, addServer, removeServer, updateServer, getServer } = useServers();
  const { statusMap, refreshAll, refreshOne } = useServerStatus(servers);

  const serverList: ServerWithStatus[] = servers.map(s => statusMap[s.id] ?? { ...s, status: 'unknown' as const });

  return (
    <ServerContext.Provider value={{ servers, serverList, addServer, removeServer, updateServer, getServer, refreshAll, refreshOne }}>
      {children}
    </ServerContext.Provider>
  );
}

export function useServerContext() {
  const ctx = useContext(ServerContext);
  if (!ctx) throw new Error('useServerContext must be used within ServerProvider');
  return ctx;
}
