import { render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { vi } from 'vitest';
import { AdminMapTab } from '@/components/AdminMapTab';

const mapContainerProps = vi.hoisted(() => ({
  current: null as ComponentProps<'div'> & Record<string, unknown> | null,
}));

vi.mock('react-leaflet', () => ({
  MapContainer: (props: ComponentProps<'div'> & Record<string, unknown>) => {
    mapContainerProps.current = props;
    return <div>{props.children}</div>;
  },
  useMap: () => ({
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('AdminMapTab', () => {
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
});
