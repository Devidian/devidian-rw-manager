import { ServerConfig } from '@/types/server';

const LOCAL_STORAGE_KEY = 'risingworld_servers';

// ─── Interface ──────────────────────────────────────────────────────────────

export interface StorageAdapter {
  getServers(): Promise<ServerConfig[]>;
  addServer(data: Omit<ServerConfig, 'id' | 'createdAt'>): Promise<ServerConfig>;
  deleteServer(id: string): Promise<void>;
}

// ─── Local Storage Adapter ───────────────────────────────────────────────────

export class LocalStorageAdapter implements StorageAdapter {
  async getServers(): Promise<ServerConfig[]> {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as ServerConfig[];
    } catch {
      return [];
    }
  }

  async addServer(data: Omit<ServerConfig, 'id' | 'createdAt'>): Promise<ServerConfig> {
    const servers = await this.getServers();
    const newServer: ServerConfig = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([...servers, newServer]));
    return newServer;
  }

  async deleteServer(id: string): Promise<void> {
    const servers = await this.getServers();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(servers.filter(s => s.id !== id)));
  }
}

// ─── Backend Storage Adapter ─────────────────────────────────────────────────

export class BackendStorageAdapter implements StorageAdapter {
  constructor(private readonly baseUrl: string) {}

  private get base() {
    return this.baseUrl.replace(/\/$/, '');
  }

  async getServers(): Promise<ServerConfig[]> {
    const res = await fetch(`${this.base}/api/server`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`Backend returned HTTP ${res.status}`);
    return res.json();
  }

  async addServer(data: Omit<ServerConfig, 'id' | 'createdAt'>): Promise<ServerConfig> {
    const res = await fetch(`${this.base}/api/server`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Backend returned HTTP ${res.status}`);
    return res.json();
  }

  async deleteServer(id: string): Promise<void> {
    const res = await fetch(`${this.base}/api/server/${id}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok && res.status !== 204) throw new Error(`Backend returned HTTP ${res.status}`);
  }
}

// ─── Backend Health Check ────────────────────────────────────────────────────

export type BackendCheckResult =
  | { ok: true }
  | { ok: false; reason: 'unreachable' | 'invalid-response' | 'missing-service' };

export async function checkBackend(url: string, requiredService: string): Promise<BackendCheckResult> {
  const base = url.replace(/\/$/, '');
  try {
    const res = await fetch(`${base}/`, { signal: AbortSignal.timeout(8_000) });
    let json: unknown;
    try {
      json = await res.json();
    } catch {
      return { ok: false, reason: 'invalid-response' };
    }
    if (
      typeof json !== 'object' ||
      json === null ||
      (json as Record<string, unknown>).ok !== true
    ) {
      return { ok: false, reason: 'invalid-response' };
    }
    const services = (json as Record<string, unknown>).services;
    if (!Array.isArray(services) || !services.includes(requiredService)) {
      return { ok: false, reason: 'missing-service' };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: 'unreachable' };
  }
}
