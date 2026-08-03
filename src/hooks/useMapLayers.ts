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
import { useMapLiveSubscription } from '@/hooks/useMapLiveSubscription';
import type {
  MapEntityDelta,
  MapLayersChangedMessage,
  MapMarketplaceAreaDelta,
} from '@/lib/mapLive';
import {
  booleans,
  isMapClaim,
  isMapGpsMarker,
  isMapMarketplaceOffer,
  isMapPlayer,
  positiveInteger,
  record,
} from '@/lib/mapLayerValidation';

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
  const [generalRevision, setGeneralRevision] = useState(0);
  const [playerRevision, setPlayerRevision] = useState(0);
  const [marketplaceOffersDelta, setMarketplaceOffersDelta] = useState<{
    sequence: number;
    areas: MapMarketplaceAreaDelta[];
  } | null>(null);

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

  const handleLiveLayers = useCallback((message: MapLayersChangedMessage) => {
    const { changes, layers } = message;
    if (changes?.capabilities) setCapabilities(changes.capabilities.value);
    if (changes?.claims) setClaims((items) => applyEntityDelta(items, changes.claims!, (item) => item.areaId));
    if (changes?.players) setPlayers((items) => applyEntityDelta(items, changes.players!, (item) => item.id));
    if (changes?.gpsGlobalMarkers) {
      setGpsGlobalMarkers((items) => applyEntityDelta(
        items,
        changes.gpsGlobalMarkers!,
        (item) => item.id,
      ));
    }
    if (changes?.marketplaceOffers) {
      setMarketplaceOffersDelta({ sequence: message.sequence, areas: changes.marketplaceOffers.areas });
    }
    if (layers.some((layer) =>
      (layer === 'claims' || layer === 'capabilities' || layer === 'gpsGlobalMarkers') &&
      !changes?.[layer])) {
      setGeneralRevision((value) => value + 1);
    }
    if (layers.includes('players') && !changes?.players) setPlayerRevision((value) => value + 1);
  }, []);

  const liveSubscribed = useMapLiveSubscription(backendUrl, serverId, handleLiveLayers);

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
  }, [backendUrl, generalRevision, serverId, worldKey]);

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
    const interval = liveSubscribed ? undefined : window.setInterval(load, 30_000);
    return () => {
      controller.abort();
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [backendUrl, capabilities?.players, liveSubscribed, onlinePlayers, playerRevision, serverId, worldKey]);

  return {
    capabilities,
    claims,
    players,
    gpsGlobalMarkers,
    error,
    refreshClaims,
    marketplaceOffersDelta,
  };
}

export function applyEntityDelta<T, TId extends string | number>(
  current: T[],
  delta: MapEntityDelta<T, TId>,
  id: (item: T) => TId,
): T[] {
  const removed = new Set(delta.removedIds);
  const upserted = new Map(delta.upserted.map((item) => [id(item), item]));
  const result = current
    .filter((item) => !removed.has(id(item)))
    .map((item) => upserted.get(id(item)) ?? item);
  const existing = new Set(result.map(id));
  for (const item of delta.upserted) {
    if (!existing.has(id(item))) result.push(item);
  }
  return result;
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
    !Array.isArray(value.items) || !value.items.every(isMapClaim)) {
    throw new Error('Invalid map claims response');
  }
  return value.available ? value.items : [];
}

export function parsePlayers(value: unknown): MapPlayer[] {
  if (!record(value) || value.schemaVersion !== 1 || typeof value.available !== 'boolean' ||
    !positiveInteger(value.recentPlayerDays) ||
    !Array.isArray(value.items) || !value.items.every(isMapPlayer)) {
    throw new Error('Invalid map players response');
  }
  return value.available ? value.items : [];
}

export function parseGpsGlobalMarkers(value: unknown): MapGpsMarker[] {
  if (!record(value) || value.schemaVersion !== 1 || typeof value.available !== 'boolean' ||
    !Array.isArray(value.items) || !value.items.every(isMapGpsMarker)) {
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
    !Array.isArray(value.items) || !value.items.every(isMapMarketplaceOffer)) {
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

function aborted(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function normalizeUid(value: string): string {
  return value.trim().toLowerCase();
}
