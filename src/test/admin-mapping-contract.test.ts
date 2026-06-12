import { describe, expect, it } from 'vitest';
import { leafletYToBackendZ } from '@/lib/mapCoordinates';
import { parseMapResponse, parsePluginsResponse } from '@/hooks/useAdminMapping';

describe('admin mapping contract', () => {
  it('accepts schema-5 metadata with signed bounds', () => {
    expect(parseMapResponse(mapResponse())).toEqual(mapResponse());
  });

  it('rejects incompatible map and plugin responses', () => {
    expect(() => parseMapResponse(mapResponse({ schemaVersion: 4 }))).toThrow('Invalid map metadata');
    expect(() => parseMapResponse(mapResponse({ nativeTileSizeChunks: 0 }))).toThrow('Invalid map metadata');
    expect(() => parsePluginsResponse({ items: [{ directory: 'plugin' }] })).toThrow('Invalid plugin response');
  });

  it('maps Leaflet image Y to signed backend Z coordinates', () => {
    expect(leafletYToBackendZ(-1)).toBe(0);
    expect(leafletYToBackendZ(0)).toBe(-1);
    expect(leafletYToBackendZ(24)).toBe(-25);
  });

  it('accepts valid and invalid plugin inventory entries', () => {
    expect(parsePluginsResponse({
      items: [
        { directory: 'OZAdminUtils', name: 'OZ Admin Utils', version: '0.7.0', valid: true },
        { directory: 'BrokenPlugin', valid: false },
      ],
    })).toHaveLength(2);
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
      tileUrl: '/api/data/server/map/tiles/new-world/{z}/{x}/{y}.png',
      ...overrides,
    },
  };
}
