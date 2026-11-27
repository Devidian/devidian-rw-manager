import { describe, expect, it } from 'vitest';
import { isOnlinePlayerTile, tileSignature } from '@/components/AdminMapTab';
import { MAP_TILE_REFRESH_MIN_INTERVAL_MS, preloadTileReplacement, tileRefreshDelay, tileUrlWithRefreshRevision } from '@/lib/mapTileRefresh';

describe('online-player tile refresh selection', () => {
  it('selects only the native tile neighborhood around online players', () => {
    const online = [{ x: 12, z: -5 }];
    expect(isOnlinePlayerTile({ x: 13, y: 3, z: 8 }, 8, online)).toBe(true);
    expect(isOnlinePlayerTile({ x: 13, y: 4, z: 8 }, 8, online)).toBe(true);
    expect(isOnlinePlayerTile({ x: 14, y: 3, z: 8 }, 8, online)).toBe(false);
  });

  it('selects the corresponding parent tile at lower zoom levels', () => {
    const online = [{ x: 12, z: -5 }];
    expect(isOnlinePlayerTile({ x: 3, y: 1, z: 6 }, 8, online)).toBe(true);
    expect(isOnlinePlayerTile({ x: 5, y: 1, z: 6 }, 8, online)).toBe(false);
  });

  it('keeps the refresh timer stable while a player moves inside one native tile', () => {
    expect(tileSignature([{ x: 12, z: -5 }])).toBe(tileSignature([{ x: 12, z: -5 }]));
    expect(tileSignature([{ x: 12, z: -5 }])).not.toBe(tileSignature([{ x: 13, z: -5 }]));
  });

  it('changes online-player tile URLs on each refresh so the browser performs a request', () => {
    expect(tileUrlWithRefreshRevision('https://map.example/{z}/{x}/{y}.png', 123))
      .toBe('https://map.example/{z}/{x}/{y}.png?rw-map-refresh=123');
    expect(tileUrlWithRefreshRevision('https://map.example/tile.png?style=day#view', 456))
      .toBe('https://map.example/tile.png?style=day&rw-map-refresh=456#view');
  });

  it('enforces a ten-second minimum interval before any subsequent tile refresh', () => {
    expect(MAP_TILE_REFRESH_MIN_INTERVAL_MS).toBe(10_000);
    expect(tileRefreshDelay(100_000, 100_001)).toBe(9_999);
    expect(tileRefreshDelay(100_000, 110_000)).toBe(0);
    expect(tileRefreshDelay(100_000, 120_000)).toBe(0);
  });

  it('keeps the current tile visible until a newer tile has loaded', () => {
    const tile = document.createElement('img');
    tile.src = 'https://map.example/old.png';
    const replacement = document.createElement('img');

    preloadTileReplacement(tile, 'https://map.example/new.png', replacement);

    expect(tile.src).toBe('https://map.example/old.png');
    expect(replacement.src).toBe('https://map.example/new.png');
    replacement.dispatchEvent(new Event('load'));
    expect(tile.src).toBe('https://map.example/new.png');
  });

  it('does not let a stale preload replace a newer tile refresh', () => {
    const tile = document.createElement('img');
    tile.src = 'https://map.example/old.png';
    const first = document.createElement('img');
    const second = document.createElement('img');
    preloadTileReplacement(tile, 'https://map.example/first.png', first);
    preloadTileReplacement(tile, 'https://map.example/second.png', second);

    first.dispatchEvent(new Event('load'));
    expect(tile.src).toBe('https://map.example/old.png');
    second.dispatchEvent(new Event('load'));
    expect(tile.src).toBe('https://map.example/second.png');
  });
});
