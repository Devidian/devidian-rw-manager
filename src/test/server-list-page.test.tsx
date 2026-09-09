import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerWithStatus } from '@/types/server';

const state = vi.hoisted(() => ({
  pinServer: vi.fn(),
  unpinServer: vi.fn(),
  setServerBlocked: vi.fn(async () => undefined),
  isPinned: vi.fn((id: string) => id === 'server-a'),
  isSuperAdmin: false,
  isAdmin: false,
  pinLimitReached: false,
}));

const serverList: ServerWithStatus[] = [
  {
    id: 'server-a',
    label: 'Pinned Server',
    queryUrl: 'https://server-a.example',
    mapUrl: 'https://maps.example/server-a',
    pluginListAvailable: true,
    ozToolsInstalled: true,
    addr: '127.0.0.1:4255',
    createdAt: '2026-06-12T00:00:00.000Z',
    status: 'online',
    queryData: {
      version: '0.9.9',
      legacy: false,
      ip: '127.0.0.1',
      port: 4255,
      steamid: 1,
      contact: '',
      name: 'Pinned Server',
      map: 'World A',
      os: 'linux',
      uptime: 1,
      visible: true,
      locked: false,
      whitelist: false,
      pvp: false,
      pve: true,
      gamemode: 0,
      peaceful: false,
      maxplayers: 12,
      playercount: 3,
      mods: false,
    },
  },
  {
    id: 'server-b',
    label: 'Offline Server',
    queryUrl: 'https://server-b.example',
    createdAt: '2026-06-12T00:00:00.000Z',
    status: 'offline',
  },
  {
    id: 'server-c',
    label: 'Busy Server',
    queryUrl: 'https://server-c.example',
    createdAt: '2026-06-12T00:00:00.000Z',
    status: 'online',
    queryData: {
      version: '0.9.9',
      legacy: false,
      ip: '127.0.0.3',
      port: 4255,
      steamid: 3,
      contact: '',
      name: 'Busy Server',
      map: 'World C',
      os: 'windows',
      uptime: 1,
      visible: true,
      locked: true,
      whitelist: false,
      pvp: false,
      pve: true,
      gamemode: 0,
      peaceful: false,
      maxplayers: 12,
      playercount: 8,
      mods: false,
    },
  },
];

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, params?: Record<string, unknown>) => params ? `${key}:${JSON.stringify(params)}` : key }),
}));
vi.mock('@/context/ServerContext', () => ({
  useServerContext: () => ({
    serverList,
    refreshAll: vi.fn(),
    refreshServerList: vi.fn(),
    refreshOne: vi.fn(),
    pinServer: state.pinServer,
    unpinServer: state.unpinServer,
    setServerBlocked: state.setServerBlocked,
    isPinned: state.isPinned,
    canPinServer: (id: string) => state.isPinned(id) || !state.pinLimitReached,
    pinLimitReached: state.pinLimitReached,
    maxPinnedServers: 50,
  }),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    isSuperAdmin: state.isSuperAdmin,
    isAdmin: state.isAdmin,
  }),
}));

const { default: ServerListPage } = await import('@/pages/ServerListPage');

describe('server list page', () => {
  beforeEach(() => {
    state.pinServer.mockClear();
    state.unpinServer.mockClear();
    state.setServerBlocked.mockClear();
    state.isPinned.mockClear();
    state.isSuperAdmin = false;
    state.isAdmin = false;
    state.pinLimitReached = false;
  });

  it('warns at the configured limit and disables only new favorites', () => {
    state.pinLimitReached = true;
    render(<MemoryRouter><ServerListPage /></MemoryRouter>);

    expect(screen.getByText('pinnedServerLimitTitle')).toBeInTheDocument();
    expect(screen.getAllByTitle('pinnedServerLimitAction:{"max":50}')[0]).toBeDisabled();
    expect(screen.getByTitle('unpinServer')).toBeEnabled();
  });

  it('hides offline servers for regular users and toggles pin state through the server context', () => {
    render(
      <MemoryRouter>
        <ServerListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Pinned Server')).toBeInTheDocument();
    expect(screen.queryByText('Offline Server')).not.toBeInTheDocument();
    expect(screen.getByText('127.0.0.1:4255')).toBeInTheDocument();
    expect(screen.getByText('World A')).toHaveClass('font-bold');
    expect(screen.getByText(/serverListDetails:\{"windows":1,"linux":1,"password":1\}/)).toBeInTheDocument();
    expect(screen.getByLabelText('Windows')).toBeInTheDocument();
    expect(screen.getByLabelText('Linux')).toBeInTheDocument();
    expect(screen.getByTitle('OZ Tools')).toBeInTheDocument();
    expect(screen.getByLabelText('locked')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('unpinServer'));
    expect(state.unpinServer).toHaveBeenCalledWith('server-a');

    fireEvent.click(screen.getAllByTitle('pinServer')[0]);
    expect(state.pinServer).toHaveBeenCalledWith('server-c');
  });

  it('lets admins include offline servers', () => {
    state.isAdmin = true;
    render(<MemoryRouter><ServerListPage /></MemoryRouter>);

    fireEvent.click(screen.getByRole('switch'));
    expect(screen.getByText('Offline Server')).toBeInTheDocument();
  });

  it('keeps pinned servers first, then sorts online servers by players and name', () => {
    const { container } = render(
      <MemoryRouter>
        <ServerListPage />
      </MemoryRouter>,
    );

    const rows = [...container.querySelectorAll('tbody tr')].map((row) => row.textContent ?? '');
    expect(rows[0]).toContain('Pinned Server');
    expect(rows[1]).toContain('Busy Server');
    expect(rows).toHaveLength(2);
  });

  it('allows super admins to toggle server blocking', () => {
    state.isSuperAdmin = true;
    render(
      <MemoryRouter>
        <ServerListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByTitle('blockServer')[0]);
    return waitFor(() => expect(state.setServerBlocked).toHaveBeenCalledWith('server-a', true));
  });
});
