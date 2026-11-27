import { useState, useEffect, useCallback, useRef } from 'react';
import { ServerConfig } from '@/types/server';
import { ServerApprovalError, StorageAdapter } from '@/lib/storage';

const CATALOG_REFRESH_MS = 30_000;

export function useServers(adapter: StorageAdapter) {
  const [servers, setServers] = useState<ServerConfig[]>([]);

  const revision = useRef(0);

  useEffect(() => {
    let active = true;
    let running = false;
    async function load(refreshMasterOnly = false) {
      if (running) return;
      const requestedRevision = revision.current;
      running = true;
      try {
        const catalog = refreshMasterOnly ? await adapter.getMasterOnlyServers?.() : await adapter.getServers();
        if (!active || requestedRevision !== revision.current || !catalog) return;
        if (refreshMasterOnly) {
          setServers(current => {
            const persisted = current.filter(server => !server.masterOnly);
            const ids = new Set(persisted.map(server => server.id));
            return [...persisted, ...catalog.filter(server => server.masterOnly && !ids.has(server.id))];
          });
        } else setServers(catalog);
      } catch {
        // Keep the catalog during an outage. Transient observations expire independently.
      } finally {
        running = false;
      }
    }
    void load();
    const timer = adapter.getMasterOnlyServers ? window.setInterval(() => void load(true), CATALOG_REFRESH_MS) : undefined;
    return () => {
      active = false;
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [adapter]);

  useEffect(() => {
    const expiry = Math.min(...servers.flatMap(server =>
      server.masterOnly && server.masterOnlyLiveUntil ? [Date.parse(server.masterOnlyLiveUntil)] : [],
    ).filter(Number.isFinite));
    if (!Number.isFinite(expiry)) return;
    const timer = window.setTimeout(() => {
      setServers(current => current.map(server =>
        server.masterOnly && server.masterOnlyLiveUntil && Date.parse(server.masterOnlyLiveUntil) <= Date.now()
          ? { ...server, status: 'unknown', queryData: undefined, masterOnlyLiveUntil: undefined, masterOnlyPlayerNames: undefined }
          : server,
      ));
    }, Math.max(0, Math.min(expiry - Date.now(), 2_147_483_647)));
    return () => window.clearTimeout(timer);
  }, [servers]);

  const refreshServers = useCallback(async (): Promise<ServerConfig[]> => {
    const refreshed = await adapter.refreshServers();
    revision.current += 1;
    setServers(refreshed);
    return refreshed;
  }, [adapter]);

  const addServer = useCallback(async (data: Omit<ServerConfig, 'id' | 'createdAt'>): Promise<ServerConfig> => {
    const newServer = await adapter.addServer(data);
    revision.current += 1;
    setServers(prev => [...prev, newServer]);
    return newServer;
  }, [adapter]);

  const approveServer = useCallback(async (id: string): Promise<ServerConfig> => {
    if (!adapter.approveServer) throw new ServerApprovalError('SERVER_APPROVAL_FAILED');
    const approved = await adapter.approveServer(id);
    revision.current += 1;
    setServers(prev => [...prev.filter(server => server.id !== id && server.id !== approved.id), approved]);
    return approved;
  }, [adapter]);

  const updateServer = useCallback(async (id: string, data: Partial<Pick<ServerConfig, 'label' | 'backendUrl'>>): Promise<ServerConfig> => {
    const updated = await adapter.updateServer(id, data);
    revision.current += 1;
    setServers(prev => prev.map(s => s.id === id ? updated : s));
    return updated;
  }, [adapter]);

  const setServerBlocked = useCallback(async (id: string, blocked: boolean): Promise<ServerConfig> => {
    const updated = await adapter.setServerBlocked(id, blocked);
    revision.current += 1;
    setServers(prev => prev.map(s => s.id === id ? updated : s));
    return updated;
  }, [adapter]);

  const removeServer = useCallback(async (id: string): Promise<void> => {
    await adapter.deleteServer(id);
    revision.current += 1;
    setServers(prev => prev.filter(s => s.id !== id));
  }, [adapter]);

  const getServer = useCallback((id: string) => {
    return servers.find(s => s.id === id);
  }, [servers]);

  return { servers, refreshServers, addServer, approveServer, updateServer, setServerBlocked, removeServer, getServer };
}
