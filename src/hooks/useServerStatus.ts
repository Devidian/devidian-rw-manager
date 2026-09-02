import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { StorageAdapter } from '@/lib/storage';
import { ServerConfig, ServerStatus, ServerWithStatus } from '@/types/server';
import { useServerLiveSubscription } from '@/hooks/useServerLiveSubscription';
import type { ServerStatusChangedMessage, ServerStatusSnapshotMessage } from '@/lib/serverLive';

const DEFAULT_REFRESH_INTERVAL_MS = 30_000;
const MIN_REFRESH_INTERVAL_MS = 5_000;

function getRefreshIntervalMs(): number {
  const raw = import.meta.env.VITE_SERVER_QUERY_REFRESH_INTERVAL_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_REFRESH_INTERVAL_MS;
  return Math.max(MIN_REFRESH_INTERVAL_MS, parsed);
}

export function useServerStatus(
  servers: ServerConfig[],
  adapter: StorageAdapter,
  autoRefreshServers: ServerConfig[] = servers,
  backendUrl: string | null = null,
) {
  const [statusMap, setStatusMap] = useState<Record<string, ServerWithStatus>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveSubscriptionServerIds = useMemo(
    () => servers.map((server) => server.id),
    [servers],
  );

  const fetchServerFull = useCallback(async (server: ServerConfig): Promise<Partial<ServerWithStatus>> => {
    const response = await adapter.getServerLiveStatus(server);
    return {
      status: response.status,
      queryData: response.queryData,
      infoData: response.infoData,
      onlinePlayers: response.onlinePlayers,
      lastChecked: new Date(response.lastChecked),
      errorMessage: response.errorMessage,
    };
  }, [adapter]);

  const refreshAll = useCallback(async () => {
    if (autoRefreshServers.length === 0) return;

    setStatusMap(prev => {
      const next = { ...prev };
      autoRefreshServers.forEach(s => {
        next[s.id] = { ...s, ...(prev[s.id] ?? {}), status: 'loading' };
      });
      return next;
    });

    const results = await Promise.all(
      autoRefreshServers.map(async s => ({ server: s, ...(await fetchServerFull(s)) }))
    );

    setStatusMap(prev => {
      const next = { ...prev };
      results.forEach(({ server, ...rest }) => {
        next[server.id] = {
          ...server,
          status: rest.status as ServerStatus ?? 'unknown',
          queryData: rest.queryData,
          infoData: rest.infoData,
          onlinePlayers: rest.onlinePlayers,
          lastChecked: rest.lastChecked,
          errorMessage: rest.errorMessage,
        };
      });
      return next;
    });
  }, [autoRefreshServers, fetchServerFull]);

  const refreshOne = useCallback(async (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;

    setStatusMap(prev => ({
      ...prev,
      [serverId]: { ...server, ...(prev[serverId] ?? {}), status: 'loading' },
    }));

    const result = await fetchServerFull(server);
    setStatusMap(prev => ({
      ...prev,
      [serverId]: { ...server, ...result } as ServerWithStatus,
    }));
  }, [fetchServerFull, servers]);

  const applySnapshot = useCallback((message: ServerStatusSnapshotMessage) => {
    setStatusMap((previous) => {
      const next = { ...previous };
      for (const { serverId, value } of message.items) {
        const server = servers.find((item) => item.id === serverId);
        if (!server) continue;
        next[serverId] = { ...server, ...value, lastChecked: new Date(value.lastChecked) };
      }
      return next;
    });
  }, [servers]);

  const applyChanged = useCallback((message: ServerStatusChangedMessage) => {
    setStatusMap((previous) => {
      const server = servers.find((item) => item.id === message.serverId);
      if (!server) return previous;
      const current: ServerWithStatus = previous[message.serverId] ?? {
        ...server,
        status: server.status ?? 'unknown',
      };
      const updated: ServerWithStatus = {
        ...current,
        ...message.changed,
        ...(message.changed.lastChecked ? { lastChecked: new Date(message.changed.lastChecked) } : {}),
      };
      for (const field of message.removedFields) delete updated[field];
      return { ...previous, [message.serverId]: updated };
    });
  }, [servers]);

  const liveState = useServerLiveSubscription(
    backendUrl,
    liveSubscriptionServerIds,
    applySnapshot,
    applyChanged,
  );

  useEffect(() => {
    if (liveState === 'connecting' || liveState === 'subscribed') return;
    void refreshAll();
    intervalRef.current = setInterval(refreshAll, getRefreshIntervalMs());
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [liveState, refreshAll]);

  return { statusMap, refreshAll, refreshOne, liveState };
}
