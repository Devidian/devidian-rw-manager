import { describe, expect, it } from 'vitest';
import {
  areaToMapBounds,
  leafletYToBackendZ,
  playerToMapPosition,
} from '@/lib/mapCoordinates';
import { parseMapResponse, parsePluginsResponse } from '@/hooks/useAdminMapping';
import {
  parseCapabilities,
  parseClaims,
  parseGpsGlobalMarkers,
  parseOffers,
  parsePlayers,
  mergeOnlinePlayers,
} from '@/hooks/useMapLayers';

describe('admin mapping contract', () => {
  it('accepts schema-5 metadata with signed bounds', () => {
    expect(parseMapResponse(mapResponse())).toEqual(mapResponse());
  });

  it('accepts renderer schema-6 metadata with server identity', () => {
    const response = mapResponse({
      schemaVersion: 6,
      serverId: 'server-1',
      displayName: 'Server Map',
      worldKey: 'server-1',
      worldName: 'Server Map',
    });

    expect(parseMapResponse(response)).toEqual(response);
  });

  it('rejects incompatible map and plugin responses', () => {
    expect(() => parseMapResponse(mapResponse({ schemaVersion: 4 }))).toThrow('Invalid map metadata');
    expect(() => parseMapResponse(mapResponse({ nativeTileSizeChunks: 0 }))).toThrow('Invalid map metadata');
    expect(() => parsePluginsResponse({ items: [{ name: 'plugin' }] })).toThrow('Invalid plugin response');
  });

  it('maps Leaflet image Y to signed backend Z coordinates', () => {
    expect(leafletYToBackendZ(-1)).toBe(0);
    expect(leafletYToBackendZ(0)).toBe(-1);
    expect(leafletYToBackendZ(24)).toBe(-25);
  });

  it('accepts valid and invalid plugin inventory entries', () => {
    expect(parsePluginsResponse({
      available: true,
      items: [
        { name: 'OZ Admin Utils', version: '0.7.0', valid: true },
        { name: 'BrokenPlugin', valid: false },
      ],
      latestVersions: {},
    })).toEqual(expect.objectContaining({ available: true, items: expect.any(Array) }));
  });

  it('treats a legacy plugin response without availability as unavailable', () => {
    expect(parsePluginsResponse({ items: [] })).toEqual({ available: false, items: [], latestVersions: {} });
  });

  it('maps block-space areas and players into native tile coordinates', () => {
    expect(areaToMapBounds(
      { minX: -64, minZ: 32, width: 32, depth: 64 },
      64,
    )).toEqual([[0.5, -1], [1.5, -0.5]]);
    expect(playerToMapPosition({ x: -32.5, z: 96.25 }, 64))
      .toEqual([1.50390625, -0.5078125]);
  });

  it('validates map layer contracts', () => {
    expect(parseCapabilities({
      schemaVersion: 1,
      worldName: 'World',
      sectorSizeChunks: 256,
      chunkSizeBlocks: 32,
      sectorSizeBlocks: 8192,
      recentPlayerDays: 7,
      claims: true,
      claimSales: true,
      renewZones: true,
      marketplace: true,
      shop: true,
      players: true,
      gpsGlobalMarkers: true,
      playerHistory: true,
      marketCriers: true,
      shopTraders: true,
    }).sectorSizeBlocks).toBe(8192);
    expect(parseClaims({
      schemaVersion: 1,
      available: true,
      items: [{
        areaId: 1,
        name: 'Claim',
        permission: 'ozlc-guest',
        minX: 0,
        minZ: 0,
        width: 32,
        depth: 32,
        borderColor: '#0010E010',
        fillColor: '#0010E050',
        forSale: false,
        renewZone: true,
        nextRenewalAt: '2026-06-19T00:00:00.000Z',
        marketplace: false,
        shop: false,
      }],
    })).toHaveLength(1);
    expect(parsePlayers({
      schemaVersion: 1,
      available: true,
      recentPlayerDays: 7,
      items: [{
        id: 'uid',
        name: 'Player',
        x: 1.5,
        z: -2.5,
        state: 'online',
        lastSeen: '2026-06-18T00:00:00.000Z',
      }],
    })).toHaveLength(1);
    expect(parseGpsGlobalMarkers({
      schemaVersion: 1,
      available: true,
      items: [{
        id: 2,
        name: 'Spawn',
        x: -32.5,
        y: 64,
        z: 96.25,
        icon: 'global-icon',
        color: '#FFFFFFFF',
        createdAt: '2026-06-18T00:00:00.000Z',
      }],
    })).toHaveLength(1);
    expect(parseOffers({
      schemaVersion: 1,
      available: true,
      areaId: 1,
      items: [{
        id: 2,
        itemName: 'iron_ingot',
        itemVariant: 0,
        amount: 4,
        price: 10,
        currency: 'coins',
        sellerName: 'Seller',
        createdAt: '2026-06-18T00:00:00.000Z',
      }],
    })).toHaveLength(1);
    expect(() => parseCapabilities({ schemaVersion: 1 })).toThrow();
  });

  it('uses the selected server playerlist to classify online map positions', () => {
    expect(mergeOnlinePlayers(
      [{
        id: 'recent',
        name: 'Recent',
        x: 1,
        z: 2,
        state: 'recent-offline',
        lastSeen: '2026-06-18T00:00:00.000Z',
      }],
      [{
        uid: 'ONLINE',
        name: 'Online',
        posx: 3.5,
        posz: -4.5,
        lastseen: 1781740800,
      }],
      [{ id: 1, uid: 'online', name: 'Online', platform: 'Steam', ping: 10 }],
    )).toEqual([
      expect.objectContaining({ id: 'recent', state: 'recent-offline' }),
      expect.objectContaining({ id: 'ONLINE', state: 'online', x: 3.5, z: -4.5 }),
    ]);
  });

  it('keeps live map player state authoritative over database fallback data', () => {
    expect(mergeOnlinePlayers(
      [{
        id: 'online',
        name: 'Live',
        x: 40,
        z: 50,
        state: 'online',
        lastSeen: '2026-08-04T08:00:00.000Z',
      }],
      [{
        uid: 'ONLINE',
        name: 'Persisted',
        posx: 3.5,
        posz: -4.5,
        lastseen: 1781740800,
      }],
      [{ id: 1, uid: 'online', name: 'Query', platform: 'Steam', ping: 10 }],
    )).toEqual([expect.objectContaining({
      id: 'online',
      name: 'Live',
      state: 'online',
      x: 40,
      z: 50,
    })]);
  });
});

function mapResponse(overrides: Record<string, unknown> = {}) {
  return {
    available: true,
    metadata: {
      schemaVersion: 5,
      worldKey: 'new-world',
      worldName: 'New World',
      tileSize: 256,
      chunkSize: 32,
      pixelsPerBlock: 4,
      nativeTileSizeChunks: 2,
      minZoom: 0,
      nativeZoom: 8,
      generatedChunkBounds: { minX: -44, minZ: -50, maxX: -42, maxZ: -48 },
      generatedTileBounds: { minX: -22, minZ: -25, maxX: -21, maxZ: -24 },
      updatedAt: '2026-06-12T00:00:00.000Z',
      tileUrl: 'https://map.example.com/server-1/{z}/{x}/{y}.png',
      ...overrides,
    },
  };
}
