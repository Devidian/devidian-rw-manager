import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerWithStatus } from '@/types/server';

const state = vi.hoisted(() => ({
  setServerBlocked: vi.fn(async () => undefined),
  isSuperAdmin: false,
  isAdmin: false,
  isAuthenticated: false,
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
    setServerBlocked: state.setServerBlocked,
  }),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    isSuperAdmin: state.isSuperAdmin,
    isAdmin: state.isAdmin,
    isAuthenticated: state.isAuthenticated,
  }),
}));

const { default: ServerListPage } = await import('@/pages/ServerListPage');

describe('server list page', () => {
  beforeEach(() => {
    state.setServerBlocked.mockClear();
    state.isSuperAdmin = false;
    state.isAdmin = false;
    state.isAuthenticated = false;
  });

  it('shows the public list without pin controls', () => {
    render(<MemoryRouter><ServerListPage /></MemoryRouter>);
    expect(screen.getByText('Offline Server')).toBeInTheDocument();
    expect(screen.queryByTitle('pinServer')).not.toBeInTheDocument();
  });

  it('shows offline servers and server details to guests', () => {
    render(
      <MemoryRouter>
        <ServerListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Pinned Server')).toBeInTheDocument();
    expect(screen.getByText('Offline Server')).toBeInTheDocument();
    expect(screen.getByText('127.0.0.1:4255')).toBeInTheDocument();
    expect(screen.getByText('World A')).toHaveClass('font-bold');
    expect(screen.getByText(/serverListDetails:\{"windows":1,"linux":1,"password":1\}/)).toBeInTheDocument();
    expect(screen.getByLabelText('Windows')).toBeInTheDocument();
    expect(screen.getByLabelText('Linux')).toBeInTheDocument();
    expect(screen.getByTitle('OZ Tools')).toBeInTheDocument();
    expect(screen.getByLabelText('locked')).toBeInTheDocument();

  });

  it('shows offline servers to admins', () => {
    state.isAdmin = true;
    render(<MemoryRouter><ServerListPage /></MemoryRouter>);

    expect(screen.getByText('Offline Server')).toBeInTheDocument();
  });

  it('uses equal-sized icon badges with status and OS tooltips', () => {
    serverList[1].status = 'unknown';
    try {
      render(<MemoryRouter><ServerListPage /></MemoryRouter>);

      const badges = [
        screen.getAllByTitle('online')[0],
        screen.getByTitle('unknown'),
        screen.getByTitle('Windows'),
        screen.getByTitle('Linux'),
        screen.getByTitle('locked'),
        screen.getByTitle('OZ Tools'),
      ];
      for (const badge of badges) expect(badge).toHaveClass('h-5', 'w-7', 'p-0');
      expect(screen.getByTitle('unknown').textContent).toBe('');
      expect(screen.getByTitle('unknown').querySelector('.status-dot-unknown')).toBeInTheDocument();
      expect(screen.getByTitle('Windows')).toHaveAttribute('aria-label', 'Windows');
      expect(screen.getByTitle('Linux')).toHaveAttribute('aria-label', 'Linux');
    } finally {
      serverList[1].status = 'offline';
    }
  });

  it('sorts online servers by players and name, with offline servers retained', () => {
    const { container } = render(
      <MemoryRouter>
        <ServerListPage />
      </MemoryRouter>,
    );

    const rows = [...container.querySelectorAll('tbody tr')].map((row) => row.textContent ?? '');
    expect(rows[0]).toContain('Busy Server');
    expect(rows[1]).toContain('Pinned Server');
    expect(rows[2]).toContain('Offline Server');
  });

  it('allows super admins to toggle server blocking', () => {
    state.isSuperAdmin = true;
    state.isAuthenticated = true;
    render(
      <MemoryRouter>
        <ServerListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByTitle('blockServer')[0]);
    return waitFor(() => expect(state.setServerBlocked).toHaveBeenCalledWith('server-c', true));
  });
});
