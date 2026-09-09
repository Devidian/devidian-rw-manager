export function tileUrlWithRefreshRevision(url: string, refreshRevision: number): string {
  if (!refreshRevision) return url;
  const [path, fragment] = url.split('#', 2);
  return `${path}${path.includes('?') ? '&' : '?'}rw-map-refresh=${encodeURIComponent(String(refreshRevision))}${fragment ? `#${fragment}` : ''}`;
}
