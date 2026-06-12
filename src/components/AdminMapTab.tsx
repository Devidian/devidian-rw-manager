import { CRS, TileLayer, latLngBounds, type Coords } from 'leaflet';
import { useEffect } from 'react';
import { MapContainer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapMetadata } from '@/types/adminMapping';
import { leafletYToBackendZ } from '@/lib/mapCoordinates';
import { useTranslation } from 'react-i18next';

export function AdminMapTab({ backendUrl, metadata }: { backendUrl: string; metadata: MapMetadata }) {
  const { t } = useTranslation();
  const bounds = metadata.generatedTileBounds;
  const mapBounds = latLngBounds(
    [bounds.minZ, bounds.minX],
    [bounds.maxZ + 1, bounds.maxX + 1],
  );
  const tileUrl = `${backendUrl.replace(/\/$/, '')}${metadata.tileUrl}`;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t('mapCaptureHint')}</p>
      <div className="overflow-hidden rounded-lg border border-border">
        <MapContainer
          crs={CRS.Simple}
          bounds={mapBounds}
          minZoom={metadata.minZoom}
          maxZoom={metadata.nativeZoom}
          zoom={metadata.nativeZoom}
          className="h-[65vh] min-h-[420px] w-full bg-muted"
        >
          <SignedZTileLayer
            url={tileUrl}
            tileSize={metadata.tileSize}
            minZoom={metadata.minZoom}
            maxZoom={metadata.nativeZoom}
          />
        </MapContainer>
      </div>
    </div>
  );
}

function SignedZTileLayer({ url, tileSize, minZoom, maxZoom }: {
  url: string;
  tileSize: number;
  minZoom: number;
  maxZoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    const layer = new BackendTileLayer(url, { tileSize, minZoom, maxZoom, noWrap: true });
    layer.addTo(map);
    return () => {
      layer.remove();
    };
  }, [map, maxZoom, minZoom, tileSize, url]);
  return null;
}

class BackendTileLayer extends TileLayer {
  override getTileUrl(coords: Coords): string {
    return super.getTileUrl({ ...coords, y: leafletYToBackendZ(coords.y) });
  }
}
