import { useState, useEffect, useCallback } from 'react';
import { ServerConfig } from '@/types/server';
import { StorageAdapter } from '@/lib/storage';

export function useServers(adapter: StorageAdapter) {
  const [servers, setServers] = useState<ServerConfig[]>([]);

  useEffect(() => {
    adapter.getServers().then(setServers).catch(() => setServers([]));
  }, [adapter]);

  const addServer = useCallback(async (data: Omit<ServerConfig, 'id' | 'createdAt'>): Promise<ServerConfig> => {
    const newServer = await adapter.addServer(data);
    setServers(prev => [...prev, newServer]);
    return newServer;
  }, [adapter]);

  const updateServer = useCallback(async (id: string, data: Partial<Pick<ServerConfig, 'label' | 'backendUrl'>>): Promise<ServerConfig> => {
    const updated = await adapter.updateServer(id, data);
    setServers(prev => prev.map(s => s.id === id ? updated : s));
    return updated;
  }, [adapter]);

  const removeServer = useCallback(async (id: string): Promise<void> => {
    await adapter.deleteServer(id);
    setServers(prev => prev.filter(s => s.id !== id));
  }, [adapter]);

  const getServer = useCallback((id: string) => {
    return servers.find(s => s.id === id);
  }, [servers]);

  return { servers, addServer, updateServer, removeServer, getServer };
}
