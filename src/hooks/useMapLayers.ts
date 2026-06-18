import { useEffect, useState } from 'react';
import { TOKEN_KEY } from '@/lib/authApi';
import type {
  MapClaim,
  MapLayerCapabilities,
  MapMarketplaceOffer,
  MapPlayer,
} from '@/types/adminMapping';

export function useMapLayers(backendUrl: string, worldKey: string) {
  const [capabilities, setCapabilities] = useState<MapLayerCapabilities | null>(null);
  const [claims, setClaims] = useState<MapClaim[]>([]);
  const [players, setPlayers] = useState<MapPlayer[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const base = backendUrl.replace(/\/$/, '');
    setCapabilities(null);
    setClaims([]);
    setPlayers([]);
    setError(false);

    request(`${base}/api/data/server/map/layers`, controller.signal)
      .then(parseCapabilities)
      .then((value) => {
        setCapabilities(value);
        if (value.claims) {
          request(`${base}/api/data/server/map/layers/claims`, controller.signal)
            .then(parseClaims)
            .then(setClaims)
            .catch((requestError) => {
              if (!aborted(requestError)) setError(true);
            });
        }
      })
      .catch((requestError) => {
        if (!aborted(requestError)) setError(true);
      });
    return () => controller.abort();
  }, [backendUrl, worldKey]);

  useEffect(() => {
    if (!capabilities?.players) return;
    const controller = new AbortController();
    const base = backendUrl.replace(/\/$/, '');
    const load = () => request(
      `${base}/api/data/server/map/layers/players`,
      controller.signal,
      true,
    ).then(parsePlayers).then(setPlayers).catch((requestError) => {
      if (!aborted(requestError)) setError(true);
    });
    void load();
    const interval = window.setInterval(load, 60_000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [backendUrl, capabilities?.players, worldKey]);

  return { capabilities, claims, players, error };
}

export async function fetchMarketplaceOffers(
  backendUrl: string,
  areaId: number,
  signal?: AbortSignal,
): Promise<MapMarketplaceOffer[]> {
  const base = backendUrl.replace(/\/$/, '');
  return parseOffers(await request(
    `${base}/api/data/server/map/layers/marketplaces/${areaId}/offers`,
    signal,
  ));
}

export function parseCapabilities(value: unknown): MapLayerCapabilities {
  if (!record(value) ||
    value.schemaVersion !== 1 ||
    typeof value.worldName !== 'string' ||
    value.sectorSizeChunks !== 32 ||
    value.chunkSizeBlocks !== 32 ||
    value.sectorSizeBlocks !== 1024 ||
    !positiveInteger(value.recentPlayerDays) ||
    !booleans(value, ['claims', 'claimSales', 'marketplace', 'shop', 'players', 'onlinePlayers'])
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
