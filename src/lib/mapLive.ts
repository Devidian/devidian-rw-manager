import type {
  MapClaim,
  MapGpsMarker,
  MapLayerCapabilities,
  MapMarketplaceOffer,
  MapPlayer,
} from '@/types/adminMapping';
import {
  booleans,
  isMapClaim,
  isMapGpsMarker,
  isMapMarketplaceOffer,
  isMapPlayer,
  positiveInteger,
  record,
} from '@/lib/mapLayerValidation';

export const MAP_LIVE_LAYERS = [
  'capabilities',
  'claims',
  'players',
  'gpsGlobalMarkers',
  'marketplaceOffers',
] as const;

export type MapLiveLayer = typeof MAP_LIVE_LAYERS[number];

export interface MapEntityDelta<T, TId extends string | number> {
  upserted: T[];
  removedIds: TId[];
}

export interface MapMarketplaceAreaDelta extends MapEntityDelta<MapMarketplaceOffer, number> {
  areaId: number;
}

export interface MapLiveChanges {
  capabilities?: { value: MapLayerCapabilities };
  claims?: MapEntityDelta<MapClaim, number>;
  players?: MapEntityDelta<MapPlayer, string>;
  gpsGlobalMarkers?: MapEntityDelta<MapGpsMarker, number>;
  marketplaceOffers?: { areas: MapMarketplaceAreaDelta[] };
}

export interface MapLayersChangedMessage {
  type: 'map.layers.changed';
  schemaVersion: 1;
  serverId: string;
  sequence: number;
  generatedAt: string;
  layers: MapLiveLayer[];
  changes?: MapLiveChanges;
}

export function getMapLiveWebSocketUrl(backendUrl: string): string {
  const base = backendUrl.replace(/\/$/, '');
  const url = new URL(`${base}/api/storage/map-live`, window.location.href);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

export function parseMapLayersChangedMessage(
  value: unknown,
  selectedServerId: string,
): MapLayersChangedMessage | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  if (
    item.type !== 'map.layers.changed' ||
    item.schemaVersion !== 1 ||
    item.serverId !== selectedServerId ||
    !Number.isSafeInteger(item.sequence) ||
    (item.sequence as number) <= 0 ||
    typeof item.generatedAt !== 'string' ||
    Number.isNaN(Date.parse(item.generatedAt)) ||
    !Array.isArray(item.layers) ||
    !item.layers.every((layer) => MAP_LIVE_LAYERS.includes(layer as MapLiveLayer)) ||
    (item.changes !== undefined && !validChanges(item.changes, item.layers as MapLiveLayer[]))
  ) return null;
  return item as unknown as MapLayersChangedMessage;
}

export function isMapLiveSubscribedMessage(value: unknown, selectedServerId: string): boolean {
  return record(value) &&
    value.type === 'subscribed' &&
    value.schemaVersion === 1 &&
    value.serverId === selectedServerId;
}

function validChanges(value: unknown, layers: MapLiveLayer[]): value is MapLiveChanges {
  if (!record(value) || Object.keys(value).some((key) => !MAP_LIVE_LAYERS.includes(key as MapLiveLayer))) {
    return false;
  }
  if (Object.keys(value).some((key) => !layers.includes(key as MapLiveLayer))) return false;
  return (value.capabilities === undefined || validCapabilitiesChange(value.capabilities)) &&
    (value.claims === undefined || validEntityDelta(value.claims, isMapClaim, positiveInteger)) &&
    (value.players === undefined || validEntityDelta(
      value.players,
      isMapPlayer,
      (id): id is string => typeof id === 'string' && id.length > 0,
    )) &&
    (value.gpsGlobalMarkers === undefined || validEntityDelta(
      value.gpsGlobalMarkers,
      isMapGpsMarker,
      positiveInteger,
    )) &&
    (value.marketplaceOffers === undefined || validMarketplaceChanges(value.marketplaceOffers));
}

function validCapabilitiesChange(value: unknown): boolean {
  if (!record(value) || !record(value.value)) return false;
  const capabilities = value.value;
  return capabilities.schemaVersion === 1 &&
    typeof capabilities.worldName === 'string' &&
    capabilities.sectorSizeChunks === 256 &&
    capabilities.chunkSizeBlocks === 32 &&
    capabilities.sectorSizeBlocks === 8192 &&
    positiveInteger(capabilities.recentPlayerDays) &&
    booleans(capabilities, [
      'claims', 'claimSales', 'renewZones', 'marketplace', 'shop', 'players', 'gpsGlobalMarkers',
    ]);
}

function validEntityDelta<T, TId extends string | number>(
  value: unknown,
  itemGuard: (item: unknown) => item is T,
  idGuard: (id: unknown) => id is TId,
): value is MapEntityDelta<T, TId> {
  return record(value) &&
    Array.isArray(value.upserted) && value.upserted.every(itemGuard) &&
    Array.isArray(value.removedIds) && value.removedIds.every(idGuard);
}

function validMarketplaceChanges(value: unknown): boolean {
  return record(value) && Array.isArray(value.areas) && value.areas.every((area) =>
    record(area) &&
    positiveInteger(area.areaId) &&
    validEntityDelta(area, isMapMarketplaceOffer, positiveInteger));
}
