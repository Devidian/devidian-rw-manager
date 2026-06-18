import {
  CRS,
  DivIcon,
  TileLayer,
  latLngBounds,
  type Coords,
  type LatLngBounds,
} from 'leaflet';
import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  Rectangle,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapClaim, MapMetadata, MapPlayer } from '@/types/adminMapping';
import {
  areaToMapBounds,
  leafletYToBackendZ,
  playerToMapPosition,
} from '@/lib/mapCoordinates';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { fetchMarketplaceOffers, useMapLayers } from '@/hooks/useMapLayers';

interface LayerVisibility {
  sectors: boolean;
  claims: boolean;
  online: boolean;
  recent: boolean;
  longTerm: boolean;
}

export function AdminMapTab({
  backendUrl,
  metadata,
  isAdmin = false,
}: {
  backendUrl: string;
  metadata: MapMetadata;
  isAdmin?: boolean;
}) {
  const { t } = useTranslation();
  const { capabilities, claims, players, error } = useMapLayers(backendUrl, metadata.worldKey);
  const [visible, setVisible] = useState<LayerVisibility>({
    sectors: false,
    claims: false,
    online: true,
    recent: false,
    longTerm: false,
  });
  const bounds = metadata.generatedTileBounds;
  const mapBounds = latLngBounds(
    [bounds.minZ, bounds.minX],
    [bounds.maxZ + 1, bounds.maxX + 1],
  );
  const tileUrl = `${backendUrl.replace(/\/$/, '')}${metadata.tileUrl}`;
  const nativeTileSizeBlocks = metadata.chunkSize * metadata.nativeTileSizeChunks;
  const mapIdentity = `${backendUrl}|${metadata.worldKey}|${metadata.nativeZoom}|${metadata.tileSize}`;

  useEffect(() => {
    setVisible({
      sectors: false,
      claims: false,
      online: true,
      recent: false,
      longTerm: false,
    });
  }, [mapIdentity]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t('mapCaptureHint')}</p>
      <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
        <LayerToggle label={t('mapLayerSectors')} checked={visible.sectors}
          onChange={(checked) => setVisible((value) => ({ ...value, sectors: checked }))} />
        <LayerToggle label={t('mapLayerClaims')} checked={visible.claims}
          disabled={!capabilities?.claims}
          onChange={(checked) => setVisible((value) => ({ ...value, claims: checked }))} />
        <LayerToggle label={t('mapLayerOnlinePlayers')}
          checked={visible.online && Boolean(capabilities?.onlinePlayers)}
          disabled={!capabilities?.onlinePlayers}
          onChange={(checked) => setVisible((value) => ({ ...value, online: checked }))} />
        <LayerToggle label={t('mapLayerRecentPlayers')} checked={visible.recent}
          disabled={!capabilities?.players}
          onChange={(checked) => setVisible((value) => ({ ...value, recent: checked }))} />
        {isAdmin && (
          <LayerToggle label={t('mapLayerLongTermPlayers')} checked={visible.longTerm}
            disabled={!capabilities?.players}
            onChange={(checked) => setVisible((value) => ({ ...value, longTerm: checked }))} />
        )}
        {error && <span className="text-destructive">{t('mapLayerError')}</span>}
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <MapContainer
          key={mapIdentity}
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
          {visible.sectors && capabilities && (
            <SectorLayer
              sectorSizeBlocks={capabilities.sectorSizeBlocks}
              nativeTileSizeBlocks={nativeTileSizeBlocks}
            />
          )}
          {visible.claims && (
            <ClaimLayer
              backendUrl={backendUrl}
              claims={claims}
              nativeTileSizeBlocks={nativeTileSizeBlocks}
            />
          )}
          <PlayerLayer
            players={players}
            visible={visible}
            nativeTileSizeBlocks={nativeTileSizeBlocks}
          />
        </MapContainer>
      </div>
    </div>
  );
}

function LayerToggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onChange(value === true)}
      />
      <span className={disabled ? 'text-muted-foreground' : ''}>{label}</span>
    </label>
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

function SectorLayer({
  sectorSizeBlocks,
  nativeTileSizeBlocks,
}: {
  sectorSizeBlocks: number;
  nativeTileSizeBlocks: number;
}) {
  const map = useMapEvents({
    moveend: () => setViewport(map.getBounds()),
    zoomend: () => setViewport(map.getBounds()),
  });
  const [viewport, setViewport] = useState<LatLngBounds>(() => map.getBounds());
  const sectorMapSize = sectorSizeBlocks / nativeTileSizeBlocks;
  const sectors = useMemo(() => {
    const minX = Math.floor(viewport.getWest() / sectorMapSize);
    const maxX = Math.floor(viewport.getEast() / sectorMapSize);
    const minZ = Math.floor(viewport.getSouth() / sectorMapSize);
    const maxZ = Math.floor(viewport.getNorth() / sectorMapSize);
    const result: Array<{ x: number; z: number }> = [];
    for (let x = minX; x <= maxX; x += 1) {
      for (let z = minZ; z <= maxZ; z += 1) result.push({ x, z });
    }
    return result;
  }, [sectorMapSize, viewport]);

  return sectors.map(({ x, z }) => {
    const minX = x * sectorMapSize;
    const minZ = z * sectorMapSize;
    const maxX = minX + sectorMapSize;
    const maxZ = minZ + sectorMapSize;
    return (
      <Fragment key={`${x}|${z}`}>
        <Rectangle
          bounds={[[minZ, minX], [maxZ, maxX]]}
          pathOptions={{ color: '#C0C0C0', opacity: 0.65, weight: 1.5, fill: false }}
        />
        <Marker
          position={[maxZ, minX]}
          interactive={false}
          icon={new DivIcon({
            className: '',
            html: `<span style="color:#c0c0c0;font-size:11px;white-space:nowrap;text-shadow:0 1px 2px #000">${x}|${z}</span>`,
            iconAnchor: [0, 0],
          })}
        />
      </Fragment>
    );
  });
}

function ClaimLayer({
  backendUrl,
  claims,
  nativeTileSizeBlocks,
}: {
  backendUrl: string;
  claims: MapClaim[];
  nativeTileSizeBlocks: number;
}) {
  const { t } = useTranslation();
  const [selectedAreaId, setSelectedAreaId] = useState<number>();
  const [offers, setOffers] = useState<Awaited<ReturnType<typeof fetchMarketplaceOffers>>>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState(false);

  useEffect(() => {
    if (!selectedAreaId) {
      setOffers([]);
      return;
    }
    const claim = claims.find((item) => item.areaId === selectedAreaId);
    if (!claim?.marketplace) {
      setOffers([]);
      return;
    }
    const controller = new AbortController();
    setOffersLoading(true);
    setOffersError(false);
    fetchMarketplaceOffers(backendUrl, selectedAreaId, controller.signal)
      .then(setOffers)
      .catch((error) => {
        if (!(error instanceof Error) || error.name !== 'AbortError') {
          setOffers([]);
          setOffersError(true);
        }
      })
      .finally(() => setOffersLoading(false));
    return () => controller.abort();
  }, [backendUrl, claims, selectedAreaId]);

  return claims.map((claim) => (
    <Rectangle
      key={claim.areaId}
      bounds={areaToMapBounds(claim, nativeTileSizeBlocks)}
      pathOptions={{
        color: claim.borderColor,
        fillColor: claim.fillColor,
        fillOpacity: 1,
        weight: 2,
      }}
      eventHandlers={{ click: () => setSelectedAreaId(claim.areaId) }}
    >
      <Popup>
        <div className="min-w-48 space-y-1">
          <strong>{claim.name}</strong>
          {claim.ownerName && <div>{t('mapClaimOwner')}: {claim.ownerName}</div>}
          {claim.createdAt && (
            <div>{t('mapClaimCreated')}: {new Date(claim.createdAt).toLocaleString()}</div>
          )}
          <div>{claim.width} × {claim.depth}</div>
          {claim.forSale && <div>{t('mapClaimForSale')}: {claim.salePrice}</div>}
          <div className="flex gap-2">
            {claim.marketplace && <span>🏪 {t('mapMarketplace')}</span>}
            {claim.shop && <span>🛒 {t('mapShop')}</span>}
          </div>
          {claim.marketplace && selectedAreaId === claim.areaId && (
            <div className="mt-2 border-t pt-2">
              {offersLoading
                ? t('mapOffersLoading')
                : offersError
                  ? t('mapOffersError')
                  : offers.length === 0
                  ? t('mapNoOffers')
                  : offers.map((offer) => (
                    <div key={offer.id}>
                      {offer.amount}× {offer.itemName} — {offer.price} {offer.currency}
                    </div>
                  ))}
            </div>
          )}
        </div>
      </Popup>
    </Rectangle>
  ));
}

function PlayerLayer({
  players,
  visible,
  nativeTileSizeBlocks,
}: {
  players: MapPlayer[];
  visible: LayerVisibility;
  nativeTileSizeBlocks: number;
}) {
  const { t } = useTranslation();
  return players.filter((player) =>
    player.state === 'online' ? visible.online :
      player.state === 'recent-offline' ? visible.recent :
        visible.longTerm,
  ).map((player) => (
    <CircleMarker
      key={player.id}
      center={playerToMapPosition(player, nativeTileSizeBlocks)}
      radius={5}
      pathOptions={{
        color: player.state === 'online' ? '#22C55E' :
          player.state === 'recent-offline' ? '#EAB308' : '#EF4444',
        fillOpacity: 0.9,
        weight: 1,
      }}
    >
      <Popup>
        <strong>{player.name}</strong>
        <div>{t(`mapPlayerState.${player.state}`)}</div>
        <div>{t('lastSeen')}: {new Date(player.lastSeen).toLocaleString()}</div>
      </Popup>
    </CircleMarker>
  ));
}

class BackendTileLayer extends TileLayer {
  override getTileUrl(coords: Coords): string {
    return super.getTileUrl({ ...coords, y: leafletYToBackendZ(coords.y) });
  }
}
