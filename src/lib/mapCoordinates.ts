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
