import { createContext, useContext, ReactNode } from 'react';
import { useServers } from '@/hooks/useServers';
import { useServerStatus } from '@/hooks/useServerStatus';
import { useStorageMode } from '@/context/StorageModeContext';
import { useAuth } from '@/context/AuthContext';
import { ServerConfig, ServerWithStatus } from '@/types/server';

interface ServerContextValue {
  servers: ServerConfig[];
  serverList: ServerWithStatus[];
  pinnedServerList: ServerWithStatus[];
  dashboardServerList: ServerWithStatus[];
  approveServer: (id: string) => Promise<ServerConfig>;
  addServer: (data: Omit<ServerConfig, 'id' | 'createdAt'>) => Promise<ServerConfig>;
  updateServer: (id: string, data: Partial<Pick<ServerConfig, 'label' | 'backendUrl'>>) => Promise<ServerConfig>;
  setServerBlocked: (id: string, blocked: boolean) => Promise<ServerConfig>;
  removeServer: (id: string) => Promise<void>;
  getServer: (id: string) => ServerConfig | undefined;
  refreshAll: () => void;
  refreshServerList: () => void;
  refreshOne: (id: string) => void;
}

const ServerContext = createContext<ServerContextValue | undefined>(undefined);

export function ServerProvider({ children }: { children: ReactNode }) {
  const { adapter, fixedBackendUrl } = useStorageMode();
  const { user } = useAuth();
  const { servers=[], refreshServers, addServer, approveServer, updateServer, setServerBlocked, removeServer, getServer } = useServers(adapter);
  const dashboardServers = servers.filter(server => !!user && server.dashboardVisible);
  const { statusMap, refreshAll, refreshOne } = useServerStatus(
    servers.filter(server => !server.masterOnly),
    adapter,
    user ? dashboardServers : [],
    user ? fixedBackendUrl : null,
  );

  const serverList: ServerWithStatus[] = servers.map(s => {
    const status = statusMap[s.id];
    return status ? { ...s, ...status, status: status.status } : { ...s, status: s.status ?? 'unknown' as const };
  });
  const pinnedServerList = serverList.filter(server => !!user && server.dashboardVisible);
  const dashboardServerList = pinnedServerList;

  return (
    <ServerContext.Provider value={{
      servers,
      serverList,
      pinnedServerList,
      dashboardServerList,
      addServer,
      approveServer,
      updateServer,
      setServerBlocked,
      removeServer,
      getServer,
      refreshAll,
      refreshServerList: () => { void refreshServers(); },
      refreshOne,
    }}>
      {children}
    </ServerContext.Provider>
  );
}

export function useServerContext() {
  const ctx = useContext(ServerContext);
  if (!ctx) throw new Error('useServerContext must be used within ServerProvider');
  return ctx;
}
