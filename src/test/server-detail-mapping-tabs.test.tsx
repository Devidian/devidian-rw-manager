import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerWithStatus } from '@/types/server';

const state = vi.hoisted(() => ({
  mapAvailable: true,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));
vi.mock('@/context/ServerContext', () => ({
  useServerContext: () => ({ updateServer: vi.fn() }),
}));
vi.mock('@/context/StorageModeContext', () => ({
  useStorageMode: () => ({ mode: 'fixed' }),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ isAdmin: false, isAuthenticated: true }),
}));
vi.mock('@/hooks/useDatabasePlayers', () => ({
  useDatabasePlayers: () => ({ players: [], loading: false, error: null, fetchPlayers: vi.fn() }),
}));
vi.mock('@/hooks/useServerConfig', () => ({
  useServerConfig: () => ({ config: null, loading: false, error: null, fetchConfig: vi.fn() }),
}));
vi.mock('@/hooks/useAdminMapping', () => ({
  useAdminMapping: () => ({
    map: state.mapAvailable ? { available: true, metadata: {} } : { available: false },
    plugins: [],
    pluginsLoading: false,
    pluginsError: false,
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
  });

  it('orders players, available map, plugins, and configuration tabs', () => {
    render(<ServerDetail server={server()} onRefresh={vi.fn()} />);

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'overview',
      'players',
      'map',
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
    render(<ServerDetail server={server(null)} onRefresh={vi.fn()} />);

    expect(screen.queryByRole('tab', { name: 'map' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'plugins' })).not.toBeInTheDocument();
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
  };
}
