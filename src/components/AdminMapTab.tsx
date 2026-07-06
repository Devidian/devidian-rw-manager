import {
  Maximize2,
  Minimize2,
  MonitorUp,
  Store,
} from 'lucide-react';
import {
  CRS,
  DivIcon,
  TileLayer,
  latLngBounds,
  type Coords,
  type LatLngBounds,
} from 'leaflet';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
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
import type {
  MapClaim,
  MapGpsMarker,
  MapMarketplaceOffer,
  MapMetadata,
  MapPlayer,
} from '@/types/adminMapping';
import type { ServerPlayerListPlayer } from '@/types/server';
import {
  areaToMapBounds,
  leafletYToBackendZ,
  playerToMapPosition,
} from '@/lib/mapCoordinates';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { fetchMarketplaceOffers, useMapLayers } from '@/hooks/useMapLayers';
import { cn } from '@/lib/utils';

interface LayerVisibility {
  sectors: boolean;
  claims: boolean;
  online: boolean;
  recent: boolean;
  longTerm: boolean;
  gpsGlobalMarkers: boolean;
}

type MapDisplayMode = 'normal' | 'expanded' | 'fullscreen';

export function AdminMapTab({
  apiBaseUrl,
  serverId,
  tileBaseUrl,
  metadata,
  onlinePlayers = [],
  isAdmin = false,
}: {
  apiBaseUrl: string;
  serverId: string;
  tileBaseUrl?: string;
  metadata: MapMetadata;
  onlinePlayers?: ServerPlayerListPlayer[];
  isAdmin?: boolean;
}) {
  const { t } = useTranslation();
  const { capabilities, claims, players, gpsGlobalMarkers, error } = useMapLayers(
    apiBaseUrl,
    serverId,
    metadata.worldKey,
    onlinePlayers,
  );
  const [visible, setVisible] = useState<LayerVisibility>({
    sectors: false,
    claims: false,
    online: true,
    recent: false,
    longTerm: false,
    gpsGlobalMarkers: false,
  });
  const [displayMode, setDisplayMode] = useState<MapDisplayMode>('normal');
  const [offersClaim, setOffersClaim] = useState<MapClaim | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bounds = metadata.generatedTileBounds;
  const mapBounds = latLngBounds(
    [bounds.minZ, bounds.minX],
    [bounds.maxZ + 1, bounds.maxX + 1],
  );
  const tileUrl = resolveTileUrl(metadata.tileUrl, tileBaseUrl);
  const nativeTileSizeBlocks = metadata.chunkSize * metadata.nativeTileSizeChunks;
  const mapIdentity = `${apiBaseUrl}|${tileUrl}|${metadata.worldKey}|${metadata.nativeZoom}|${metadata.tileSize}`;

  useEffect(() => {
    setVisible({
      sectors: false,
      claims: false,
      online: true,
      recent: false,
      longTerm: false,
      gpsGlobalMarkers: false,
    });
  }, [mapIdentity]);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (document.fullscreenElement !== containerRef.current) {
        setDisplayMode((value) => value === 'fullscreen' ? 'expanded' : value);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleMapModeClick = async () => {
    if (displayMode === 'normal') {
      setDisplayMode('expanded');
      return;
    }
    if (displayMode === 'expanded') {
      if (containerRef.current?.requestFullscreen) {
        try {
          await containerRef.current.requestFullscreen();
          setDisplayMode('fullscreen');
        } catch {
          setDisplayMode('expanded');
        }
      }
      return;
    }
    if (document.fullscreenElement === containerRef.current) {
      await document.exitFullscreen();
    }
    setDisplayMode('normal');
  };

  const expanded = displayMode !== 'normal';

  return (
    <div
      ref={containerRef}
      className={cn(
        'space-y-3',
        expanded && 'fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col space-y-0 bg-background',
      )}
    >
      {!expanded && <p className="text-sm text-muted-foreground">{t('mapCaptureHint')}</p>}
      <div className={cn(
        'relative h-[65vh] min-h-[420px] overflow-hidden rounded-lg border border-border',
        expanded && 'h-[100dvh] min-h-0 flex-1 rounded-none border-0',
      )}>
        <MapContainer
          key={mapIdentity}
          crs={CRS.Simple}
          bounds={mapBounds}
          minZoom={metadata.minZoom}
          maxZoom={metadata.nativeZoom}
          zoom={metadata.nativeZoom}
          className="h-full min-h-0 w-full bg-muted"
        >
          <InvalidateMapSize active={displayMode} />
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
              claims={claims}
              nativeTileSizeBlocks={nativeTileSizeBlocks}
              onOpenMarketplaceOffers={setOffersClaim}
            />
          )}
          <PlayerLayer
            players={players}
            visible={visible}
            nativeTileSizeBlocks={nativeTileSizeBlocks}
          />
          {visible.gpsGlobalMarkers && (
            <GpsGlobalMarkerLayer
              markers={gpsGlobalMarkers}
              nativeTileSizeBlocks={nativeTileSizeBlocks}
            />
          )}
        </MapContainer>
        <div className="pointer-events-none absolute right-3 top-3 z-[1000] flex max-w-[min(24rem,calc(100vw-1.5rem))] flex-col items-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="pointer-events-auto bg-background/90 shadow-lg backdrop-blur"
            onClick={() => void handleMapModeClick()}
            aria-label={displayMode === 'normal'
              ? t('mapExpandWindow')
              : displayMode === 'expanded'
                ? t('mapBrowserFullscreen')
                : t('mapExitFullscreen')}
            title={displayMode === 'normal'
              ? t('mapExpandWindow')
              : displayMode === 'expanded'
                ? t('mapBrowserFullscreen')
                : t('mapExitFullscreen')}
          >
            {displayMode === 'normal'
              ? <Maximize2 className="h-4 w-4" />
              : displayMode === 'expanded'
                ? <MonitorUp className="h-4 w-4" />
                : <Minimize2 className="h-4 w-4" />}
          </Button>
          <div className="pointer-events-auto w-full rounded-md border border-border bg-background/90 p-3 text-sm shadow-lg backdrop-blur">
            <div className="mb-2 text-xs font-medium text-muted-foreground">{t('mapLayers')}</div>
            <div className="flex flex-col gap-2">
              <LayerToggle label={t('mapLayerSectors')} checked={visible.sectors}
                onChange={(checked) => setVisible((value) => ({ ...value, sectors: checked }))} />
              <LayerToggle label={t('mapLayerClaims')} checked={visible.claims}
                disabled={!capabilities?.claims}
                onChange={(checked) => setVisible((value) => ({ ...value, claims: checked }))} />
              <LayerToggle label={t('mapLayerOnlinePlayers')}
                checked={visible.online}
                disabled={!capabilities?.players}
                onChange={(checked) => setVisible((value) => ({ ...value, online: checked }))} />
              <LayerToggle label={t('mapLayerRecentPlayers')} checked={visible.recent}
                disabled={!capabilities?.players}
                onChange={(checked) => setVisible((value) => ({ ...value, recent: checked }))} />
              {isAdmin && (
                <LayerToggle label={t('mapLayerLongTermPlayers')} checked={visible.longTerm}
                  disabled={!capabilities?.players}
                  onChange={(checked) => setVisible((value) => ({ ...value, longTerm: checked }))} />
              )}
              <LayerToggle label={t('mapLayerGpsGlobalMarkers')} checked={visible.gpsGlobalMarkers}
                disabled={!capabilities?.gpsGlobalMarkers}
                onChange={(checked) => setVisible((value) => ({
                  ...value,
                  gpsGlobalMarkers: checked,
                }))} />
              {error && <span className="text-destructive">{t('mapLayerError')}</span>}
            </div>
          </div>
        </div>
      </div>
      <MarketplaceOffersDialog
        apiBaseUrl={apiBaseUrl}
        serverId={serverId}
        claim={offersClaim}
        portalContainer={expanded ? containerRef.current : null}
        onOpenChange={(open) => {
          if (!open) setOffersClaim(null);
        }}
      />
    </div>
  );
}

function resolveTileUrl(tileUrl: string, tileBaseUrl?: string): string {
  try {
    const parsed = new URL(tileUrl);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return tileUrl;
    return parsed.toString();
  } catch {
    if (!tileBaseUrl) return tileUrl;
    return `${tileBaseUrl.replace(/\/+$/, '')}/${tileUrl.replace(/^\/+/, '')}`;
  }
}

function InvalidateMapSize({ active }: { active: MapDisplayMode }) {
  const map = useMap();
  useEffect(() => {
    const invalidate = () => map.invalidateSize({ pan: false });
    invalidate();
    const animationFrames = [
      window.requestAnimationFrame(invalidate),
      window.requestAnimationFrame(() => window.requestAnimationFrame(invalidate)),
    ];
    const timers = [0, 80, 240, 500].map((delay) => window.setTimeout(invalidate, delay));
    const container = map.getContainer();
    const parent = container.parentElement;
    const observer = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(invalidate);
    observer?.observe(container);
    if (parent) observer?.observe(parent);
    window.addEventListener('resize', invalidate);
    document.addEventListener('fullscreenchange', invalidate);
    return () => {
      animationFrames.forEach((frame) => window.cancelAnimationFrame(frame));
      timers.forEach((timer) => window.clearTimeout(timer));
      observer?.disconnect();
      window.removeEventListener('resize', invalidate);
      document.removeEventListener('fullscreenchange', invalidate);
    };
  }, [active, map]);
  return null;
}

function GpsGlobalMarkerLayer({
  markers,
  nativeTileSizeBlocks,
}: {
  markers: MapGpsMarker[];
  nativeTileSizeBlocks: number;
}) {
  const { t } = useTranslation();
  return markers.map((marker) => (
    <CircleMarker
      key={marker.id}
      center={playerToMapPosition(marker, nativeTileSizeBlocks)}
      radius={6}
      pathOptions={{
        color: marker.color,
        fillColor: marker.color,
        fillOpacity: 0.85,
        weight: 2,
      }}
    >
      <Popup>
        <strong>{marker.name}</strong>
        <div>{t('mapGpsMarkerPosition')}: {formatPosition(marker)}</div>
        <div>{t('mapGpsMarkerIcon')}: {marker.icon}</div>
        <div>{t('mapClaimCreated')}: {new Date(marker.createdAt).toLocaleString()}</div>
      </Popup>
    </CircleMarker>
  ));
}

function formatPosition(marker: MapGpsMarker): string {
  return `${formatCoordinate(marker.x)}, ${formatCoordinate(marker.y)}, ${formatCoordinate(marker.z)}`;
}

function formatCoordinate(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
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
  claims,
  nativeTileSizeBlocks,
  onOpenMarketplaceOffers,
}: {
  claims: MapClaim[];
  nativeTileSizeBlocks: number;
  onOpenMarketplaceOffers: (claim: MapClaim) => void;
}) {
  const { t } = useTranslation();

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
          {claim.renewZone && (
            <div>
              {t('mapRenewZone')}: {claim.nextRenewalAt
                ? new Date(claim.nextRenewalAt).toLocaleString()
                : t('mapRenewZoneDue')}
            </div>
          )}
          <div className="flex gap-2">
            {claim.marketplace && (
              <Button
                type="button"
                variant="default"
                size="sm"
                className="h-8 gap-2 border border-primary bg-primary px-2 text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground"
                onClick={() => onOpenMarketplaceOffers(claim)}
              >
                <Store className="h-4 w-4" />
                {t('mapMarketplace')}
              </Button>
            )}
            {claim.shop && <span>🛒 {t('mapShop')}</span>}
          </div>
        </div>
      </Popup>
    </Rectangle>
  ));
}

function MarketplaceOffersDialog({
  apiBaseUrl,
  serverId,
  claim,
  portalContainer,
  onOpenChange,
}: {
  apiBaseUrl: string;
  serverId: string;
  claim: MapClaim | null;
  portalContainer?: HTMLElement | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const [offers, setOffers] = useState<MapMarketplaceOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!claim) {
      setOffers([]);
      setLoading(false);
      setError(false);
      return;
    }
    const controller = new AbortController();
    setOffers([]);
    setLoading(true);
    setError(false);
    fetchMarketplaceOffers(apiBaseUrl, serverId, claim.areaId, controller.signal)
      .then((items) => setOffers(items))
      .catch((requestError) => {
        if (!(requestError instanceof Error) || requestError.name !== 'AbortError') {
          setOffers([]);
          setError(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [apiBaseUrl, claim, serverId]);

  return (
    <Dialog open={!!claim} onOpenChange={onOpenChange}>
      <DialogContent
        portalContainer={portalContainer}
        className="max-h-[85vh] overflow-y-auto sm:max-w-3xl"
      >
        <DialogHeader>
          <DialogTitle>{t('mapOffersTitle')}</DialogTitle>
          <DialogDescription>
            {claim ? `${claim.name} · ${t('mapMarketplace')}` : t('mapMarketplace')}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="rounded-md border border-border px-3 py-8 text-center text-sm text-muted-foreground">
            {t('mapOffersLoading')}
          </div>
        ) : error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-8 text-center text-sm text-destructive">
            {t('mapOffersError')}
          </div>
        ) : offers.length === 0 ? (
          <div className="rounded-md border border-border px-3 py-8 text-center text-sm text-muted-foreground">
            {t('mapNoOffers')}
          </div>
        ) : (
          <MarketplaceOffersTable offers={offers} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function MarketplaceOffersTable({ offers }: { offers: MapMarketplaceOffer[] }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="hidden rounded-md border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('mapOfferItem')}</TableHead>
              <TableHead className="text-right">{t('mapOfferAmount')}</TableHead>
              <TableHead className="text-right">{t('mapOfferPrice')}</TableHead>
              <TableHead>{t('mapOfferSeller')}</TableHead>
              <TableHead>{t('mapOfferCreated')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((offer) => (
              <TableRow key={offer.id}>
                <TableCell className="font-medium">{formatOfferName(offer)}</TableCell>
                <TableCell className="text-right">{offer.amount}</TableCell>
                <TableCell className="text-right">{offer.price} {offer.currency}</TableCell>
                <TableCell>{offer.sellerName}</TableCell>
                <TableCell>{new Date(offer.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="space-y-2 md:hidden">
        {offers.map((offer) => (
          <div key={offer.id} className="rounded-md border border-border p-3 text-sm">
            <div className="font-medium">{formatOfferName(offer)}</div>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-muted-foreground">
              <span>{t('mapOfferAmount')}</span>
              <span className="text-right text-foreground">{offer.amount}</span>
              <span>{t('mapOfferPrice')}</span>
              <span className="text-right text-foreground">{offer.price} {offer.currency}</span>
              <span>{t('mapOfferSeller')}</span>
              <span className="text-right text-foreground">{offer.sellerName}</span>
              <span>{t('mapOfferCreated')}</span>
              <span className="text-right text-foreground">{new Date(offer.createdAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function formatOfferName(offer: MapMarketplaceOffer): string {
  return offer.itemVariant > 0 ? `${offer.itemName} #${offer.itemVariant}` : offer.itemName;
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
