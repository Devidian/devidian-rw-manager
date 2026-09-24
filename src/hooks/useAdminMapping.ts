import { useEffect, useState } from 'react';
import type { MapBounds, MapMetadata, PluginInfo, ServerMapResponse, ServerPluginsResponse } from '@/types/adminMapping';
import { authHeaders } from '@/lib/authApi';

export function useAdminMapping(backendUrl?: string, serverId?: string) {
  const [map, setMap] = useState<ServerMapResponse>({ available: false });
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [latestPluginVersions, setLatestPluginVersions] = useState<Record<string, string>>({});
  const [mapLoading, setMapLoading] = useState(!!backendUrl);
  const [pluginsLoading, setPluginsLoading] = useState(!!backendUrl);
  const [mapError, setMapError] = useState(false);
  const [pluginsError, setPluginsError] = useState(false);
  const [pluginsAvailable, setPluginsAvailable] = useState(false);
  const [nativePluginAccess, setNativePluginAccess] = useState<ServerPluginsResponse['nativeAccess']>('unavailable');
  const [admins, setAdmins] = useState<string[]>([]);

  useEffect(() => {
    if (!backendUrl || !serverId) {
      setMap({ available: false });
      setPlugins([]);
      setLatestPluginVersions({});
      setPluginsAvailable(false);
      setNativePluginAccess('unavailable');
      setAdmins([]);
      setMapLoading(false);
      setPluginsLoading(false);
      return;
    }
    const controller = new AbortController();
    const base = backendUrl.replace(/\/$/, '');
    const serverBase = `${base}/api/storage/server/${encodeURIComponent(serverId)}`;
    setMapLoading(true);
    setPluginsLoading(true);
    setMapError(false);
    setPluginsError(false);
    fetch(`${serverBase}/map`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Map request failed');
        setMap(parseMapResponse(await response.json()));
      })
      .catch((requestError) => {
        if ((requestError as Error).name === 'AbortError') return;
        setMap({ available: false });
        setMapError(true);
      })
      .finally(() => setMapLoading(false));
    fetch(`${serverBase}/plugins`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Plugin request failed');
        const pluginResponse = parsePluginsResponse(await response.json());
        setPlugins(pluginResponse.items);
        setLatestPluginVersions(pluginResponse.latestVersions);
        setPluginsAvailable(pluginResponse.available);
        setNativePluginAccess(pluginResponse.nativeAccess);
      })
      .catch((requestError) => {
        if ((requestError as Error).name === 'AbortError') return;
        setPlugins([]);
        setLatestPluginVersions({});
        setPluginsAvailable(false);
        setNativePluginAccess('unavailable');
        setPluginsError(true);
      })
      .finally(() => setPluginsLoading(false));
    fetch(`${serverBase}/admins`, { headers: authHeaders(), signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Admins request failed');
        setAdmins(parseAdminsResponse(await response.json()));
      })
      .catch((requestError) => {
        if ((requestError as Error).name === 'AbortError') return;
        setAdmins([]);
      });
    return () => controller.abort();
  }, [backendUrl, serverId]);

  return { map, plugins, latestPluginVersions, pluginsAvailable, nativePluginAccess, mapLoading, pluginsLoading, mapError, pluginsError, admins };
}

export function parseMapResponse(value: unknown): ServerMapResponse {
  if (!isRecord(value) || typeof value.available !== 'boolean') throw new Error('Invalid map response');
  if (!value.available) return { available: false };
  if (!isMapMetadata(value.metadata)) throw new Error('Invalid map metadata');
  return { available: true, metadata: value.metadata };
}

export function parsePluginsResponse(value: unknown): ServerPluginsResponse {
  if (!isRecord(value) || (value.available !== undefined && typeof value.available !== 'boolean') || !Array.isArray(value.items) || !value.items.every(isPluginInfo) || (value.latestVersions !== undefined && !isVersionMap(value.latestVersions)) || (value.nativeAccess !== undefined && value.nativeAccess !== 'available' && value.nativeAccess !== 'noAccess' && value.nativeAccess !== 'unavailable')) {
    throw new Error('Invalid plugin response');
  }
  return {
    available: value.available === true,
    nativeAccess: value.nativeAccess === undefined ? (value.available === true ? 'available' : 'unavailable') : value.nativeAccess,
    items: value.items,
    latestVersions: value.latestVersions === undefined ? {} : value.latestVersions,
  };
}

function isVersionMap(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((version) => typeof version === 'string');
}

function parseAdminsResponse(value: unknown): string[] {
  if (!isRecord(value) || !Array.isArray(value.admins) || !value.admins.every((admin) => typeof admin === 'string')) {
    throw new Error('Invalid admins response');
  }
  return value.admins;
}

function isMapMetadata(value: unknown): value is MapMetadata {
  if (!isRecord(value)) return false;
  return (value.schemaVersion === 5 || value.schemaVersion === 6) &&
    (value.serverId === undefined || typeof value.serverId === 'string') &&
    (value.displayName === undefined || typeof value.displayName === 'string') &&
    typeof value.worldKey === 'string' &&
    typeof value.worldName === 'string' &&
    positiveInteger(value.tileSize) &&
    positiveInteger(value.chunkSize) &&
    positiveInteger(value.pixelsPerBlock) &&
    positiveInteger(value.nativeTileSizeChunks) &&
    nonNegativeInteger(value.minZoom) &&
    nonNegativeInteger(value.nativeZoom) &&
    value.minZoom <= value.nativeZoom &&
    isBounds(value.generatedChunkBounds) &&
    isBounds(value.generatedTileBounds) &&
    typeof value.updatedAt === 'string' &&
    !Number.isNaN(Date.parse(value.updatedAt)) &&
    typeof value.tileUrl === 'string';
}

function isBounds(value: unknown): value is MapBounds {
  if (!isRecord(value)) return false;
  return Number.isInteger(value.minX) &&
    Number.isInteger(value.minZ) &&
    Number.isInteger(value.maxX) &&
    Number.isInteger(value.maxZ) &&
    (value.minX as number) <= (value.maxX as number) &&
    (value.minZ as number) <= (value.maxZ as number);
}

function isPluginInfo(value: unknown): value is PluginInfo {
  return isRecord(value) &&
    typeof value.valid === 'boolean' &&
    (value.name === undefined || typeof value.name === 'string') &&
    (value.version === undefined || typeof value.version === 'string');
}

function positiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

function nonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}
