import { useState, useCallback } from 'react';
import { authHeaders } from '../lib/authApi';

export interface ServerConfigData {
  config: Record<string, string | number | boolean>;
}

interface UseServerConfigResult {
  config: Record<string, string | number | boolean> | null;
  loading: boolean;
  error: string | null;
  fetchConfig: (backendUrl: string, serverId: string) => Promise<void>;
}

export function useServerConfig(): UseServerConfigResult {
  const [config, setConfig] = useState<Record<string, string | number | boolean> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async (backendUrl: string, serverId: string) => {
    setLoading(true);
    setError(null);
    try {
      const base = backendUrl.replace(/\/$/, '');
      const res = await fetch(`${base}/api/storage/server/${encodeURIComponent(serverId)}/config`, {
        signal: AbortSignal.timeout(10_000),
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ServerConfigData = await res.json();
      setConfig(data.config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { config, loading, error, fetchConfig };
}
