export interface MapBounds {
  minX: number;
  minZ: number;
  maxX: number;
  maxZ: number;
}

export interface MapMetadata {
  schemaVersion: 5;
  worldKey: string;
  worldName: string;
  tileSize: number;
  chunkSize: number;
  pixelsPerBlock: number;
  nativeTileSizeChunks: number;
  minZoom: number;
  nativeZoom: number;
  generatedChunkBounds: MapBounds;
  generatedTileBounds: MapBounds;
  updatedAt: string;
  tileUrl: string;
}

export type ServerMapResponse =
  | { available: false }
  | { available: true; metadata: MapMetadata };

export interface PluginInfo {
  directory: string;
  name?: string;
  version?: string;
  valid: boolean;
}

export interface ServerPluginsResponse {
  items: PluginInfo[];
}
