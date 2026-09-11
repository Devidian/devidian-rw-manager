import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerWithStatus } from '@/types/server';
import { TooltipProvider } from '@/components/ui/tooltip';

const state = vi.hoisted(() => ({
  mapAvailable: true,
  fixedBackendUrl: 'https://manager.example' as string | null,
  getServerStatistics: vi.fn(),
  isAuthenticated: true,
  userSteamId: 'steam-admin',
  dbPlayers: [] as Array<{ uid: string; name?: string; platform?: string }>,
  fetchPlayers: vi.fn(),
  useMapLayers: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));
vi.mock('@/context/ServerContext', () => ({
  useServerContext: () => ({ updateServer: vi.fn(), setServerBlocked: vi.fn() }),
}));
vi.mock('@/context/StorageModeContext', () => ({
  useStorageMode: () => ({
    mode: 'fixed',
    fixedBackendUrl: state.fixedBackendUrl,
    backendUrl: null,
    adapter: { getServerStatistics: state.getServerStatistics },
  }),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ isAdmin: false, isAuthenticated: state.isAuthenticated, isSuperAdmin: false, user: { steamId: state.userSteamId } }),
}));
vi.mock('@/hooks/useDatabasePlayers', () => ({
  useDatabasePlayers: () => ({ players: state.dbPlayers, loading: false, error: null, fetchPlayers: state.fetchPlayers }),
}));
vi.mock('@/hooks/useMapLayers', () => ({
  useMapLayers: (...args: unknown[]) => state.useMapLayers(...args),
}));
vi.mock('@/hooks/useServerConfig', () => ({
  useServerConfig: () => ({ config: null, loading: false, error: null, fetchConfig: vi.fn() }),
}));
vi.mock('@/hooks/useAdminMapping', () => ({
  useAdminMapping: () => ({
    map: state.mapAvailable ? { available: true, metadata: { worldKey: 'world-1' } } : { available: false },
    plugins: [],
    pluginsAvailable: true,
    pluginsLoading: false,
    pluginsError: false,
    admins: ['steam-admin'],
  }),
}));
vi.mock('@/components/AdminMapTab', () => ({
  AdminMapTab: () => <div>map-content</div>,
}));
vi.mock('@/components/PluginsTab', () => ({
  PluginsTab: () => <div>plugin-content</div>,
}));

const { ServerDetail } = await import('@/components/ServerDetail');

describe('server detail mapping tabs', () => {
  beforeEach(() => {
    state.mapAvailable = true;
    state.fixedBackendUrl = 'https://manager.example';
    state.isAuthenticated = true;
    state.userSteamId = 'steam-admin';
    state.dbPlayers = [];
    state.fetchPlayers.mockClear();
    state.fetchPlayers.mockResolvedValue(undefined);
    state.useMapLayers.mockReset();
    state.useMapLayers.mockReturnValue({
      capabilities: null,
      claims: [],
      players: [],
      gpsGlobalMarkers: [],
      error: false,
      refreshClaims: vi.fn(),
      marketplaceOffersDelta: null,
    });
    state.getServerStatistics.mockResolvedValue({
      serverId: 'server-1',
      buckets: [
        {
          id: 'bucket-1',
          serverId: 'server-1',
          hourStart: '2026-06-25T10:00:00.000Z',
          sampleCount: 2,
          onlineSampleCount: 2,
          playerSampleTotal: 6,
          maxPlayers: 4,
          averagePlayers: 3,
          availability: 100,
          updatedAt: '2026-06-25T10:30:00.000Z',
        },
      ],
    });
  });

  it('renders description line breaks and keeps unsupported HTML as text', () => {
    const target = server();
    target.infoData = {
      name: 'New World', shortname: '', contact: '', headerimage: false,
      description: String.raw`<b>Description title</b>\nNext line\n<img src=x onerror=alert(1)>`,
    };
    const { container } = render(<ServerDetail server={target} onRefresh={vi.fn()} />);
    const title = screen.getByText('Description title');
    expect(title.tagName).toBe('STRONG');
    expect(title.parentElement).toHaveClass('whitespace-pre-wrap');
    expect(title.parentElement?.textContent).toBe('Description title\nNext line\n<img src=x onerror=alert(1)>');
    expect(container.querySelector('img[onerror]')).toBeNull();
  });

  it('orders players, available map, plugins, and configuration tabs', () => {
    render(<ServerDetail server={server()} onRefresh={vi.fn()} />);

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'overview',
      'players1',
      'statistics',
      'map',
      'globalMarketplace',
      'plugins',
      'configuration',
    ]);
  });

  it('hides only the map tab when no rendered map is available', () => {
    state.mapAvailable = false;
    render(<ServerDetail server={server()} onRefresh={vi.fn()} />);

    expect(screen.queryByRole('tab', { name: 'map' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'plugins' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'configuration' })).toBeInTheDocument();
  });

  it('hides map and plugin tabs without a backend', () => {
    state.fixedBackendUrl = null;
    render(<ServerDetail server={server(null)} onRefresh={vi.fn()} />);

    expect(screen.queryByRole('tab', { name: 'map' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'plugins' })).not.toBeInTheDocument();
  });

  it('hides configuration from authenticated users who are not server admins', () => {
    state.userSteamId = 'steam-user';
    render(<ServerDetail server={server()} onRefresh={vi.fn()} />);

    expect(screen.queryByRole('tab', { name: 'configuration' })).not.toBeInTheDocument();
  });

  it('opens the statistics tab without shadowing the Map constructor', async () => {
    render(<ServerDetail server={server()} onRefresh={vi.fn()} />);

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'statistics' }), { button: 0, ctrlKey: false });

    await waitFor(() => expect(state.getServerStatistics).toHaveBeenCalled());
  });

  it('starts player baselines for the detail and keeps them across tab changes', async () => {
    render(<ServerDetail server={server()} onRefresh={vi.fn()} />);

    await waitFor(() => expect(state.fetchPlayers).toHaveBeenCalledTimes(1));
    expect(state.fetchPlayers).toHaveBeenCalledWith('https://manager.example', 'server-1');
    expect(state.useMapLayers).toHaveBeenLastCalledWith(
      'https://manager.example',
      'server-1',
      'world-1',
      expect.any(Array),
      state.dbPlayers,
    );

    fireEvent.mouseDown(screen.getByRole('tab', { name: /^players/ }), { button: 0, ctrlKey: false });
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'map' }), { button: 0, ctrlKey: false });
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'overview' }), { button: 0, ctrlKey: false });

    expect(state.fetchPlayers).toHaveBeenCalledTimes(1);
  });

  it('masks player UIDs and hides Steam profile links for guests', () => {
    state.isAuthenticated = false;
    state.dbPlayers = [{ uid: '76561198000000001', name: 'Db Steam', platform: 'Steam' }];
    render(
      <TooltipProvider>
        <ServerDetail server={server()} onRefresh={vi.fn()} />
      </TooltipProvider>,
    );

    fireEvent.mouseDown(screen.getByRole('tab', { name: /^players/ }), { button: 0, ctrlKey: false });

    expect(screen.getAllByText('7656*********0001')).toHaveLength(2);
    expect(screen.queryByRole('link', { name: '76561198000000001' })).not.toBeInTheDocument();
  });
});

function server(backendUrl: string | null = 'https://backend.example'): ServerWithStatus {
  return {
    id: 'server-1',
    label: 'New World',
    queryUrl: 'https://query.example',
    backendUrl: backendUrl ?? undefined,
    createdAt: '2026-06-12T00:00:00.000Z',
    status: 'online',
    onlinePlayers: [{ id: 1, uid: '76561198000000001', name: 'Online Steam', platform: 'Steam', ping: 10 }],
  };
}
