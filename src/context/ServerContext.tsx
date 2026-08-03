import { createContext, useContext, ReactNode, useEffect, useMemo, useState } from 'react';
import { useServers } from '@/hooks/useServers';
import { useServerStatus } from '@/hooks/useServerStatus';
import { useStorageMode } from '@/context/StorageModeContext';
import { useAuth } from '@/context/AuthContext';
import { useBackendInfo } from '@/context/BackendInfoContext';
import { ServerConfig, ServerWithStatus } from '@/types/server';

interface ServerContextValue {
  servers: ServerConfig[];
  serverList: ServerWithStatus[];
  pinnedServerList: ServerWithStatus[];
  dashboardServerList: ServerWithStatus[];
  addServer: (data: Omit<ServerConfig, 'id' | 'createdAt'>) => Promise<ServerConfig>;
  updateServer: (id: string, data: Partial<Pick<ServerConfig, 'label' | 'backendUrl'>>) => Promise<ServerConfig>;
  setServerBlocked: (id: string, blocked: boolean) => Promise<ServerConfig>;
  removeServer: (id: string) => Promise<void>;
  pinServer: (id: string) => Promise<void>;
  unpinServer: (id: string) => Promise<void>;
  isPinned: (id: string) => boolean;
  canPinServer: (id: string) => boolean;
  pinLimitReached: boolean;
  maxPinnedServers: number;
  getServer: (id: string) => ServerConfig | undefined;
  refreshAll: () => void;
  refreshServerList: () => void;
  refreshOne: (id: string) => void;
}

const ServerContext = createContext<ServerContextValue | undefined>(undefined);

export function ServerProvider({ children }: { children: ReactNode }) {
  const { adapter, fixedBackendUrl } = useStorageMode();
  const { maxPinnedServers } = useBackendInfo();
  const { user, applyUserUpdate } = useAuth();
  const [localPinnedServers, setLocalPinnedServers] = useState<string[]>([]);
  const { servers=[], refreshServers, addServer, updateServer, setServerBlocked, removeServer, getServer } = useServers(adapter);
  const pinnedIds = useMemo(() => new Set(user?.pinnedServers ?? localPinnedServers), [localPinnedServers, user?.pinnedServers]);
  const dashboardServers = useMemo(
    () => servers.filter(server =>
      pinnedIds.has(server.id) || (!!user?.steamId && server.adminUid === user.steamId)
    ),
    [pinnedIds, servers, user?.steamId],
  );
  const { statusMap, refreshAll, refreshOne } = useServerStatus(
    servers,
    adapter,
    dashboardServers,
    fixedBackendUrl,
  );
  const pinLimitReached = pinnedIds.size >= maxPinnedServers;

  useEffect(() => {
    if (user) {
      setLocalPinnedServers([]);
      return;
    }
    adapter.getPinnedServers().then(setLocalPinnedServers).catch(() => setLocalPinnedServers([]));
  }, [adapter, user]);

  const serverList: ServerWithStatus[] = servers.map(s => {
    const status = statusMap[s.id];
    return status ? { ...s, ...status, status: status.status } : { ...s, status: s.status ?? 'unknown' as const };
  });
  const pinnedServerList = serverList.filter(server => pinnedIds.has(server.id));
  const dashboardServerList = serverList.filter(server =>
    pinnedIds.has(server.id) || (!!user?.steamId && server.adminUid === user.steamId)
  );

  const pinServer = async (id: string) => {
    if (!pinnedIds.has(id) && pinLimitReached) return;
    const nextUser = await adapter.pinServer(id);
    if (nextUser) {
      applyUserUpdate(nextUser);
      return;
    }
    setLocalPinnedServers(await adapter.getPinnedServers());
  };

  const unpinServer = async (id: string) => {
    const nextUser = await adapter.unpinServer(id);
    if (nextUser) {
      applyUserUpdate(nextUser);
      return;
    }
    setLocalPinnedServers(await adapter.getPinnedServers());
  };

  return (
    <ServerContext.Provider value={{
      servers,
      serverList,
      pinnedServerList,
      dashboardServerList,
      addServer,
      updateServer,
      setServerBlocked,
      removeServer,
      pinServer,
      unpinServer,
      isPinned: (id: string) => pinnedIds.has(id),
      canPinServer: (id: string) => pinnedIds.has(id) || !pinLimitReached,
      pinLimitReached,
      maxPinnedServers,
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
