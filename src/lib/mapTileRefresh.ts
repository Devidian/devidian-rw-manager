export const MAP_TILE_REFRESH_MIN_INTERVAL_MS = 10_000;

export function tileRefreshDelay(lastRefreshAt: number, now: number): number {
  return Math.max(0, lastRefreshAt + MAP_TILE_REFRESH_MIN_INTERVAL_MS - now);
}

export function tileUrlWithRefreshRevision(url: string, refreshRevision: number): string {
  if (!refreshRevision) return url;
  const [path, fragment] = url.split('#', 2);
  return `${path}${path.includes('?') ? '&' : '?'}rw-map-refresh=${encodeURIComponent(String(refreshRevision))}${fragment ? `#${fragment}` : ''}`;
}
