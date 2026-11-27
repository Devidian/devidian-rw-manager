import {
  Maximize2,
  Minimize2,
  MonitorUp,
  Layers,
  ExternalLink,
  Store,
} from 'lucide-react';
import {
  CRS,
  DivIcon,
  DomEvent,
  TileLayer,
  Util,
  latLngBounds,
  type Coords,
  type LatLngBounds,
  type Map as LeafletMap,
} from 'leaflet';
import { createPortal } from 'react-dom';
import { Fragment, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  CircleMarker,
  ImageOverlay,
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
  MapMetadata,
  MapPlayer,
  MapNpcMarket,
} from '@/types/adminMapping';
import {
  areaToMapBounds,
  formatWorldCoordinates,
  leafletYToBackendZ,
  mapPositionToWorldCoordinates,
  playerToMapPosition,
  teleportCommandForCoordinates,
} from '@/lib/mapCoordinates';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import { mapServerBase } from '@/hooks/useMapLayers';
import type { MapLayersState } from '@/hooks/useMapLayers';
import { MarketplaceOffersDialog } from '@/components/MarketplaceOffers';
export { MarketplaceOffersTable } from '@/components/MarketplaceOffers';
import { cn } from '@/lib/utils';
import { authHeaders } from '@/lib/authApi';
import { preloadTileReplacement, tileRefreshDelay, tileUrlWithRefreshRevision } from '@/lib/mapTileRefresh';

interface LayerVisibility {
  autoRefresh: boolean;
  sectors: boolean;
  claims: boolean;
  online: boolean;
  recent: boolean;
  longTerm: boolean;
  gpsGlobalMarkers: boolean;
  playerHistory: boolean;
  marketCriers: boolean;
  shopTraders: boolean;
}

interface PlayerMapHistorySector {
  sectorX: number;
  sectorZ: number;
  bitmap: string;
}

type MapDisplayMode = 'normal' | 'expanded' | 'fullscreen';

export function AdminMapTab({
  apiBaseUrl,
  serverId,
  tileBaseUrl,
  metadata,
  mapLayers,
  isAuthenticated = false,
  apiPath = '/api/storage',
  mapControls,
  embeddedMapHref,
  fullViewport = false,
}: {
  apiBaseUrl: string;
  serverId?: string;
  tileBaseUrl?: string;
  metadata: MapMetadata;
  mapLayers: MapLayersState;
  isAdmin?: boolean;
  isAuthenticated?: boolean;
  apiPath?: string;
  mapControls?: ReactNode;
  embeddedMapHref?: string;
  fullViewport?: boolean;
}) {
  const { t } = useTranslation();
  const {
    capabilities,
    claims,
    players,
    gpsGlobalMarkers,
    error,
    refreshClaims,
    marketplaceOffersDelta,
  } = mapLayers;
  const [visible, setVisible] = useState<LayerVisibility>({
    autoRefresh: true,
    sectors: false,
    claims: false,
    online: true,
    recent: false,
    longTerm: false,
    gpsGlobalMarkers: false,
    playerHistory: false,
    marketCriers: false,
    shopTraders: false,
  });
  const [playerHistory, setPlayerHistory] = useState<PlayerMapHistorySector[]>([]);
  const [displayMode, setDisplayMode] = useState<MapDisplayMode>('normal');
  const [layersOpen, setLayersOpen] = useState(true);
  const [showSatellite, setShowSatellite] = useState(false);
  const [offersClaim, setOffersClaim] = useState<MapClaim | null>(null);
  const [marketCriers, setMarketCriers] = useState<MapNpcMarket[]>([]);
  const [shopTraders, setShopTraders] = useState<MapNpcMarket[]>([]);
  const [selectedMarkets, setSelectedMarkets] = useState<MapNpcMarket[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tileUrl = resolveTileUrl(metadata.tileUrl, tileBaseUrl);
  const satelliteTileUrl = isAuthenticated && metadata.satelliteTileUrl
    ? resolveTileUrl(metadata.satelliteTileUrl, tileBaseUrl) : undefined;
  const nativeTileSizeBlocks = metadata.chunkSize * metadata.nativeTileSizeChunks;
  const initialSectorSize = 8192 / nativeTileSizeBlocks;
  const initialBounds = latLngBounds([[0, 0], [initialSectorSize, initialSectorSize]]);
  const onlinePlayerTiles = useMemo(() => players
    .filter((player) => player.state === 'online')
    .map((player) => ({
      x: Math.floor(player.x / nativeTileSizeBlocks),
      z: Math.floor(player.z / nativeTileSizeBlocks),
    })), [nativeTileSizeBlocks, players]);
  const onlinePlayerTileSignature = useMemo(
    () => tileSignature(onlinePlayerTiles),
    [onlinePlayerTiles],
  );
  const [tileRefreshRevision, setTileRefreshRevision] = useState(() => Date.now());
  const mapIdentity = `${apiBaseUrl}|${tileUrl}|${metadata.worldKey}|${metadata.nativeZoom}|${metadata.tileSize}`;

  useEffect(() => {
    setVisible({
      autoRefresh: isAuthenticated,
      sectors: !isAuthenticated,
      claims: false,
      online: isAuthenticated,
      recent: false,
      longTerm: false,
      gpsGlobalMarkers: false,
      playerHistory: false,
      marketCriers: false,
      shopTraders: false,
    });
    setSelectedMarkets([]);
  }, [mapIdentity, isAuthenticated]);

  const showMarketCriers = isAuthenticated && !!capabilities?.marketCriers && visible.marketCriers;
  const showShopTraders = isAuthenticated && !!capabilities?.shopTraders && visible.shopTraders;
  useEffect(() => {
    const controller = new AbortController();
    const load = async (kind: 'market-criers' | 'shop-traders', setter: (items: MapNpcMarket[]) => void) => {
      const response = await fetch(`${mapServerBase(apiBaseUrl, apiPath, serverId)}/map/layers/${kind}`, {
        headers: authHeaders(),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`NPC layer request failed: ${response.status}`);
      const payload: { items?: MapNpcMarket[] } = await response.json();
      if (!controller.signal.aborted) setter(Array.isArray(payload.items) ? payload.items : []);
    };
    const clearOnError = (setter: (items: MapNpcMarket[]) => void) => {
      if (!controller.signal.aborted) setter([]);
    };
    if (showMarketCriers) {
      void load('market-criers', setMarketCriers).catch(() => clearOnError(setMarketCriers));
    } else setMarketCriers([]);
    if (showShopTraders) {
      void load('shop-traders', setShopTraders).catch(() => clearOnError(setShopTraders));
    } else setShopTraders([]);
    return () => controller.abort();
  }, [apiBaseUrl, apiPath, serverId, showMarketCriers, showShopTraders]);

  useEffect(() => {
    if (!visible.playerHistory || !isAuthenticated || !capabilities?.playerHistory) return undefined;
    const controller = new AbortController();
    void fetch(`${mapServerBase(apiBaseUrl, apiPath, serverId)}/map/layers/player-history`, {
      headers: authHeaders(),
      signal: controller.signal,
    })
      .then(async (response) => response.ok ? response.json() as Promise<unknown> : null)
      .then((response) => {
        if (controller.signal.aborted || !isPlayerMapHistoryResponse(response)) return;
        setPlayerHistory(response.available ? response.items : []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setPlayerHistory([]);
      });
    return () => controller.abort();
  }, [apiBaseUrl, apiPath, isAuthenticated, serverId, visible.playerHistory, capabilities?.playerHistory]);

  useEffect(() => {
    if (!isAuthenticated || !visible.autoRefresh || !onlinePlayerTileSignature) return undefined;
    setTileRefreshRevision(Date.now());
    const timer = window.setInterval(() => setTileRefreshRevision(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [isAuthenticated, onlinePlayerTileSignature, visible.autoRefresh]);

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

  const controls = (
    <div className="pointer-events-none absolute right-3 top-3 z-[1000] flex max-w-[min(24rem,calc(100vw-1.5rem))] flex-col items-end gap-3">
      <div className="flex flex-col items-end gap-3">
          {mapControls}
          {embeddedMapHref && displayMode === 'normal' && (
            <Button asChild type="button" variant="outline" size="icon" className="pointer-events-auto bg-background/90 shadow-lg backdrop-blur">
              <a href={embeddedMapHref} target="_blank" rel="noreferrer" aria-label={t('mapOpenEmbedded')} title={t('mapOpenEmbedded')}>
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
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
          <Button type="button" variant="outline" size="icon" className="pointer-events-auto bg-background/90 shadow-lg" onClick={() => setLayersOpen((value) => !value)} aria-label={t('mapLayers')} title={t('mapLayers')}>
            <Layers className="h-4 w-4" />
          </Button>
      </div>
          {layersOpen && <div className="pointer-events-auto w-full rounded-md border border-border bg-background/90 p-3 text-sm shadow-lg backdrop-blur">
            <div className="mb-2 text-xs font-medium text-muted-foreground">{t('mapLayers')}</div>
            <div className="flex flex-col gap-2">
              {satelliteTileUrl && <LayerToggle label={t('mapLayerSatellite')} checked={showSatellite}
                onChange={setShowSatellite} />}
              {isAuthenticated && <LayerToggle label={t('mapLayerAutoRefresh')} checked={visible.autoRefresh}
                onChange={(checked) => setVisible((value) => ({ ...value, autoRefresh: checked }))} />}
              <LayerToggle label={t('mapLayerSectors')} checked={visible.sectors}
                onChange={(checked) => setVisible((value) => ({ ...value, sectors: checked }))} />
              {isAuthenticated && <><LayerToggle label={t('mapLayerClaims')} checked={visible.claims}
                disabled={!capabilities?.claims}
                onChange={(checked) => {
                  setVisible((value) => ({ ...value, claims: checked }));
                  if (checked) void refreshClaims();
                }} />
              <LayerToggle label={t('mapLayerOnlinePlayers')}
                checked={visible.online}
                disabled={!capabilities?.players}
                onChange={(checked) => setVisible((value) => ({ ...value, online: checked }))} />
              <LayerToggle label={t('mapLayerRecentPlayers')} checked={visible.recent}
                disabled={!capabilities?.players}
                onChange={(checked) => setVisible((value) => ({ ...value, recent: checked }))} />
              <LayerToggle label={t('mapLayerLongTermPlayers')} checked={visible.longTerm}
                disabled={!capabilities?.players}
                onChange={(checked) => setVisible((value) => ({ ...value, longTerm: checked }))} />
              <LayerToggle label={t('mapLayerGpsGlobalMarkers')} checked={visible.gpsGlobalMarkers}
                disabled={!capabilities?.gpsGlobalMarkers}
                onChange={(checked) => setVisible((value) => ({
                  ...value,
                  gpsGlobalMarkers: checked,
                }))} />
              <LayerToggle label={t('mapLayerPlayerHistory')} checked={visible.playerHistory}
                disabled={!isAuthenticated || !capabilities?.playerHistory}
                onChange={(checked) => setVisible((value) => ({ ...value, playerHistory: checked }))} />
              <LayerToggle label={t('mapLayerMarketCriers')} checked={visible.marketCriers} disabled={!capabilities?.marketCriers}
                onChange={(checked) => setVisible((value) => ({ ...value, marketCriers: checked }))} />
              <LayerToggle label={t('mapLayerShopTraders')} checked={visible.shopTraders} disabled={!capabilities?.shopTraders}
                onChange={(checked) => setVisible((value) => ({ ...value, shopTraders: checked }))} />
              </>}
              {error && <span className="text-destructive">{t('mapLayerError')}</span>}
            </div>
          </div>}
        </div>
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        'space-y-3',
        fullViewport && 'h-[100dvh] w-full space-y-0',
        expanded && 'fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col space-y-0 bg-background',
      )}
    >
      {!expanded && !fullViewport && <p className="text-sm text-muted-foreground">{t('mapCaptureHint')}</p>}
      <div className={cn(
        'relative isolate h-[65vh] min-h-[420px] overflow-hidden rounded-lg border border-border',
        (expanded || fullViewport) && 'h-[100dvh] min-h-0 flex-1 rounded-none border-0',
      )}>
        <MapContainer
          key={mapIdentity}
          crs={CRS.Simple}
          bounds={initialBounds}
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
            onlinePlayerTiles={onlinePlayerTiles}
            refreshRevision={tileRefreshRevision}
            refreshEnabled={visible.autoRefresh}
          />
          {showSatellite && satelliteTileUrl && (
            <SignedZTileLayer
              url={satelliteTileUrl}
              tileSize={metadata.tileSize}
              minZoom={metadata.minZoom}
              maxZoom={metadata.nativeZoom}
              onlinePlayerTiles={onlinePlayerTiles}
              refreshRevision={tileRefreshRevision}
              refreshEnabled={visible.autoRefresh}
              overlay
            />
          )}
          <MapCoordinatesOverlay nativeTileSizeBlocks={nativeTileSizeBlocks} />
          {visible.sectors && capabilities && (
            <SectorLayer
              sectorSizeBlocks={capabilities.sectorSizeBlocks}
              nativeTileSizeBlocks={nativeTileSizeBlocks}
            />
          )}
          {isAuthenticated && capabilities?.claims && visible.claims && (
            <ClaimLayer
              claims={claims}
              nativeTileSizeBlocks={nativeTileSizeBlocks}
              onOpenMarketplaceOffers={setOffersClaim}
            />
          )}
          {isAuthenticated && capabilities?.gpsGlobalMarkers && visible.gpsGlobalMarkers && (
            <GpsGlobalMarkerLayer
              markers={gpsGlobalMarkers}
              nativeTileSizeBlocks={nativeTileSizeBlocks}
            />
          )}
          {isAuthenticated && capabilities?.playerHistory && visible.playerHistory && (
            <PlayerHistoryLayer
              sectors={playerHistory}
              nativeTileSizeBlocks={nativeTileSizeBlocks}
            />
          )}
          {isAuthenticated && (
            <NpcMarketLayer
              criers={showMarketCriers ? marketCriers : []}
              traders={showShopTraders ? shopTraders : []}
              onOpen={setSelectedMarkets}
              nativeTileSizeBlocks={nativeTileSizeBlocks}
            />
          )}
          <PlayerLayer
            players={isAuthenticated && capabilities?.players ? players : []}
            visible={visible}
            nativeTileSizeBlocks={nativeTileSizeBlocks}
          />
        </MapContainer>
        {controls}
      </div>
      <MarketplaceOffersDialog
        apiBaseUrl={apiBaseUrl}
        apiPath={apiPath}
        serverId={serverId}
        claim={offersClaim}
        liveDelta={marketplaceOffersDelta}
        portalContainer={expanded ? containerRef.current : null}
        onOpenChange={(open) => {
          if (!open) setOffersClaim(null);
        }}
      />
      <NpcMarketsDialog
        markets={isAuthenticated && (showMarketCriers || showShopTraders) ? selectedMarkets : []}
        portalContainer={expanded ? containerRef.current : null}
        onClose={() => setSelectedMarkets([])}
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

function PlayerHistoryLayer({
  sectors,
  nativeTileSizeBlocks,
}: {
  sectors: PlayerMapHistorySector[];
  nativeTileSizeBlocks: number;
}) {
  const sectorMapSize = 8192 / nativeTileSizeBlocks;
  return sectors.map((sector) => (
    <PlayerHistorySectorOverlay
      key={`${sector.sectorX}|${sector.sectorZ}|${sector.bitmap}`}
      sector={sector}
      sectorMapSize={sectorMapSize}
    />
  ));
}

function PlayerHistorySectorOverlay({
  sector,
  sectorMapSize,
}: {
  sector: PlayerMapHistorySector;
  sectorMapSize: number;
}) {
  const imageUrl = useMemo(() => playerHistoryBitmapUrl(sector.bitmap), [sector.bitmap]);
  if (!imageUrl) return null;
  const minX = sector.sectorX * sectorMapSize;
  const minZ = sector.sectorZ * sectorMapSize;
  return <ImageOverlay url={imageUrl} bounds={[[minZ, minX], [minZ + sectorMapSize, minX + sectorMapSize]]} opacity={0.6} interactive={false} />;
}

function isPlayerMapHistoryResponse(value: unknown): value is {
  available: boolean;
  items: PlayerMapHistorySector[];
} {
  if (!value || typeof value !== 'object') return false;
  const response = value as Record<string, unknown>;
  return typeof response.available === 'boolean' && Array.isArray(response.items)
    && response.items.every((item) => item && typeof item === 'object'
      && typeof (item as Record<string, unknown>).sectorX === 'number'
      && typeof (item as Record<string, unknown>).sectorZ === 'number'
      && typeof (item as Record<string, unknown>).bitmap === 'string');
}

function playerHistoryBitmapUrl(base64: string): string | null {
  try {
    const bytes = atob(base64);
    if (bytes.length !== 8_192) return null;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (!context) return null;
    const image = context.createImageData(256, 256);
    for (let index = 0; index < 65_536; index += 1) {
      if ((bytes.charCodeAt(index >> 3) & (1 << (index & 7))) === 0) continue;
      const pixel = playerMapBitmapPixelIndex(index) * 4;
      image.data[pixel] = 255;
      image.data[pixel + 1] = 255;
      image.data[pixel + 2] = 255;
      image.data[pixel + 3] = 255;
    }
    context.putImageData(image, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

/** Leaflet's CRS.Simple renders the image top-down while world Z grows upward. */
export function playerMapBitmapPixelIndex(bitmapIndex: number): number {
  const localZ = Math.floor(bitmapIndex / 256);
  const localX = bitmapIndex % 256;
  return (255 - localZ) * 256 + localX;
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

function SignedZTileLayer({ url, tileSize, minZoom, maxZoom, onlinePlayerTiles, refreshRevision, refreshEnabled, overlay = false }: {
  url: string;
  tileSize: number;
  minZoom: number;
  maxZoom: number;
  onlinePlayerTiles: NativeTileCoordinate[];
  refreshRevision: number;
  refreshEnabled: boolean;
  overlay?: boolean;
}) {
  const map = useMap();
  const layerRef = useRef<BackendTileLayer | null>(null);
  useEffect(() => {
    const layer = new BackendTileLayer(url, {
      tileSize, minZoom, maxZoom, noWrap: true,
      zIndex: overlay ? 2 : 1,
      errorTileUrl: overlay ? Util.emptyImageUrl : undefined,
    });
    layerRef.current = layer;
    layer.addTo(map);
    return () => {
      layerRef.current = null;
      layer.remove();
    };
  }, [map, maxZoom, minZoom, overlay, tileSize, url]);
  useEffect(() => {
    if (!shouldRefreshOnlinePlayerTiles(refreshEnabled)) return;
    layerRef.current?.refreshOnlinePlayerTiles(onlinePlayerTiles, refreshRevision);
  }, [onlinePlayerTiles, refreshEnabled, refreshRevision]);
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

function MapCoordinatesOverlay({ nativeTileSizeBlocks }: { nativeTileSizeBlocks: number }) {
  const { t } = useTranslation();
  const [cursorCoordinates, setCursorCoordinates] = useState<{ x: number; z: number } | null>(null);
  const [clipboardFallback, setClipboardFallback] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    coordinates: { x: number; z: number };
    x: number;
    y: number;
  } | null>(null);
  useMapEvents({
    mousemove: (event) => setCursorCoordinates(mapPositionToWorldCoordinates(event.latlng, nativeTileSizeBlocks)),
    click: () => setContextMenu(null),
    contextmenu: (event) => {
      event.originalEvent.preventDefault();
      const coordinates = mapPositionToWorldCoordinates(event.latlng, nativeTileSizeBlocks);
      setCursorCoordinates(coordinates);
      setContextMenu({ coordinates, x: event.containerPoint.x, y: event.containerPoint.y });
    },
  });

  const openCopyDialog = (text: string) => {
    if (!contextMenu) return;
    setClipboardFallback(text);
    setContextMenu(null);
  };

  return (
    <>
      {cursorCoordinates && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-md border border-border bg-background/90 px-3 py-2 font-mono text-xs shadow-lg backdrop-blur">
          {formatWorldCoordinates(cursorCoordinates)}
        </div>
      )}
      {contextMenu && (
        <div
          className="absolute z-[1001] min-w-48 rounded-md border border-border bg-background p-1 shadow-lg"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onContextMenu={(event) => event.preventDefault()}
        >
          <div className="px-2 py-1.5 font-mono text-xs text-muted-foreground">{formatWorldCoordinates(contextMenu.coordinates)}</div>
          <button
            type="button"
            className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
            onMouseDown={() => openCopyDialog(formatWorldCoordinates(contextMenu.coordinates))}
          >
            {t('mapCopyCoordinates')}
          </button>
          <button
            type="button"
            className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
            onMouseDown={() => openCopyDialog(teleportCommandForCoordinates(contextMenu.coordinates))}
          >
            {t('mapCopyTeleportCommand')}
          </button>
        </div>
      )}
      <Dialog open={clipboardFallback !== null} onOpenChange={(open) => !open && setClipboardFallback(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('mapClipboardFallbackTitle')}</DialogTitle>
            <DialogDescription>{t('mapClipboardReady')}</DialogDescription>
          </DialogHeader>
          {clipboardFallback && (
            <Textarea
              aria-label={t('mapClipboardReady')}
              autoFocus
              readOnly
              value={clipboardFallback}
              onFocus={(event) => event.currentTarget.select()}
              onClick={(event) => event.currentTarget.select()}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
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

function NpcMarketLayer({ criers, traders, nativeTileSizeBlocks, onOpen }: {
  criers: MapNpcMarket[];
  traders: MapNpcMarket[];
  nativeTileSizeBlocks: number;
  onOpen: (markets: MapNpcMarket[]) => void;
}) {
  const [zoom, setZoom] = useState<number | undefined>(undefined);
  const map = useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const groups: Array<{
    position: ReturnType<typeof playerToMapPosition>;
    point: ReturnType<LeafletMap['project']>;
    members: Array<{ market: MapNpcMarket; kind: 'crier' | 'trader' }>;
  }> = [];

  for (const [kind, markets] of [['crier', criers], ['trader', traders]] as const) {
    for (const market of markets) {
      const position = playerToMapPosition(market, nativeTileSizeBlocks);
      const point = map.project(position, zoom);
      const group = groups.find((entry) =>
        Math.abs(entry.point.x - point.x) < 18 && Math.abs(entry.point.y - point.y) < 18);
      if (group) group.members.push({ market, kind });
      else groups.push({ position, point, members: [{ market, kind }] });
    }
  }

  return groups.map(({ position, members }) => {
    const label = members.map(({ market }) => market.name).join(' · ');
    const colors = { crier: '#9C27B0', trader: '#F57C00' };
    const background = members.some(({ kind }) => kind !== members[0].kind)
      ? `linear-gradient(90deg, ${colors.crier} 50%, ${colors.trader} 50%)`
      : colors[members[0].kind];
    return (
      <NpcMarketMarker
        key={members.map(({ market, kind }) => `${kind}:${market.id}`).join('|')}
        position={position}
        label={label}
        background={background}
        count={members.length}
        onOpen={() => onOpen(members.map(({ market }) => market))}
      />
    );
  });
}

function NpcMarketMarker({ position, label, background, count, onOpen }: {
  position: ReturnType<typeof playerToMapPosition>;
  label: string;
  background: string;
  count: number;
  onOpen: () => void;
}) {
  const { host, icon } = useMemo(() => {
    const host = document.createElement('div');
    // Leaflet otherwise starts dragging on mousedown and may discard the click.
    DomEvent.disableClickPropagation(host);
    return { host, icon: new DivIcon({
      className: 'npc-market-marker',
      html: host,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    }) };
  }, []);

  return (
    <>
      <Marker position={position} icon={icon} zIndexOffset={1000} interactive={false} keyboard={false} />
      {createPortal(
        <button type="button" title={label} aria-label={label}
          className="pointer-events-auto grid size-[18px] cursor-pointer place-items-center border-2 border-white p-0 font-sans text-[10px] font-bold leading-none text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          style={{ background }}
          onClick={onOpen}>
          {count > 1 ? count : ''}
        </button>,
        host,
      )}
    </>
  );
}

function NpcMarketsDialog({ markets, portalContainer, onClose }: {
  markets: MapNpcMarket[];
  portalContainer: HTMLElement | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={markets.length > 0} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent portalContainer={portalContainer} className="max-h-[85vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{t('mapNpcOffersTitle')}</DialogTitle>
          <DialogDescription className="sr-only">{markets.map((market) => market.name).join(' · ')}</DialogDescription>
        </DialogHeader>
        <div className="min-w-0 divide-y">
          {markets.map((market, index) => <NpcMarketPopup key={`${market.id}:${index}`} market={market} />)}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NpcMarketPopup({ market }: { market: MapNpcMarket }) {
  const { t, i18n } = useTranslation();
  const german = i18n?.language?.startsWith('de');
  return (
    <section aria-label={market.name} className="min-w-0 space-y-2 py-2">
      <h3 className="text-base font-semibold">{market.name}</h3>
      <div className="text-sm text-muted-foreground">{market.balances.map((balance) => `${balance.balance} ${balance.currency}`).join(' · ') || t('mapNpcNoBalance')}</div>
      {market.offers.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('mapNpcItem')}</TableHead>
                <TableHead>{t('mapNpcBuyPrice')}</TableHead>
                <TableHead>{t('mapNpcSellPrice')}</TableHead>
                <TableHead>{t('mapNpcStock')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {market.offers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell className="whitespace-normal break-words">
                    {((german ? offer.nameDe || offer.nameEn : offer.nameEn || offer.nameDe) || offer.itemName).replace(/\\u00ad/gi, '\u00ad')}
                    {offer.itemVariant > 0 ? ` #${offer.itemVariant}` : ''} × {offer.amount}
                  </TableCell>
                  <TableCell>{offer.playerBuyPrice ?? offer.price} {offer.currency}</TableCell>
                  <TableCell>{offer.playerSellPrice === undefined ? '—' : `${offer.playerSellPrice} ${offer.currency}`}</TableCell>
                  <TableCell>{offer.stock ?? '—'}{offer.maxStock === undefined ? '' : ` / ${offer.maxStock}`}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : <div>{t('mapNoOffers')}</div>}
    </section>
  );
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

interface NativeTileCoordinate {
  x: number;
  z: number;
}

export function tileSignature(tiles: NativeTileCoordinate[]): string {
  return tiles.map((tile) => `${tile.x}:${tile.z}`).sort().join(',');
}

export function shouldRefreshOnlinePlayerTiles(autoRefresh: boolean): boolean {
  return autoRefresh;
}

export function isOnlinePlayerTile(coords: { x: number; y: number; z: number }, nativeZoom: number, onlinePlayerTiles: NativeTileCoordinate[]): boolean {
  const scale = 2 ** Math.max(0, nativeZoom - coords.z);
  const backendZ = leafletYToBackendZ(coords.y);
  return onlinePlayerTiles.some((playerTile) =>
    Math.abs(coords.x - Math.floor(playerTile.x / scale)) <= 1
      && Math.abs(backendZ - Math.floor(playerTile.z / scale)) <= 1,
  );
}

class BackendTileLayer extends TileLayer {
  private onlinePlayerTiles: NativeTileCoordinate[] = [];
  private lastRefreshedOnlinePlayerTiles: NativeTileCoordinate[] = [];
  private refreshRevision = 0;
  private playerTileSignature = '';
  private lastNetworkRefreshAt = 0;
  private pendingRefresh: number | null = null;

  refreshOnlinePlayerTiles(onlinePlayerTiles: NativeTileCoordinate[], refreshRevision: number) {
    const signature = tileSignature(onlinePlayerTiles);
    if (signature === this.playerTileSignature && refreshRevision === this.refreshRevision) return;
    this.onlinePlayerTiles = onlinePlayerTiles;
    this.playerTileSignature = signature;
    this.refreshRevision = refreshRevision;
    const delay = tileRefreshDelay(this.lastNetworkRefreshAt, Date.now());
    if (delay > 0) {
      if (this.pendingRefresh === null) {
        this.pendingRefresh = window.setTimeout(() => {
          this.pendingRefresh = null;
          this.refreshVisibleOnlinePlayerTiles();
        }, delay);
      }
      return;
    }
    this.refreshVisibleOnlinePlayerTiles();
  }

  override onRemove(map: LeafletMap): this {
    if (this.pendingRefresh !== null) window.clearTimeout(this.pendingRefresh);
    this.pendingRefresh = null;
    return super.onRemove(map);
  }

  private refreshVisibleOnlinePlayerTiles() {
    this.lastNetworkRefreshAt = Date.now();
    const tiles = (this as unknown as {
      _tiles?: Record<string, { coords: Coords; el: HTMLImageElement }>;
    })._tiles;
    Object.values(tiles ?? {}).forEach((tile) => {
      const nativeZoom = this.options.maxZoom ?? tile.coords.z;
      if (!isOnlinePlayerTile(tile.coords, nativeZoom, this.onlinePlayerTiles)
        && !isOnlinePlayerTile(tile.coords, nativeZoom, this.lastRefreshedOnlinePlayerTiles)) return;
      preloadTileReplacement(tile.el, this.getTileUrl(tile.coords));
    });
    this.lastRefreshedOnlinePlayerTiles = this.onlinePlayerTiles;
  }

  override getTileUrl(coords: Coords): string {
    const tileUrl = super.getTileUrl({ ...coords, y: leafletYToBackendZ(coords.y) } as Coords);
    const nativeZoom = this.options.maxZoom ?? coords.z;
    return isOnlinePlayerTile(coords, nativeZoom, this.onlinePlayerTiles)
      || isOnlinePlayerTile(coords, nativeZoom, this.lastRefreshedOnlinePlayerTiles)
      ? tileUrlWithRefreshRevision(tileUrl, this.refreshRevision)
      : tileUrl;
  }
}
