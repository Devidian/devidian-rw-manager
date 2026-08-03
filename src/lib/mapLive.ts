export const MAP_LIVE_LAYERS = [
  'capabilities',
  'claims',
  'players',
  'gpsGlobalMarkers',
  'marketplaceOffers',
] as const;

export type MapLiveLayer = typeof MAP_LIVE_LAYERS[number];

export interface MapLayersChangedMessage {
  type: 'map.layers.changed';
  schemaVersion: 1;
  serverId: string;
  sequence: number;
  generatedAt: string;
  layers: MapLiveLayer[];
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
    !item.layers.every((layer) => MAP_LIVE_LAYERS.includes(layer as MapLiveLayer))
  ) return null;
  return item as unknown as MapLayersChangedMessage;
}
