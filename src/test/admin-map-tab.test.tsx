import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { vi } from 'vitest';
import { AdminMapTab } from '@/components/AdminMapTab';

const mapContainerProps = vi.hoisted(() => ({
  current: null as ComponentProps<'div'> & Record<string, unknown> | null,
  mounts: 0,
  unmounts: 0,
}));

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
  Popup: () => null,
  Rectangle: () => null,
  Tooltip: () => null,
  useMap: () => ({
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    invalidateSize: vi.fn(),
  }),
  useMapEvents: () => ({
    getBounds: vi.fn(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/hooks/useMapLayers', () => ({
  useMapLayers: () => ({
    capabilities: null,
    claims: [],
    players: [],
    error: false,
  }),
  fetchMarketplaceOffers: vi.fn(),
}));

describe('AdminMapTab', () => {
  beforeEach(() => {
    mapContainerProps.mounts = 0;
    mapContainerProps.unmounts = 0;
  });

  it('initially fits generated tiles without locking map panning to them', () => {
    render(
      <AdminMapTab
        backendUrl="https://backend.example.com/"
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
          tileUrl: '/api/data/server/map/tiles/new-world/{z}/{x}/{y}.png',
        }}
      />,
    );

    expect(mapContainerProps.current?.bounds).toBeDefined();
    expect(mapContainerProps.current?.maxBounds).toBeUndefined();
  });

  it('recreates the Leaflet map when the selected world changes', () => {
    const { rerender } = render(
      <AdminMapTab
        backendUrl="https://backend.example.com"
        metadata={metadata('world-a', 'World A')}
      />,
    );
    rerender(
      <AdminMapTab
        backendUrl="https://backend.example.com"
        metadata={metadata('world-b', 'World B')}
      />,
    );

    expect(mapContainerProps.mounts).toBe(2);
    expect(mapContainerProps.unmounts).toBe(1);
  });

  it('keeps layer selectors visible when the map enters fullscreen mode', () => {
    render(
      <AdminMapTab
        backendUrl="https://backend.example.com"
        metadata={metadata('world-a', 'World A')}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /mapFullscreen/i }));

    expect(screen.getByRole('button', { name: /mapExitFullscreen/i })).toBeInTheDocument();
    expect(screen.getByText('mapLayerSectors')).toBeInTheDocument();
    expect(screen.getByText('mapLayerOnlinePlayers')).toBeInTheDocument();
  });
});

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
    tileUrl: `/api/data/server/map/tiles/${worldKey}/{z}/{x}/{y}.png`,
  };
}
