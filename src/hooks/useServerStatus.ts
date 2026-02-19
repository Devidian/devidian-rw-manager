import { useState, useEffect, useCallback, useRef } from 'react';
import { ServerConfig, ServerStatus, RisingWorldQueryData, ServerWithStatus } from '@/types/server';

const REFRESH_INTERVAL = 60_000; // 60 seconds

async function fetchServerStatus(queryUrl: string): Promise<{ status: ServerStatus; data?: RisingWorldQueryData; error?: string }> {
  try {
    const url = queryUrl.endsWith('/') ? queryUrl : queryUrl + '/';
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      return { status: 'offline', error: `HTTP ${response.status}` };
    }
    const data: RisingWorldQueryData = await response.json();
    return { status: 'online', data };
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      return { status: 'offline', error: 'Timeout' };
    }
    return { status: 'offline', error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export function useServerStatus(servers: ServerConfig[]) {
  const [statusMap, setStatusMap] = useState<Record<string, ServerWithStatus>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshAll = useCallback(async () => {
    if (servers.length === 0) return;

    // Set all to loading
    setStatusMap(prev => {
      const next = { ...prev };
      servers.forEach(s => {
        next[s.id] = { ...s, status: 'loading', ...(prev[s.id] ?? {}) };
      });
      return next;
    });

    // Fetch all in parallel
    const results = await Promise.all(
      servers.map(async s => {
        const result = await fetchServerStatus(s.queryUrl);
        return { server: s, ...result };
      })
    );

    setStatusMap(prev => {
      const next = { ...prev };
      results.forEach(r => {
        next[r.server.id] = {
          ...r.server,
          status: r.status,
          queryData: r.data,
          lastChecked: new Date(),
          errorMessage: r.error,
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

    const result = await fetchServerStatus(server.queryUrl);
    setStatusMap(prev => ({
      ...prev,
      [serverId]: {
        ...server,
        status: result.status,
        queryData: result.data,
        lastChecked: new Date(),
        errorMessage: result.error,
      },
    }));
  }, [servers]);

  useEffect(() => {
    refreshAll();
    intervalRef.current = setInterval(refreshAll, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshAll]);

  return { statusMap, refreshAll, refreshOne };
}
