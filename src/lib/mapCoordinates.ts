export function leafletYToBackendZ(tileY: number): number {
  return -tileY - 1;
}
