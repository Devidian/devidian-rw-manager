import { useState, useEffect, useCallback, useRef } from 'react';
import { ServerConfig, ServerStatus, RisingWorldQueryData, ServerInfoResponse, ServerPlayerListResponse, ServerPlayerListPlayer, ServerWithStatus } from '@/types/server';

const DEFAULT_REFRESH_INTERVAL_MS = 30_000;
const MIN_REFRESH_INTERVAL_MS = 5_000;

function getRefreshIntervalMs(): number {
  const raw = import.meta.env.VITE_SERVER_QUERY_REFRESH_INTERVAL_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_REFRESH_INTERVAL_MS;
  return Math.max(MIN_REFRESH_INTERVAL_MS, parsed);
}

async function fetchJson<T>(url: string): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };
    const data = await response.json();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

async function fetchServerFull(server: ServerConfig): Promise<Partial<ServerWithStatus>> {
  const base = server.queryUrl.endsWith('/') ? server.queryUrl : server.queryUrl + '/';

  const [mainResult, infoResult, playerlistResult] = await Promise.allSettled([
    fetchJson<RisingWorldQueryData>(base),
    fetchJson<ServerInfoResponse>(base + 'info'),
    fetchJson<ServerPlayerListResponse>(base + 'playerlist'),
  ]);

  const main = mainResult.status === 'fulfilled' ? mainResult.value : { ok: false as const, error: 'Failed' };

  const status: ServerStatus = main.ok ? 'online' : 'offline';
  const queryData = main.ok ? main.data : undefined;
  const errorMessage = !main.ok ? ('error' in main ? main.error : 'Unknown error') : undefined;

  const info = infoResult.status === 'fulfilled' && infoResult.value.ok ? infoResult.value.data : undefined;
  const playerlist = playerlistResult.status === 'fulfilled' && playerlistResult.value.ok ? playerlistResult.value.data : undefined;

  return {
    status,
    queryData,
    infoData: info,
    onlinePlayers: playerlist?.players,
    lastChecked: new Date(),
    errorMessage,
  };
}

export function useServerStatus(servers: ServerConfig[]) {
  const [statusMap, setStatusMap] = useState<Record<string, ServerWithStatus>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshAll = useCallback(async () => {
    if (servers.length === 0) return;

    setStatusMap(prev => {
      const next = { ...prev };
      servers.forEach(s => {
        next[s.id] = { ...s, status: 'loading', ...(prev[s.id] ?? {}) };
      });
      return next;
    });

    const results = await Promise.all(
      servers.map(async s => ({ server: s, ...(await fetchServerFull(s)) }))
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
  }, [servers]);

  const refreshOne = useCallback(async (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;

    setStatusMap(prev => ({
      ...prev,
      [serverId]: { ...server, status: 'loading', ...(prev[serverId] ?? {}) },
    }));

    const result = await fetchServerFull(server);
    setStatusMap(prev => ({
      ...prev,
      [serverId]: { ...server, ...result } as ServerWithStatus,
    }));
  }, [servers]);

  useEffect(() => {
    refreshAll();
    intervalRef.current = setInterval(refreshAll, getRefreshIntervalMs());
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshAll]);

  return { statusMap, refreshAll, refreshOne };
}
