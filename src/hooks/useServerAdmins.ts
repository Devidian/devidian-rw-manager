import { useState, useCallback } from 'react';
import { authHeaders } from '@/lib/authApi';

export function useServerAdmins() {
  const [admins, setAdmins] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAdmins = useCallback(async (backendUrl: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl.replace(/\/$/, '')}/api/data/server/admins`, {
        headers: authHeaders(),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setAdmins(json.admins ?? []);
    } catch {
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { admins, loading, fetchAdmins };
}
