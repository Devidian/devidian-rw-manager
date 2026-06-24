import { AuthUser, ServerConfig } from '@/types/server';
import { authHeaders, TOKEN_KEY } from './authApi';

const LOCAL_STORAGE_KEY = 'risingworld_servers';
const LOCAL_PINNED_SERVERS_KEY = 'risingworld_pinned_servers';

function readLocalPinnedServers(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_PINNED_SERVERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function writeLocalPinnedServers(ids: string[]): void {
  localStorage.setItem(LOCAL_PINNED_SERVERS_KEY, JSON.stringify(ids));
}

export function clearLocalPinnedServers(): void {
  localStorage.removeItem(LOCAL_PINNED_SERVERS_KEY);
}


// ─── Interface ──────────────────────────────────────────────────────────────

export interface StorageAdapter {
  getServers(): Promise<ServerConfig[]>;
  addServer(data: Omit<ServerConfig, 'id' | 'createdAt'>): Promise<ServerConfig>;
  updateServer(id: string, data: Partial<Pick<ServerConfig, 'label' | 'backendUrl' | 'public'>>): Promise<ServerConfig>;
  deleteServer(id: string): Promise<void>;
  getPinnedServers(): Promise<string[]>;
  pinServer(id: string): Promise<AuthUser | null>;
  unpinServer(id: string): Promise<AuthUser | null>;
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

  async updateServer(id: string, data: Partial<Pick<ServerConfig, 'label' | 'backendUrl' | 'public'>>): Promise<ServerConfig> {
    const servers = await this.getServers();
    const idx = servers.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Server not found');
    const updated = { ...servers[idx], ...data };
    servers[idx] = updated;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(servers));
    return updated;
  }

  async deleteServer(id: string): Promise<void> {
    const servers = await this.getServers();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(servers.filter(s => s.id !== id)));
  }

  async getPinnedServers(): Promise<string[]> {
    return readLocalPinnedServers();
  }

  async pinServer(id: string): Promise<AuthUser | null> {
    const pinned = new Set(await this.getPinnedServers());
    pinned.add(id);
    writeLocalPinnedServers([...pinned]);
    return null;
  }

  async unpinServer(id: string): Promise<AuthUser | null> {
    const pinned = new Set(await this.getPinnedServers());
    pinned.delete(id);
    writeLocalPinnedServers([...pinned]);
    return null;
  }
}

// ─── Backend Storage Adapter ─────────────────────────────────────────────────

export class BackendStorageAdapter implements StorageAdapter {
  constructor(private readonly baseUrl: string) {}

  private get base() {
    return this.baseUrl.replace(/\/$/, '');
  }

  async getServers(): Promise<ServerConfig[]> {
    const res = await fetch(`${this.base}/api/storage/server`, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Backend returned HTTP ${res.status}`);
    return res.json().then(json => json.servers as ServerConfig[]);
  }

  async addServer(data: Omit<ServerConfig, 'id' | 'createdAt'>): Promise<ServerConfig> {
    const res = await fetch(`${this.base}/api/storage/server`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Backend returned HTTP ${res.status}`);
    return res.json().then(json => json.server as ServerConfig);
  }

  async updateServer(id: string, data: Partial<Pick<ServerConfig, 'label' | 'backendUrl' | 'public'>>): Promise<ServerConfig> {
    const res = await fetch(`${this.base}/api/storage/server/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Backend returned HTTP ${res.status}`);
    return res.json().then(json => json.server as ServerConfig);
  }

  async deleteServer(id: string): Promise<void> {
    const res = await fetch(`${this.base}/api/storage/server/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok && res.status !== 204) throw new Error(`Backend returned HTTP ${res.status}`);
  }

  async getPinnedServers(): Promise<string[]> {
    return readLocalPinnedServers();
  }

  async pinServer(id: string): Promise<AuthUser | null> {
    if (!localStorage.getItem(TOKEN_KEY)) {
      const pinned = new Set(readLocalPinnedServers());
      pinned.add(id);
      writeLocalPinnedServers([...pinned]);
      return null;
    }
    const res = await fetch(`${this.base}/api/storage/server/${id}/pin`, {
      method: 'POST',
      headers: authHeaders(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Backend returned HTTP ${res.status}`);
    return res.json().then(json => json.user as AuthUser);
  }

  async unpinServer(id: string): Promise<AuthUser | null> {
    if (!localStorage.getItem(TOKEN_KEY)) {
      const pinned = new Set(readLocalPinnedServers());
      pinned.delete(id);
      writeLocalPinnedServers([...pinned]);
      return null;
    }
    const res = await fetch(`${this.base}/api/storage/server/${id}/pin`, {
      method: 'DELETE',
      headers: authHeaders(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Backend returned HTTP ${res.status}`);
    return res.json().then(json => json.user as AuthUser);
  }
}

// ─── Backend Health Check ────────────────────────────────────────────────────

export type BackendCheckResult =
  | { ok: true; version?: number; services: string[] }
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
    const version = (json as Record<string, unknown>).version;
    return { ok: true, version: typeof version === 'number' ? version : undefined, services };
  } catch {
    return { ok: false, reason: 'unreachable' };
  }
}
