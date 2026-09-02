import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerWithStatus } from '@/types/server';

const state = vi.hoisted(() => ({
  isAuthenticated: false,
}));

const serverList: ServerWithStatus[] = [
  {
    id: 'quiet-server',
    label: 'Quiet Server',
    queryUrl: 'https://quiet.example',
    createdAt: '2026-07-28T00:00:00.000Z',
    status: 'online',
    queryData: {
      version: '0.9.9', legacy: false, ip: '127.0.0.1', port: 4255, steamid: 1, contact: '', name: 'Quiet Server', map: 'World A', os: 'linux', uptime: 1,
      visible: true, locked: false, whitelist: false, pvp: false, pve: true, gamemode: 0, peaceful: false, maxplayers: 12, playercount: 1, mods: false,
    },
    onlinePlayers: [{ id: 1, name: 'Ada', uid: 'standalone-player-uid', platform: 'Standalone', ping: 10 }],
  },
  {
    id: 'busy-server',
    label: 'Busy Server',
    queryUrl: 'https://busy.example',
    createdAt: '2026-07-28T00:00:00.000Z',
    status: 'online',
    queryData: {
      version: '0.9.9', legacy: false, ip: '127.0.0.2', port: 4255, steamid: 2, contact: '', name: 'Busy Server', map: 'World B', os: 'linux', uptime: 1,
      visible: true, locked: false, whitelist: false, pvp: false, pve: true, gamemode: 0, peaceful: false, maxplayers: 20, playercount: 8, mods: false,
    },
    onlinePlayers: [{ id: 2, name: 'Steam Player', uid: '76561198000000000', platform: 'Steam', ping: 10 }],
  },
];

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, params?: Record<string, unknown>) => params ? `${key}:${JSON.stringify(params)}` : key }),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: state.isAuthenticated }),
}));
vi.mock('@/context/ServerContext', () => ({
  useServerContext: () => ({ serverList }),
}));

const { default: PlayerListPage } = await import('@/pages/PlayerListPage');

describe('player list page', () => {
  beforeEach(() => {
    state.isAuthenticated = false;
  });

  it('lists online players by descending server capacity and links their server', () => {
    const { container } = render(<MemoryRouter><PlayerListPage /></MemoryRouter>);

    const rows = [...container.querySelectorAll('tbody tr')].map(row => row.textContent ?? '');
    expect(rows[0]).toContain('Steam Player');
    expect(rows[0]).toContain('1 / 20');
    expect(rows[1]).toContain('Ada');
    expect(rows[1]).toContain('1 / 12');
    expect(screen.getByRole('link', { name: 'Busy Server' })).toHaveAttribute('href', '/server/busy-server');
  });

  it('masks UIDs for guests and exposes Steam profile links to authenticated users', () => {
    const { rerender } = render(<MemoryRouter><PlayerListPage /></MemoryRouter>);
    expect(screen.getByText('7656*********0000')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '76561198000000000' })).not.toBeInTheDocument();

    state.isAuthenticated = true;
    rerender(<MemoryRouter><PlayerListPage /></MemoryRouter>);
    expect(screen.getByRole('link', { name: '76561198000000000' })).toHaveAttribute('href', 'https://steamcommunity.com/profiles/76561198000000000');
    expect(screen.getByText('standalone-player-uid')).toBeInTheDocument();
  });
});
