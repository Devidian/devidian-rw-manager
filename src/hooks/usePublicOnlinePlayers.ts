import { useEffect, useState } from 'react';
import type { ServerWithStatus } from '@/types/server';

const REFRESH_INTERVAL_MS = 30_000;
const REQUEST_CONCURRENCY = 6;

/** Public names supplement the consent-filtered live export for display. */
export function usePublicOnlinePlayers(backendUrl: string | null, servers: ServerWithStatus[], enabled: boolean) {
  const [namesByServer, setNamesByServer] = useState<Record<string, string[]>>({});
  const serverIdsKey = JSON.stringify([...new Set(servers
    .filter(server => !server.masterOnly && !server.blocked && server.status !== 'offline')
    .map(server => server.id))].sort());

  useEffect(() => {
    const ids: string[] = JSON.parse(serverIdsKey);
    if (!enabled || !backendUrl || ids.length === 0) {
      setNamesByServer({});
      return;
    }
    const controller = new AbortController();
    const base = backendUrl.replace(/\/+$/, '');
    let running = false;
    setNamesByServer(current => Object.fromEntries(ids.flatMap(id =>
      Object.prototype.hasOwnProperty.call(current, id) ? [[id, current[id]]] : [],
    )));

    const refresh = async () => {
      if (running) return;
      running = true;
      const names: Record<string, string[]> = Object.create(null);
      let next = 0;
      try {
        await Promise.all(Array.from({ length: Math.min(ids.length, REQUEST_CONCURRENCY) }, async () => {
          while (!controller.signal.aborted && next < ids.length) {
            const id = ids[next++];
            try {
              const response = await fetch(`${base}/api/storage/server/${encodeURIComponent(id)}/guest-online-players`, {
                signal: controller.signal,
              });
              if (!response.ok) continue;
              const payload: { names?: unknown } = await response.json();
              if (Array.isArray(payload.names)) {
                names[id] = payload.names.filter((name): name is string => typeof name === 'string');
              }
            } catch {
              // One unavailable server does not hide the others.
            }
          }
        }));
        if (!controller.signal.aborted) setNamesByServer(names);
      } finally {
        running = false;
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [backendUrl, enabled, serverIdsKey]);

  return enabled && backendUrl ? namesByServer : {};
}
