import { useState, useCallback } from 'react';
import { DbPlayer, DataPlayerListResponse } from '@/types/server';

interface UseDatabasePlayersResult {
  players: DbPlayer[];
  loading: boolean;
  error: string | null;
  fetchPlayers: (backendUrl: string, serverId: string) => Promise<void>;
}

export function useDatabasePlayers(): UseDatabasePlayersResult {
  const [players, setPlayers] = useState<DbPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = useCallback(async (backendUrl: string, serverId: string) => {
    setLoading(true);
    setError(null);
    try {
      const base = backendUrl.replace(/\/$/, '');
      const response = await fetch(`${base}/api/storage/server/${encodeURIComponent(serverId)}/player`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        throw new Error(`Backend returned HTTP ${response.status}`);
      }
      const data: DataPlayerListResponse = await response.json();
      setPlayers(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { players, loading, error, fetchPlayers };
}
