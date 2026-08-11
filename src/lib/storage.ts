import { AuthUser, GlobalStatisticsPayload, ServerConfig, ServerLiveStatusPayload, ServerStatisticsPayload } from '@/types/server';
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
  refreshServers(): Promise<ServerConfig[]>;
  addServer(data: Omit<ServerConfig, 'id' | 'createdAt'>): Promise<ServerConfig>;
  updateServer(id: string, data: Partial<Pick<ServerConfig, 'label' | 'backendUrl' | 'public'>>): Promise<ServerConfig>;
  deleteServer(id: string): Promise<void>;
  getPinnedServers(): Promise<string[]>;
  pinServer(id: string): Promise<AuthUser | null>;
  unpinServer(id: string): Promise<AuthUser | null>;
  setServerBlocked(id: string, blocked: boolean): Promise<ServerConfig>;
  getServerLiveStatus(server: ServerConfig): Promise<ServerLiveStatusPayload>;
  getServerStatistics(server: ServerConfig, range?: { from?: string; to?: string }): Promise<ServerStatisticsPayload>;
  getGlobalStatistics(range?: { from?: string; to?: string }): Promise<GlobalStatisticsPayload>;
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

  async refreshServers(): Promise<ServerConfig[]> {
    return this.getServers();
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

  async setServerBlocked(id: string, blocked: boolean): Promise<ServerConfig> {
    const servers = await this.getServers();
    const idx = servers.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Server not found');
    const updated = {
      ...servers[idx],
      blocked,
      blockedAt: blocked ? new Date().toISOString() : undefined,
    };
    servers[idx] = updated;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(servers));
    return updated;
  }

  async getServerLiveStatus(server: ServerConfig): Promise<ServerLiveStatusPayload> {
    const base = server.queryUrl.endsWith('/') ? server.queryUrl : server.queryUrl + '/';
    const [query, info, playerlist] = await Promise.allSettled([
      fetchLocalJson(base),
      fetchLocalJson(base + 'info'),
      fetchLocalJson(base + 'playerlist'),
    ]);
    const queryResult = query.status === 'fulfilled' ? query.value : { ok: false as const, error: 'Failed' };
    const infoResult = info.status === 'fulfilled' ? info.value : { ok: false as const, error: 'Failed' };
    const playerlistResult = playerlist.status === 'fulfilled' ? playerlist.value : { ok: false as const, error: 'Failed' };

    return {
      status: queryResult.ok ? 'online' : 'offline',
      queryData: queryResult.ok ? queryResult.data as ServerLiveStatusPayload['queryData'] : undefined,
      infoData: infoResult.ok ? infoResult.data as ServerLiveStatusPayload['infoData'] : undefined,
      onlinePlayers: playerlistResult.ok ? playersFromPayload(playerlistResult.data) : undefined,
      lastChecked: new Date().toISOString(),
      errorMessage: queryResult.ok ? undefined : (queryResult as { error: string }).error,
    };
  }

  async getServerStatistics(server: ServerConfig): Promise<ServerStatisticsPayload> {
    return {
      serverId: server.id,
      buckets: [],
    };
  }

  async getGlobalStatistics(): Promise<GlobalStatisticsPayload> {
    return {
      buckets: [],
      players: [],
    };
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

  async refreshServers(): Promise<ServerConfig[]> {
    if (localStorage.getItem(TOKEN_KEY)) {
      const res = await fetch(`${this.base}/api/storage/server/refresh-query-data`, {
        method: 'POST',
        headers: authHeaders(),
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok && res.status !== 403) throw new Error(`Backend returned HTTP ${res.status}`);
    }
    return this.getServers();
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

  async setServerBlocked(id: string, blocked: boolean): Promise<ServerConfig> {
    const res = await fetch(`${this.base}/api/storage/server/${id}/blocked`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ blocked }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Backend returned HTTP ${res.status}`);
    return res.json().then(json => json.server as ServerConfig);
  }

  async getServerLiveStatus(server: ServerConfig): Promise<ServerLiveStatusPayload> {
    const res = await fetch(`${this.base}/api/storage/server/${server.id}/live`, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Backend returned HTTP ${res.status}`);
    return res.json() as Promise<ServerLiveStatusPayload>;
  }

  async getServerStatistics(server: ServerConfig, range: { from?: string; to?: string } = {}): Promise<ServerStatisticsPayload> {
    const params = new URLSearchParams();
    if (range.from) params.set('from', range.from);
    if (range.to) params.set('to', range.to);
    const query = params.toString();
    const res = await fetch(`${this.base}/api/storage/server/${server.id}/statistics${query ? `?${query}` : ''}`, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Backend returned HTTP ${res.status}`);
    return res.json() as Promise<ServerStatisticsPayload>;
  }

  async getGlobalStatistics(range: { from?: string; to?: string } = {}): Promise<GlobalStatisticsPayload> {
    const params = new URLSearchParams();
    if (range.from) params.set('from', range.from);
    if (range.to) params.set('to', range.to);
    const query = params.toString();
    const res = await fetch(`${this.base}/api/storage/statistics${query ? `?${query}` : ''}`, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Backend returned HTTP ${res.status}`);
    return res.json() as Promise<GlobalStatisticsPayload>;
  }
}

// ─── Backend Health Check ────────────────────────────────────────────────────

export type BackendCheckResult =
  | {
      ok: true;
      version?: number;
      services: string[];
      limits?: { maxPinnedServers: number };
    }
  | { ok: false; reason: 'unreachable' | 'invalid-response' | 'missing-service' };

export async function checkBackend(url: string, requiredService: string): Promise<BackendCheckResult> {
  const base = url.replace(/\/$/, '');
  try {
    const res = await fetch(`${base}/api/`, { signal: AbortSignal.timeout(8_000) });
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
    const rawLimits = (json as Record<string, unknown>).limits;
    const maxPinnedServers = rawLimits && typeof rawLimits === 'object'
      ? (rawLimits as Record<string, unknown>).maxPinnedServers
      : undefined;
    const limits = Number.isSafeInteger(maxPinnedServers) && (maxPinnedServers as number) > 0
      ? { maxPinnedServers: maxPinnedServers as number }
      : undefined;
    return {
      ok: true,
      version: typeof version === 'number' ? version : undefined,
      services,
      ...(limits ? { limits } : {}),
    };
  } catch {
    return { ok: false, reason: 'unreachable' };
  }
}

async function fetchLocalJson(url: string): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };
    return { ok: true, data: await response.json() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function playersFromPayload(payload: unknown): ServerLiveStatusPayload['onlinePlayers'] {
  if (!payload || typeof payload !== 'object') return undefined;
  const players = (payload as { players?: unknown }).players;
  return Array.isArray(players) ? players as ServerLiveStatusPayload['onlinePlayers'] : undefined;
}
