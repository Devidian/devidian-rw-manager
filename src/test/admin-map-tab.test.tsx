import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { vi } from 'vitest';
import { AdminMapTab } from '@/components/AdminMapTab';
import type { MapClaim } from '@/types/adminMapping';

const mapContainerProps = vi.hoisted(() => ({
  current: null as ComponentProps<'div'> & Record<string, unknown> | null,
  mounts: 0,
  unmounts: 0,
  invalidations: 0,
}));

const tileLayerUrls = vi.hoisted(() => [] as string[]);
const mapLayerState = vi.hoisted(() => ({
  claims: [] as MapClaim[],
}));
const fetchMarketplaceOffersMock = vi.hoisted(() => vi.fn());
const refreshClaimsMock = vi.hoisted(() => vi.fn());

vi.mock('leaflet', async (importOriginal) => {
  const actual = await importOriginal<typeof import('leaflet')>();
  return {
    ...actual,
    TileLayer: class {
      constructor(public url: string) {
        tileLayerUrls.push(url);
      }

      addTo() {
        return this;
      }

      remove() {}

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
  Marker: () => null,
  Popup: (props: ComponentProps<'div'>) => <div>{props.children}</div>,
  Rectangle: (props: ComponentProps<'div'> & Record<string, unknown>) => (
    <div data-testid="map-rectangle">{props.children}</div>
  ),
  Tooltip: () => null,
  useMap: () => ({
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    invalidateSize: () => {
      mapContainerProps.invalidations += 1;
    },
    getContainer: () => document.createElement('div'),
  }),
  useMapEvents: () => ({
    getBounds: vi.fn(),
  }),
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
      mapLayers={{
        capabilities: {
          claims: true,
          players: true,
          gpsGlobalMarkers: true,
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
    mapLayerState.claims = [];
    fetchMarketplaceOffersMock.mockReset();
    refreshClaimsMock.mockReset();
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
