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
  TileLayer,
  latLngBounds,
  type Coords,
  type LatLngBounds,
  type Map as LeafletMap,
} from 'leaflet';
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
  MapMarketplaceOffer,
  MapMetadata,
  MapPlayer,
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
import { applyEntityDelta, fetchMarketplaceOffers, mapServerBase } from '@/hooks/useMapLayers';
import type { MapLayersState } from '@/hooks/useMapLayers';
import type { MapMarketplaceAreaDelta } from '@/lib/mapLive';
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
  isAdmin = false,
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
  });
  const [playerHistory, setPlayerHistory] = useState<PlayerMapHistorySector[]>([]);
  const [displayMode, setDisplayMode] = useState<MapDisplayMode>('normal');
  const [layersOpen, setLayersOpen] = useState(true);
  const [offersClaim, setOffersClaim] = useState<MapClaim | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tileUrl = resolveTileUrl(metadata.tileUrl, tileBaseUrl);
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
      autoRefresh: true,
      sectors: false,
      claims: false,
      online: true,
      recent: false,
      longTerm: false,
      gpsGlobalMarkers: false,
      playerHistory: false,
    });
  }, [mapIdentity]);

  useEffect(() => {
    if (!visible.playerHistory || !isAuthenticated) return undefined;
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
  }, [apiBaseUrl, apiPath, isAuthenticated, serverId, visible.playerHistory]);

  useEffect(() => {
    if (!visible.autoRefresh || !onlinePlayerTileSignature) return undefined;
    setTileRefreshRevision(Date.now());
    const timer = window.setInterval(() => setTileRefreshRevision(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [onlinePlayerTileSignature, visible.autoRefresh]);

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
        fullViewport && 'h-[100dvh] w-full space-y-0',
        expanded && 'fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col space-y-0 bg-background',
      )}
    >
      {!expanded && !fullViewport && <p className="text-sm text-muted-foreground">{t('mapCaptureHint')}</p>}
      <div className={cn(
        'relative h-[65vh] min-h-[420px] overflow-hidden rounded-lg border border-border',
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
          <MapCoordinatesOverlay nativeTileSizeBlocks={nativeTileSizeBlocks} />
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
          {visible.gpsGlobalMarkers && (
            <GpsGlobalMarkerLayer
              markers={gpsGlobalMarkers}
              nativeTileSizeBlocks={nativeTileSizeBlocks}
            />
          )}
          {visible.playerHistory && (
            <PlayerHistoryLayer
              sectors={playerHistory}
              nativeTileSizeBlocks={nativeTileSizeBlocks}
            />
          )}
          <PlayerLayer
            players={players}
            visible={visible}
            nativeTileSizeBlocks={nativeTileSizeBlocks}
          />
        </MapContainer>
        <div className="pointer-events-none absolute right-3 top-3 z-[1000] flex max-w-[min(24rem,calc(100vw-1.5rem))] flex-col items-end gap-3">
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
          {layersOpen && <div className="pointer-events-auto w-full rounded-md border border-border bg-background/90 p-3 text-sm shadow-lg backdrop-blur">
            <div className="mb-2 text-xs font-medium text-muted-foreground">{t('mapLayers')}</div>
            <div className="flex flex-col gap-2">
              <LayerToggle label={t('mapLayerAutoRefresh')} checked={visible.autoRefresh}
                onChange={(checked) => setVisible((value) => ({ ...value, autoRefresh: checked }))} />
              <LayerToggle label={t('mapLayerSectors')} checked={visible.sectors}
                onChange={(checked) => setVisible((value) => ({ ...value, sectors: checked }))} />
              <LayerToggle label={t('mapLayerClaims')} checked={visible.claims}
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
              <LayerToggle label={t('mapLayerPlayerHistory')} checked={visible.playerHistory}
                disabled={!isAuthenticated || !capabilities?.playerHistory}
                onChange={(checked) => setVisible((value) => ({ ...value, playerHistory: checked }))} />
              {error && <span className="text-destructive">{t('mapLayerError')}</span>}
            </div>
          </div>}
        </div>
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

function SignedZTileLayer({ url, tileSize, minZoom, maxZoom, onlinePlayerTiles, refreshRevision, refreshEnabled }: {
  url: string;
  tileSize: number;
  minZoom: number;
  maxZoom: number;
  onlinePlayerTiles: NativeTileCoordinate[];
  refreshRevision: number;
  refreshEnabled: boolean;
}) {
  const map = useMap();
  const layerRef = useRef<BackendTileLayer | null>(null);
  useEffect(() => {
    const layer = new BackendTileLayer(url, { tileSize, minZoom, maxZoom, noWrap: true });
    layerRef.current = layer;
    layer.addTo(map);
    return () => {
      layerRef.current = null;
      layer.remove();
    };
  }, [map, maxZoom, minZoom, tileSize, url]);
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

  const copyToClipboard = (text: string) => {
    if (!contextMenu) return;
    const showCopyFallback = (reason: unknown) => {
      const legacyCopied = copyTextFallback(text);
      console.warn('[map] Clipboard write failed; showing manual copy fallback.', { reason, legacyCopied });
      console.info('[map] Copy this value manually:', text);
      setClipboardFallback(text);
    };
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text).catch(showCopyFallback);
    } else {
      showCopyFallback(new Error('Clipboard API is unavailable'));
    }
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
            onClick={() => copyToClipboard(formatWorldCoordinates(contextMenu.coordinates))}
          >
            {t('mapCopyCoordinates')}
          </button>
          <button
            type="button"
            className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
            onClick={() => copyToClipboard(teleportCommandForCoordinates(contextMenu.coordinates))}
          >
            {t('mapCopyTeleportCommand')}
          </button>
        </div>
      )}
      <Dialog open={clipboardFallback !== null} onOpenChange={(open) => !open && setClipboardFallback(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('mapClipboardFallbackTitle')}</DialogTitle>
            <DialogDescription>{t('mapClipboardFallback')}</DialogDescription>
          </DialogHeader>
          {clipboardFallback && (
            <Textarea
              aria-label={t('mapClipboardFallback')}
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

function copyTextFallback(text: string): boolean {
  if (typeof document.execCommand !== 'function') return false;
  const input = document.createElement('textarea');
  input.value = text;
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.append(input);
  input.select();
  try {
    return document.execCommand('copy');
  } finally {
    input.remove();
  }
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
  apiPath,
  serverId,
  claim,
  liveDelta,
  portalContainer,
  onOpenChange,
}: {
  apiBaseUrl: string;
  apiPath: string;
  serverId?: string;
  claim: MapClaim | null;
  liveDelta: { sequence: number; areas: MapMarketplaceAreaDelta[] } | null;
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
    (apiPath === '/api/storage'
      ? fetchMarketplaceOffers(apiBaseUrl, serverId, claim.areaId, controller.signal)
      : fetchMarketplaceOffers(apiBaseUrl, serverId, claim.areaId, controller.signal, apiPath))
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
  }, [apiBaseUrl, apiPath, claim, serverId]);

  useEffect(() => {
    if (!claim || !liveDelta) return;
    const delta = liveDelta.areas.find((area) => area.areaId === claim.areaId);
    if (delta) setOffers((items) => applyEntityDelta(items, delta, (item) => item.id));
  }, [claim, liveDelta]);

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
