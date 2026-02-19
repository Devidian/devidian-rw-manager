import { useState, useEffect, useCallback } from 'react';
import { ServerConfig } from '@/types/server';

const STORAGE_KEY = 'risingworld_servers';

function loadServers(): ServerConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ServerConfig[];
  } catch {
    return [];
  }
}

function saveServers(servers: ServerConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(servers));
}

export function useServers() {
  const [servers, setServers] = useState<ServerConfig[]>(loadServers);

  const addServer = useCallback((data: Omit<ServerConfig, 'id' | 'createdAt'>) => {
    const newServer: ServerConfig = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setServers(prev => {
      const updated = [...prev, newServer];
      saveServers(updated);
      return updated;
    });
    return newServer;
  }, []);

  const removeServer = useCallback((id: string) => {
    setServers(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveServers(updated);
      return updated;
    });
  }, []);

  const updateServer = useCallback((id: string, data: Partial<Omit<ServerConfig, 'id' | 'createdAt'>>) => {
    setServers(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, ...data } : s);
      saveServers(updated);
      return updated;
    });
  }, []);

  const getServer = useCallback((id: string) => {
    return servers.find(s => s.id === id);
  }, [servers]);

  return { servers, addServer, removeServer, updateServer, getServer };
}
