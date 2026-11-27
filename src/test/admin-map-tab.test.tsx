import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { useEffect, useMemo } from 'react';
import { vi } from 'vitest';
import { AdminMapTab } from '@/components/AdminMapTab';
import type { MapClaim } from '@/types/adminMapping';

const mapContainerProps = vi.hoisted(() => ({
  current: null as ComponentProps<'div'> & Record<string, unknown> | null,
  mounts: 0,
  unmounts: 0,
  invalidations: 0,
}));

const tileRefreshCalls = vi.hoisted(() => vi.fn());
const tileLayerUrls = vi.hoisted(() => [] as string[]);
const tileLayerOptions = vi.hoisted(() => [] as Array<{ zIndex?: number; errorTileUrl?: string }>);
const removedTileLayerUrls = vi.hoisted(() => [] as string[]);
const rectanglePathOptions = vi.hoisted(() => [] as Array<Record<string, unknown>>);
const mapLayerState = vi.hoisted(() => ({
  claims: [] as MapClaim[],
  npcMarkets: false,
}));
const fetchMarketplaceOffersMock = vi.hoisted(() => vi.fn());
const refreshClaimsMock = vi.hoisted(() => vi.fn());
const mapEventHandlers = vi.hoisted(() => ({ current: {} as Record<string, (event: never) => void> }));

vi.mock('leaflet', async (importOriginal) => {
  const actual = await importOriginal<typeof import('leaflet')>();
  return {
    ...actual,
    TileLayer: class {
      constructor(public url: string, options: { zIndex?: number; errorTileUrl?: string }) {
        tileLayerUrls.push(url);
        tileLayerOptions.push(options);
      }

      addTo() {
        const dynamic = this as { refreshOnlinePlayerTiles?: (...args: unknown[]) => void };
        const refresh = dynamic.refreshOnlinePlayerTiles?.bind(this);
        if (refresh) dynamic.refreshOnlinePlayerTiles = (...args) => {
          tileRefreshCalls(...args);
          refresh(...args);
        };
        return this;
      }

      remove() { removedTileLayerUrls.push(this.url); }

      getTileUrl() {
        return this.url;
      }
    },
  };
});

vi.mock('react-leaflet', () => ({
  MapContainer: (props: ComponentProps<'div'> & Record<string, unknown>) => {
    mapContainerProps.current = props;
    useEffect(() => {
      mapContainerProps.mounts += 1;
      return () => {
        mapContainerProps.unmounts += 1;
      };
    }, []);
    return <div>{props.children}</div>;
  },
  CircleMarker: () => null,
  Marker: ({ icon }: { icon?: { options: { html?: string | HTMLElement } } }) => {
    const html = icon?.options.html;
    return html instanceof HTMLElement ? <div ref={(element) => { if (element) element.append(html); }} /> : null;
  },
  Popup: (props: ComponentProps<'div'>) => <div>{props.children}</div>,
  Rectangle: (props: ComponentProps<'div'> & Record<string, unknown>) => {
    rectanglePathOptions.push(props.pathOptions as Record<string, unknown>);
    return <div data-testid="map-rectangle">{props.children}</div>;
  },
  Tooltip: () => null,
  useMap: () => useMemo(() => ({
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    invalidateSize: () => {
      mapContainerProps.invalidations += 1;
    },
    getContainer: () => document.createElement('div'),
  }), []),
  useMapEvents: (handlers: Record<string, (event: never) => void>) => {
    Object.assign(mapEventHandlers.current, handlers);
    return { project: () => ({ x: 0, y: 0 }), getBounds: () => ({ getWest: () => 0, getEast: () => 0, getSouth: () => 0, getNorth: () => 0 }) };
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/hooks/useMapLayers', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/hooks/useMapLayers')>(),
  fetchMarketplaceOffers: fetchMarketplaceOffersMock,
}));

function TestAdminMapTab(props: Omit<ComponentProps<typeof AdminMapTab>, 'mapLayers'>) {
  return (
    <AdminMapTab
      {...props}
      isAuthenticated={props.isAuthenticated ?? true}
      mapLayers={{
        capabilities: {
          claims: true,
          players: true,
          gpsGlobalMarkers: true,
          marketCriers: mapLayerState.npcMarkets,
          shopTraders: mapLayerState.npcMarkets,
        } as never,
        claims: mapLayerState.claims,
        players: [],
        gpsGlobalMarkers: [],
        error: false,
        refreshClaims: refreshClaimsMock,
        marketplaceOffersDelta: null,
      }}
    />
  );
}

describe('AdminMapTab', () => {
  beforeEach(() => {
    mapContainerProps.mounts = 0;
    mapContainerProps.unmounts = 0;
    mapContainerProps.invalidations = 0;
    tileLayerUrls.length = 0;
    tileRefreshCalls.mockClear();
    tileLayerOptions.length = 0;
    removedTileLayerUrls.length = 0;
    rectanglePathOptions.length = 0;
    mapLayerState.claims = [];
    mapLayerState.npcMarkets = false;
    fetchMarketplaceOffersMock.mockReset();
    refreshClaimsMock.mockReset();
    mapEventHandlers.current = {};
  });

  it('limits guests to the surface map and sector control', () => {
    render(<TestAdminMapTab apiBaseUrl="https://manager.example.com/" serverId="server-1"
      isAuthenticated={false} metadata={{
        schemaVersion: 5, worldKey: 'world', worldName: 'World', tileSize: 256,
        chunkSize: 32, pixelsPerBlock: 4, nativeTileSizeChunks: 2, minZoom: 0,
        nativeZoom: 8, generatedChunkBounds: { minX: 0, minZ: 0, maxX: 1, maxZ: 1 },
        generatedTileBounds: { minX: 0, minZ: 0, maxX: 1, maxZ: 1 },
        updatedAt: '2026-11-16T00:00:00Z', tileUrl: '/tiles/{z}/{x}/{y}.png',
        satelliteTileUrl: '/satellite/{z}/{x}/{y}.png',
      }} />);
    expect(screen.getByText('mapLayerSectors')).toBeInTheDocument();
    expect(screen.queryByText('mapLayerSatellite')).not.toBeInTheDocument();
    expect(screen.queryByText('mapLayerAutoRefresh')).not.toBeInTheDocument();
    expect(screen.queryByText('mapLayerClaims')).not.toBeInTheDocument();
  });

  it('keeps the surface tiles mounted below the optional satellite tiles', () => {
    const surface = metadata('world-a', 'World A');
    const satelliteTileUrl = 'https://map.example.com/satellite/{z}/{x}/{y}.png';
    render(<TestAdminMapTab apiBaseUrl="https://manager.example.com" serverId="server-1"
      metadata={{ ...surface, satelliteTileUrl }} />);

    const toggle = screen.getByRole('checkbox', { name: 'mapLayerSatellite' });
    fireEvent.click(toggle);
    expect(tileLayerUrls).toEqual([surface.tileUrl, satelliteTileUrl]);
    expect(tileLayerOptions[0].zIndex).toBeLessThan(tileLayerOptions[1].zIndex ?? 0);
    expect(tileLayerOptions[1].errorTileUrl).toMatch(/^data:image\/gif/);
    expect(removedTileLayerUrls).not.toContain(surface.tileUrl);

    fireEvent.click(toggle);
    expect(removedTileLayerUrls).toEqual([satelliteTileUrl]);
  });

  it('initially fits generated tiles without locking map panning to them', () => {
    render(
      <TestAdminMapTab
        apiBaseUrl="https://manager.example.com/"
        serverId="server-1"
        tileBaseUrl="https://map.example.com/"
        metadata={{
          schemaVersion: 5,
          worldKey: 'new-world',
          worldName: 'New World',
          tileSize: 256,
          chunkSize: 32,
          pixelsPerBlock: 4,
          nativeTileSizeChunks: 2,
          minZoom: 0,
          nativeZoom: 8,
          generatedChunkBounds: { minX: -44, minZ: -50, maxX: -42, maxZ: -48 },
          generatedTileBounds: { minX: -22, minZ: -25, maxX: -21, maxZ: -24 },
          updatedAt: '2026-06-12T00:00:00.000Z',
          tileUrl: 'https://map.example.com/server-1/{z}/{x}/{y}.png',
        }}
      />,
    );

    expect(mapContainerProps.current?.bounds).toBeDefined();
    expect(mapContainerProps.current?.maxBounds).toBeUndefined();
    expect(tileLayerUrls).toContain('https://map.example.com/server-1/{z}/{x}/{y}.png');
    expect(screen.getByText('mapLayerAutoRefresh')).toBeInTheDocument();
  });

  it('invokes the tile-layer refresh only while automatic updates are enabled', () => {
    render(<TestAdminMapTab
      apiBaseUrl="https://manager.example.com"
      serverId="server-1"
      tileBaseUrl="https://map.example.com"
      metadata={metadata('world-a', 'World A')}
    />);
    const automatic = screen.getByRole('checkbox', { name: 'mapLayerAutoRefresh' });
    expect(tileRefreshCalls).toHaveBeenCalled();
    tileRefreshCalls.mockClear();
    fireEvent.click(automatic);
    expect(tileRefreshCalls).not.toHaveBeenCalled();
    fireEvent.click(automatic);
    expect(tileRefreshCalls).toHaveBeenCalled();
  });

  it('offers the server-specific embedded map from the normal map view', () => {
    render(
      <TestAdminMapTab
        apiBaseUrl="https://manager.example.com"
        serverId="server-1"
        tileBaseUrl="https://map.example.com"
        embeddedMapHref="/embedded-map/server-1"
        metadata={metadata('world-a', 'World A')}
      />,
    );

    const link = screen.getByRole('link', { name: 'mapOpenEmbedded' });
    expect(link).toHaveAttribute('href', '/embedded-map/server-1');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('uses the entire viewport without the capture hint when embedded', () => {
    render(
      <TestAdminMapTab
        apiBaseUrl="https://manager.example.com"
        serverId="server-1"
        tileBaseUrl="https://map.example.com"
        fullViewport
        metadata={metadata('world-a', 'World A')}
      />,
    );

    expect(screen.queryByText('mapCaptureHint')).not.toBeInTheDocument();
  });

  it('shows world coordinates and opens a selected copy value from the map context menu', () => {
    render(
      <TestAdminMapTab
        apiBaseUrl="https://manager.example.com"
        serverId="server-1"
        tileBaseUrl="https://map.example.com"
        metadata={metadata('world-a', 'World A')}
      />,
    );

    act(() => mapEventHandlers.current.mousemove({ latlng: { lat: -1.5, lng: 2.25 } } as never));
    expect(screen.getByText('X: 144, Z: -96')).toBeInTheDocument();

    const preventDefault = vi.fn();
    act(() => mapEventHandlers.current.contextmenu({
      latlng: { lat: -1.5, lng: 2.25 },
      containerPoint: { x: 20, y: 30 },
      originalEvent: { preventDefault },
    } as never));
    expect(preventDefault).toHaveBeenCalledTimes(1);
    fireEvent.mouseDown(screen.getByRole('button', { name: 'mapCopyCoordinates' }));
    expect(screen.getByLabelText('mapClipboardReady')).toHaveValue('X: 144, Z: -96');
  });

  it('opens a surface-height teleport command from the map context menu', () => {
    render(
      <TestAdminMapTab
        apiBaseUrl="https://manager.example.com"
        serverId="server-1"
        tileBaseUrl="https://map.example.com"
        metadata={metadata('world-a', 'World A')}
      />,
    );

    act(() => mapEventHandlers.current.contextmenu({
      latlng: { lat: -1.5, lng: 2.25 },
      containerPoint: { x: 20, y: 30 },
      originalEvent: { preventDefault: vi.fn() },
    } as never));
    fireEvent.mouseDown(screen.getByRole('button', { name: 'mapCopyTeleportCommand' }));
    expect(screen.getByLabelText('mapClipboardReady')).toHaveValue('tp 144 90 -96');
  });

  it('passes city and leasehold colors from map-layer claims to Leaflet', () => {
    mapLayerState.claims = [
      claim({ areaId: 1, borderColor: '#7B61FF10', fillColor: '#7B61FF50' }),
      claim({ areaId: 2, borderColor: '#00BFA510', fillColor: '#00BFA550' }),
      claim({ areaId: 3, borderColor: '#FF980010', fillColor: '#FF980050' }),
    ];
    render(<TestAdminMapTab
      apiBaseUrl="https://manager.example.com/"
      serverId="server-1"
      metadata={metadata('world-a', 'World A')}
    />);

    showClaimsLayer();

    expect(rectanglePathOptions).toEqual(expect.arrayContaining([
      expect.objectContaining({ color: '#7B61FF10', fillColor: '#7B61FF50' }),
      expect.objectContaining({ color: '#00BFA510', fillColor: '#00BFA550' }),
      expect.objectContaining({ color: '#FF980010', fillColor: '#FF980050' }),
    ]));
  });

  it('recreates the Leaflet map when the selected world changes', () => {
    const { rerender } = render(
      <TestAdminMapTab
        apiBaseUrl="https://manager.example.com"
        serverId="server-1"
        tileBaseUrl="https://map.example.com"
        metadata={metadata('world-a', 'World A')}
      />,
    );
    rerender(
      <TestAdminMapTab
        apiBaseUrl="https://manager.example.com"
        serverId="server-1"
        tileBaseUrl="https://map.example.com"
        metadata={metadata('world-b', 'World B')}
      />,
    );

    expect(mapContainerProps.mounts).toBe(2);
    expect(mapContainerProps.unmounts).toBe(1);
  });

  it('keeps map controls on the map and resizes when entering expanded mode', async () => {
    render(
      <TestAdminMapTab
        apiBaseUrl="https://manager.example.com"
        serverId="server-1"
        tileBaseUrl="https://map.example.com"
        metadata={metadata('world-a', 'World A')}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'mapExpandWindow' }));

    expect(screen.getByRole('button', { name: 'mapBrowserFullscreen' })).toBeInTheDocument();
    await waitFor(() => expect(mapContainerProps.invalidations).toBeGreaterThan(0));
    expect(screen.getByText('mapLayers')).toBeInTheDocument();
    expect(screen.getByText('mapLayerSectors')).toBeInTheDocument();
    expect(screen.getByText('mapLayerOnlinePlayers')).toBeInTheDocument();
  });

  it('requests browser fullscreen from expanded map mode', async () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen,
    });

    render(
      <TestAdminMapTab
        apiBaseUrl="https://manager.example.com"
        serverId="server-1"
        tileBaseUrl="https://map.example.com"
        metadata={metadata('world-a', 'World A')}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'mapExpandWindow' }));
    fireEvent.click(screen.getByRole('button', { name: 'mapBrowserFullscreen' }));

    await waitFor(() => expect(requestFullscreen).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('button', { name: 'mapExitFullscreen' })).toBeInTheDocument();
  });

  it.each([
    ['market-criers', 'mapLayerMarketCriers', 'Market Crier'],
    ['shop-traders', 'mapLayerShopTraders', 'Shop Trader'],
  ])('opens %s offers within the browser fullscreen element', async (path, layer, name) => {
    mapLayerState.npcMarkets = true;
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => Response.json({
      items: String(input).endsWith(path) ? [{
        id: 1, name, x: 256, y: 0, z: 256, balances: [{ balance: 10, currency: 'coins' }],
        offers: [{ id: 1, itemName: 'Iron Ingot', itemVariant: 0, amount: 1, price: 5, currency: 'coins' }],
      }] : [],
    }));
    const previousFullscreen = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'requestFullscreen');
    const fullscreenElements: HTMLElement[] = [];
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      configurable: true,
      value: async function (this: HTMLElement) { fullscreenElements.push(this); },
    });

    try {
      render(<TestAdminMapTab apiBaseUrl="https://manager.example.com" serverId="server-1"
        metadata={metadata('world-a', 'World A')} />);
      fireEvent.click(screen.getByRole('button', { name: 'mapExpandWindow' }));
      fireEvent.click(screen.getByRole('button', { name: 'mapBrowserFullscreen' }));
      await screen.findByRole('button', { name: 'mapExitFullscreen' });
      fireEvent.click(screen.getByRole('checkbox', { name: layer }));
      fireEvent.click(await screen.findByRole('button', { name }));
      const dialog = await screen.findByRole('dialog', { name: 'mapNpcOffersTitle' });
      expect(fullscreenElements[0]).toContainElement(dialog);
      expect(dialog).toHaveTextContent('Iron Ingot');
      expect(dialog).toHaveTextContent('10 coins');
    } finally {
      fetchMock.mockRestore();
      if (previousFullscreen) Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', previousFullscreen);
      else Reflect.deleteProperty(HTMLElement.prototype, 'requestFullscreen');
    }
  });

  it('opens marketplace offers from marketplace claim indicators only', async () => {
    mapLayerState.claims = [
      claim({ areaId: 1, name: 'Market Claim', marketplace: true }),
      claim({ areaId: 2, name: 'Shop Claim', marketplace: false, shop: true }),
    ];
    fetchMarketplaceOffersMock.mockResolvedValueOnce([{
      id: 10,
      itemName: 'Iron Ingot',
      itemVariant: 0,
      amount: 12,
      price: 80,
      currency: 'coins',
      sellerName: 'Seller',
      createdAt: '2026-07-02T10:00:00.000Z',
    }]);

    render(
      <TestAdminMapTab
        apiBaseUrl="https://manager.example.com"
        serverId="server-1"
        tileBaseUrl="https://map.example.com"
        metadata={metadata('world-a', 'World A')}
      />,
    );
    showClaimsLayer();

    expect(screen.getAllByRole('button', { name: 'mapMarketplace' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'mapMarketplace' }));

    expect(fetchMarketplaceOffersMock).toHaveBeenCalledWith(
      'https://manager.example.com',
      'server-1',
      1,
      expect.any(AbortSignal),
    );
    expect(await screen.findAllByText('Iron Ingot')).toHaveLength(2);
    expect(screen.getAllByText('12')).toHaveLength(2);
    expect(screen.getAllByText('80 coins')).toHaveLength(2);
  });

  it('refreshes claims when the claims layer is enabled again', () => {
    render(
      <TestAdminMapTab
        apiBaseUrl="https://manager.example.com"
        serverId="server-1"
        tileBaseUrl="https://map.example.com"
        metadata={metadata('world-a', 'World A')}
      />,
    );

    showClaimsLayer();
    fireEvent.click(screen.getByRole('checkbox', { name: 'mapLayerClaims' }));
    showClaimsLayer();

    expect(refreshClaimsMock).toHaveBeenCalledTimes(2);
  });

  it('renders marketplace offer loading, empty, and error states', async () => {
    mapLayerState.claims = [claim({ areaId: 1, marketplace: true })];
    fetchMarketplaceOffersMock.mockResolvedValueOnce([]);

    const { unmount } = render(
      <TestAdminMapTab
        apiBaseUrl="https://manager.example.com"
        serverId="server-1"
        tileBaseUrl="https://map.example.com"
        metadata={metadata('world-a', 'World A')}
      />,
    );
    showClaimsLayer();
    fireEvent.click(screen.getByRole('button', { name: 'mapMarketplace' }));

    expect(screen.getByText('mapOffersLoading')).toBeInTheDocument();
    expect(await screen.findByText('mapNoOffers')).toBeInTheDocument();
    unmount();

    fetchMarketplaceOffersMock.mockRejectedValueOnce(new Error('Failed'));
    render(
      <TestAdminMapTab
        apiBaseUrl="https://manager.example.com"
        serverId="server-1"
        tileBaseUrl="https://map.example.com"
        metadata={metadata('world-a', 'World A')}
      />,
    );
    showClaimsLayer();
    fireEvent.click(screen.getByRole('button', { name: 'mapMarketplace' }));

    expect(await screen.findByText('mapOffersError')).toBeInTheDocument();
  });

  it('aborts stale marketplace offer requests when the selected area changes', async () => {
    mapLayerState.claims = [
      claim({ areaId: 1, name: 'Market A', marketplace: true }),
      claim({ areaId: 2, name: 'Market B', marketplace: true }),
    ];
    const signals: AbortSignal[] = [];
    fetchMarketplaceOffersMock.mockImplementation((
      _apiBaseUrl: string,
      _serverId: string,
      _areaId: number,
      signal: AbortSignal,
    ) => {
      signals.push(signal);
      return new Promise(() => undefined);
    });

    render(
      <TestAdminMapTab
        apiBaseUrl="https://manager.example.com"
        serverId="server-1"
        tileBaseUrl="https://map.example.com"
        metadata={metadata('world-a', 'World A')}
      />,
    );
    showClaimsLayer();
    const buttons = screen.getAllByRole('button', { name: 'mapMarketplace' });
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);

    await waitFor(() => expect(signals).toHaveLength(2));
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });
});

function showClaimsLayer() {
  fireEvent.click(screen.getByRole('checkbox', { name: 'mapLayerClaims' }));
}

function claim(overrides: Partial<MapClaim> = {}): MapClaim {
  return {
    areaId: 1,
    name: 'Claim',
    permission: 'owner',
    minX: 0,
    minZ: 0,
    width: 32,
    depth: 32,
    borderColor: '#ffffff',
    fillColor: '#000000',
    forSale: false,
    renewZone: false,
    marketplace: false,
    shop: false,
    ...overrides,
  };
}

function metadata(worldKey: string, worldName: string) {
  return {
    schemaVersion: 5 as const,
    worldKey,
    worldName,
    tileSize: 256,
    chunkSize: 32,
    pixelsPerBlock: 4,
    nativeTileSizeChunks: 2,
    minZoom: 0,
    nativeZoom: 8,
    generatedChunkBounds: { minX: -44, minZ: -50, maxX: -42, maxZ: -48 },
    generatedTileBounds: { minX: -22, minZ: -25, maxX: -21, maxZ: -24 },
    updatedAt: '2026-06-12T00:00:00.000Z',
    tileUrl: `https://map.example.com/server-1/{z}/{x}/{y}.png`,
  };
}
