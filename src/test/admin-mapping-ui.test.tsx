import { render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PluginsTab } from '@/components/PluginsTab';
import { useAdminMapping } from '@/hooks/useAdminMapping';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('admin mapping UI', () => {
  it('renders plugin loading, empty, error, valid, and invalid states', () => {
    const { rerender } = render(<PluginsTab plugins={[]} loading error={false} />);
    expect(screen.getByText('loadingPlugins')).toBeInTheDocument();

    rerender(<PluginsTab plugins={[]} loading={false} error />);
    expect(screen.getByText('backendError')).toBeInTheDocument();

    rerender(<PluginsTab plugins={[]} loading={false} error={false} />);
    expect(screen.getByText('noPlugins')).toBeInTheDocument();

    rerender(<PluginsTab plugins={[
      { directory: 'OZAdminUtils', name: 'Admin Utils', version: '0.7.0', valid: true },
      { directory: 'Broken', valid: false },
    ]} loading={false} error={false} />);
    expect(screen.getByText('Admin Utils')).toBeInTheDocument();
    expect(screen.getByText('0.7.0')).toBeInTheDocument();
    expect(screen.getByText('invalidPlugin')).toBeInTheDocument();
  });

  it('keeps map availability when the plugin endpoint fails', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(response(mapResponse()))
      .mockResolvedValueOnce(response({}, 500));

    const { result } = renderHook(() => useAdminMapping('https://backend.example/', 'server-1'));

    await waitFor(() => expect(result.current.map.available).toBe(true));
    await waitFor(() => expect(result.current.pluginsError).toBe(true));
    expect(result.current.mapError).toBe(false);
    expect(result.current.plugins).toEqual([]);
  });

  it('hides map data when schema-5 validation fails', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(response(mapResponse({ schemaVersion: 4 })))
      .mockResolvedValueOnce(response({ items: [] }));

    const { result } = renderHook(() => useAdminMapping('https://backend.example', 'server-1'));

    await waitFor(() => expect(result.current.mapError).toBe(true));
    expect(result.current.map).toEqual({ available: false });
    expect(result.current.pluginsError).toBe(false);
  });

  it('does not request map or plugins without a backend or server id', () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const { result } = renderHook(() => useAdminMapping());

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.map).toEqual({ available: false });
    expect(result.current.plugins).toEqual([]);

    renderHook(() => useAdminMapping('https://backend.example'));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mapResponse(overrides: Record<string, unknown> = {}) {
  return {
    available: true,
    metadata: {
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
      ...overrides,
    },
  };
}
