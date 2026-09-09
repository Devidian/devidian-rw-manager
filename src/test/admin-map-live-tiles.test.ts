import { describe, expect, it } from 'vitest';
import { isOnlinePlayerTile, shouldRefreshOnlinePlayerTiles, tileSignature } from '@/components/AdminMapTab';
import { tileUrlWithRefreshRevision } from '@/lib/mapTileRefresh';

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

  it('does not reload player tiles when automatic reload is disabled', () => {
    expect(shouldRefreshOnlinePlayerTiles(false)).toBe(false);
    expect(shouldRefreshOnlinePlayerTiles(true)).toBe(true);
  });

  it('changes online-player tile URLs on each refresh so the browser performs a request', () => {
    expect(tileUrlWithRefreshRevision('https://map.example/{z}/{x}/{y}.png', 123))
      .toBe('https://map.example/{z}/{x}/{y}.png?rw-map-refresh=123');
    expect(tileUrlWithRefreshRevision('https://map.example/tile.png?style=day#view', 456))
      .toBe('https://map.example/tile.png?style=day&rw-map-refresh=456#view');
  });
});
