export function leafletYToBackendZ(tileY: number): number {
  return -tileY - 1;
}

export function blockToMapCoordinate(block: number, nativeTileSizeBlocks: number): number {
  return block / nativeTileSizeBlocks;
}

export function areaToMapBounds(
  area: { minX: number; minZ: number; width: number; depth: number },
  nativeTileSizeBlocks: number,
): [[number, number], [number, number]] {
  return [
    [
      blockToMapCoordinate(area.minZ, nativeTileSizeBlocks),
      blockToMapCoordinate(area.minX, nativeTileSizeBlocks),
    ],
    [
      blockToMapCoordinate(area.minZ + area.depth, nativeTileSizeBlocks),
      blockToMapCoordinate(area.minX + area.width, nativeTileSizeBlocks),
    ],
  ];
}

export function playerToMapPosition(
  player: { x: number; z: number },
  nativeTileSizeBlocks: number,
): [number, number] {
  return [
    blockToMapCoordinate(player.z, nativeTileSizeBlocks),
    blockToMapCoordinate(player.x, nativeTileSizeBlocks),
  ];
}

export function mapPositionToWorldCoordinates(
  position: { lat: number; lng: number },
  nativeTileSizeBlocks: number,
): { x: number; z: number } {
  return {
    x: Math.round(position.lng * nativeTileSizeBlocks),
    z: Math.round(position.lat * nativeTileSizeBlocks),
  };
}

export function formatWorldCoordinates(coordinates: { x: number; z: number }): string {
  return `X: ${coordinates.x}, Z: ${coordinates.z}`;
}
