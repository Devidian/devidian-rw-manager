import { useCallback, useEffect, useState } from 'react';
import { TOKEN_KEY } from '@/lib/authApi';
import type {
  MapClaim,
  MapGpsMarker,
  MapLayerCapabilities,
  MapMarketplaceOffer,
  MapPlayer,
} from '@/types/adminMapping';
import type { ServerPlayerListPlayer } from '@/types/server';

export function useMapLayers(
  backendUrl: string,
  serverId: string,
  worldKey: string,
  onlinePlayers: ServerPlayerListPlayer[],
) {
  const [capabilities, setCapabilities] = useState<MapLayerCapabilities | null>(null);
  const [claims, setClaims] = useState<MapClaim[]>([]);
  const [players, setPlayers] = useState<MapPlayer[]>([]);
  const [gpsGlobalMarkers, setGpsGlobalMarkers] = useState<MapGpsMarker[]>([]);
  const [error, setError] = useState(false);

  const refreshClaims = useCallback(async () => {
    const controller = new AbortController();
    const base = backendUrl.replace(/\/$/, '');
    const serverBase = `${base}/api/storage/server/${encodeURIComponent(serverId)}`;
    try {
      setClaims(await request(`${serverBase}/map/layers/claims`, controller.signal).then(parseClaims));
    } catch (requestError) {
      if (!aborted(requestError)) setError(true);
    }
  }, [backendUrl, serverId]);

  useEffect(() => {
    const controller = new AbortController();
    const base = backendUrl.replace(/\/$/, '');
    const serverBase = `${base}/api/storage/server/${encodeURIComponent(serverId)}`;
    setCapabilities(null);
    setClaims([]);
    setPlayers([]);
    setGpsGlobalMarkers([]);
    setError(false);

    request(`${serverBase}/map/layers`, controller.signal)
      .then(parseCapabilities)
      .then((value) => {
        setCapabilities(value);
        if (value.claims) {
          request(`${serverBase}/map/layers/claims`, controller.signal)
            .then(parseClaims)
            .then(setClaims)
            .catch((requestError) => {
              if (!aborted(requestError)) setError(true);
            });
        }
        if (value.gpsGlobalMarkers) {
          request(`${serverBase}/map/layers/gps-global-markers`, controller.signal)
            .then(parseGpsGlobalMarkers)
            .then(setGpsGlobalMarkers)
            .catch((requestError) => {
              if (!aborted(requestError)) setError(true);
            });
        }
      })
      .catch((requestError) => {
        if (!aborted(requestError)) setError(true);
      });
    return () => controller.abort();
  }, [backendUrl, serverId, worldKey]);

  useEffect(() => {
    if (!capabilities?.players) return;
    const controller = new AbortController();
    const base = backendUrl.replace(/\/$/, '');
    const serverBase = `${base}/api/storage/server/${encodeURIComponent(serverId)}`;
    const load = () => Promise.all([
      request(
        `${serverBase}/map/layers/players`,
        controller.signal,
        true,
      ).then(parsePlayers),
      request(`${serverBase}/player`, controller.signal).then(parseDatabasePlayers),
    ]).then(([layerPlayers, databasePlayers]) => {
      setPlayers(mergeOnlinePlayers(layerPlayers, databasePlayers, onlinePlayers));
    }).catch((requestError) => {
      if (!aborted(requestError)) setError(true);
    });
    void load();
    const interval = window.setInterval(load, 60_000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [backendUrl, capabilities?.players, onlinePlayers, serverId, worldKey]);

  return { capabilities, claims, players, gpsGlobalMarkers, error, refreshClaims };
}

export async function fetchMarketplaceOffers(
  backendUrl: string,
  serverId: string,
  areaId: number,
  signal?: AbortSignal,
): Promise<MapMarketplaceOffer[]> {
  const base = backendUrl.replace(/\/$/, '');
  return parseOffers(await request(
    `${base}/api/storage/server/${encodeURIComponent(serverId)}/map/layers/marketplaces/${areaId}/offers`,
    signal,
  ));
}

export function parseCapabilities(value: unknown): MapLayerCapabilities {
  if (!record(value) ||
    value.schemaVersion !== 1 ||
    typeof value.worldName !== 'string' ||
    value.sectorSizeChunks !== 256 ||
    value.chunkSizeBlocks !== 32 ||
    value.sectorSizeBlocks !== 8192 ||
    !positiveInteger(value.recentPlayerDays) ||
    !booleans(value, [
      'claims', 'claimSales', 'renewZones', 'marketplace', 'shop', 'players', 'gpsGlobalMarkers',
    ])
  ) throw new Error('Invalid map layer capabilities');
  return value as unknown as MapLayerCapabilities;
}

export function parseClaims(value: unknown): MapClaim[] {
  if (!record(value) || value.schemaVersion !== 1 || typeof value.available !== 'boolean' ||
    !Array.isArray(value.items) || !value.items.every(isClaim)) {
    throw new Error('Invalid map claims response');
  }
  return value.available ? value.items : [];
}

export function parsePlayers(value: unknown): MapPlayer[] {
  if (!record(value) || value.schemaVersion !== 1 || typeof value.available !== 'boolean' ||
    !positiveInteger(value.recentPlayerDays) ||
    !Array.isArray(value.items) || !value.items.every(isPlayer)) {
    throw new Error('Invalid map players response');
  }
  return value.available ? value.items : [];
}

export function parseGpsGlobalMarkers(value: unknown): MapGpsMarker[] {
  if (!record(value) || value.schemaVersion !== 1 || typeof value.available !== 'boolean' ||
    !Array.isArray(value.items) || !value.items.every(isGpsMarker)) {
    throw new Error('Invalid GPS marker response');
  }
  return value.available ? value.items : [];
}

export function mergeOnlinePlayers(
  layerPlayers: MapPlayer[],
  databasePlayers: DatabaseMapPlayer[],
  onlinePlayers: ServerPlayerListPlayer[],
): MapPlayer[] {
  const onlineUids = new Set(onlinePlayers.map((player) => normalizeUid(player.uid)));
  const merged = new Map(layerPlayers.map((player) => [normalizeUid(player.id), player]));
  for (const player of databasePlayers) {
    const uid = normalizeUid(player.uid);
    if (!onlineUids.has(uid)) continue;
    merged.set(uid, {
      id: player.uid,
      name: player.name,
      x: player.posx,
      z: player.posz,
      state: 'online',
      lastSeen: new Date(player.lastseen * 1000).toISOString(),
    });
  }
  return [...merged.values()];
}

export function parseOffers(value: unknown): MapMarketplaceOffer[] {
  if (!record(value) || value.schemaVersion !== 1 || typeof value.available !== 'boolean' ||
    !positiveInteger(value.areaId) ||
    !Array.isArray(value.items) || !value.items.every(isOffer)) {
    throw new Error('Invalid marketplace offers response');
  }
  return value.available ? value.items : [];
}

async function request(url: string, signal?: AbortSignal, authenticated = false): Promise<unknown> {
  const headers: HeadersInit = {};
  if (authenticated) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(url, { signal, headers });
  if (!response.ok) throw new Error(`Map layer request failed: ${response.status}`);
  return response.json();
}

function isClaim(value: unknown): value is MapClaim {
  return record(value) &&
    positiveInteger(value.areaId) &&
    typeof value.name === 'string' &&
    typeof value.permission === 'string' &&
    integers(value, ['minX', 'minZ', 'width', 'depth']) &&
    (value.width as number) > 0 &&
    (value.depth as number) > 0 &&
    (value.ownerName === undefined || typeof value.ownerName === 'string') &&
    (value.createdAt === undefined || dateString(value.createdAt)) &&
    color(value.borderColor) &&
    color(value.fillColor) &&
    typeof value.forSale === 'boolean' &&
    (value.salePrice === undefined || positiveInteger(value.salePrice)) &&
    typeof value.renewZone === 'boolean' &&
    (value.nextRenewalAt === undefined || dateString(value.nextRenewalAt)) &&
    typeof value.marketplace === 'boolean' &&
    typeof value.shop === 'boolean';
}

function isPlayer(value: unknown): value is MapPlayer {
  return record(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.x === 'number' && Number.isFinite(value.x) &&
    typeof value.z === 'number' && Number.isFinite(value.z) &&
    ['online', 'recent-offline', 'long-term-offline'].includes(String(value.state)) &&
    dateString(value.lastSeen);
}

function isGpsMarker(value: unknown): value is MapGpsMarker {
  return record(value) &&
    positiveInteger(value.id) &&
    typeof value.name === 'string' &&
    typeof value.x === 'number' && Number.isFinite(value.x) &&
    typeof value.y === 'number' && Number.isFinite(value.y) &&
    typeof value.z === 'number' && Number.isFinite(value.z) &&
    typeof value.icon === 'string' &&
    color(value.color) &&
    dateString(value.createdAt);
}

function isOffer(value: unknown): value is MapMarketplaceOffer {
  return record(value) &&
    positiveInteger(value.id) &&
    typeof value.itemName === 'string' &&
    Number.isInteger(value.itemVariant) &&
    positiveInteger(value.amount) &&
    positiveInteger(value.price) &&
    typeof value.currency === 'string' &&
    typeof value.sellerName === 'string' &&
    dateString(value.createdAt);
}

interface DatabaseMapPlayer {
  uid: string;
  name: string;
  posx: number;
  posz: number;
  lastseen: number;
}

function parseDatabasePlayers(value: unknown): DatabaseMapPlayer[] {
  if (!record(value) || !Array.isArray(value.items)) {
    throw new Error('Invalid database players response');
  }
  return value.items.flatMap((item): DatabaseMapPlayer[] => {
    if (!record(item) ||
      typeof item.uid !== 'string' ||
      typeof item.name !== 'string' ||
      typeof item.posx !== 'number' || !Number.isFinite(item.posx) ||
      typeof item.posz !== 'number' || !Number.isFinite(item.posz) ||
      !Number.isSafeInteger(item.lastseen) || (item.lastseen as number) < 0
    ) return [];
    return [{
      uid: item.uid,
      name: item.name,
      posx: item.posx,
      posz: item.posz,
      lastseen: item.lastseen,
    }];
  });
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function positiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

function integers(value: Record<string, unknown>, keys: string[]): boolean {
  return keys.every((key) => Number.isSafeInteger(value[key]));
}

function booleans(value: Record<string, unknown>, keys: string[]): boolean {
  return keys.every((key) => typeof value[key] === 'boolean');
}

function color(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9A-F]{8}$/i.test(value);
}

function dateString(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function aborted(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function normalizeUid(value: string): string {
  return value.trim().toLowerCase();
}
