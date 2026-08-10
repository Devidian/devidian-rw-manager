import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { AuthUser, ServerConfig, ServerWithStatus } from '@/types/server';
import type { StorageAdapter } from '@/lib/storage';

const state = vi.hoisted(() => ({
  user: null as AuthUser | null,
  localPins: [] as string[],
  applyUserUpdate: vi.fn(),
}));

const servers: ServerConfig[] = [
  server('pinned-server'),
  server('admin-server', { adminUid: 'steam-admin' }),
  server('other-server'),
];

const statusMap = Object.fromEntries(
  servers.map((item) => [item.id, { ...item, status: 'online' as const } satisfies ServerWithStatus]),
);

const adapter: StorageAdapter = {
  getServers: vi.fn(async () => servers),
  refreshServers: vi.fn(async () => servers),
  addServer: vi.fn(),
  updateServer: vi.fn(),
  deleteServer: vi.fn(),
  getPinnedServers: vi.fn(async () => state.localPins),
  pinServer: vi.fn(),
  unpinServer: vi.fn(),
  setServerBlocked: vi.fn(),
  getServerLiveStatus: vi.fn(),
};

vi.mock('@/context/StorageModeContext', () => ({
  useStorageMode: () => ({ adapter, fixedBackendUrl: 'https://manager.example' }),
}));
vi.mock('@/context/BackendInfoContext', () => ({
  useBackendInfo: () => ({ services: ['storage'], maxPinnedServers: 1 }),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: state.user,
    applyUserUpdate: state.applyUserUpdate,
  }),
}));
vi.mock('@/hooks/useServers', () => ({
  useServers: () => ({
    servers,
    refreshServers: vi.fn(),
    addServer: vi.fn(),
    updateServer: vi.fn(),
    setServerBlocked: vi.fn(),
    removeServer: vi.fn(),
    getServer: vi.fn(),
  }),
}));
vi.mock('@/hooks/useServerStatus', () => ({
  useServerStatus: () => ({
    statusMap,
    refreshAll: vi.fn(),
    refreshServerList: vi.fn(),
    refreshOne: vi.fn(),
  }),
}));

const { ServerProvider, useServerContext } = await import('@/context/ServerContext');

function Probe() {
  const { serverList, pinnedServerList, dashboardServerList, isPinned, canPinServer, pinLimitReached } = useServerContext();
  return (
    <div>
      <div data-testid="all">{serverList.map((item) => item.id).join(',')}</div>
      <div data-testid="pinned">{pinnedServerList.map((item) => item.id).join(',')}</div>
      <div data-testid="dashboard">{dashboardServerList.map((item) => item.id).join(',')}</div>
      <div data-testid="is-pinned">{String(isPinned('pinned-server'))}</div>
      <div data-testid="can-pin-other">{String(canPinServer('other-server'))}</div>
      <div data-testid="limit-reached">{String(pinLimitReached)}</div>
    </div>
  );
}

function Wrapper({ children }: { children: ReactNode }) {
  return <ServerProvider>{children}</ServerProvider>;
}

describe('server context filtering', () => {
  beforeEach(() => {
    state.user = null;
    state.localPins = [];
    state.applyUserUpdate.mockClear();
    vi.clearAllMocks();
  });

  it('keeps the full server list while filtering navigation and dashboard by user pins only', () => {
    state.user = {
      id: 'user-1',
      role: 'user',
      steamId: 'steam-admin',
      pinnedServers: ['pinned-server'],
    };

    render(<Probe />, { wrapper: Wrapper });

    expect(screen.getByTestId('all')).toHaveTextContent('pinned-server,admin-server,other-server');
    expect(screen.getByTestId('pinned')).toHaveTextContent('pinned-server');
    expect(screen.getByTestId('dashboard')).toHaveTextContent('pinned-server');
    expect(screen.getByTestId('is-pinned')).toHaveTextContent('true');
    expect(screen.getByTestId('can-pin-other')).toHaveTextContent('false');
    expect(screen.getByTestId('limit-reached')).toHaveTextContent('true');
  });

  it('uses anonymous local pins when no user is signed in', async () => {
    state.localPins = ['other-server'];

    render(<Probe />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByTestId('pinned')).toHaveTextContent('other-server'));
    expect(screen.getByTestId('dashboard')).toHaveTextContent('other-server');
    expect(screen.getByTestId('is-pinned')).toHaveTextContent('false');
  });
});

function server(id: string, overrides: Partial<ServerConfig> = {}): ServerConfig {
  return {
    id,
    label: id,
    queryUrl: `https://${id}.example`,
    createdAt: '2026-06-12T00:00:00.000Z',
    ...overrides,
  };
}
