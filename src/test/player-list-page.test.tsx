import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerWithStatus } from '@/types/server';
import { listOnlinePlayers } from '@/lib/onlinePlayers';
import { usePublicOnlinePlayers } from '@/hooks/usePublicOnlinePlayers';

const state = vi.hoisted(() => ({
  isAuthenticated: false,
  backendUrl: null as string | null,
}));

const baseServerList: ServerWithStatus[] = [
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
    onlinePlayers: [{ id: 'aaaaaaaaaaaaaaaaaaaaaaaa', name: 'Ada', uid: 'standalone-player-uid', platform: 'Standalone', ping: 10 }],
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
    onlinePlayers: [{ id: 'bbbbbbbbbbbbbbbbbbbbbbbb', name: 'Steam Player', uid: '76561198000000000', platform: 'Steam', ping: 10 }],
  },
];
let serverList = baseServerList;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, params?: Record<string, unknown>) => params ? `${key}:${JSON.stringify(params)}` : key }),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: state.isAuthenticated }),
}));
const { default: PlayerListView } = await import('@/pages/PlayerListPage');
function PlayerListPage() {
  const names = usePublicOnlinePlayers(state.backendUrl, serverList, state.isAuthenticated);
  const players = listOnlinePlayers(serverList, names);
  return <><output aria-label="Navigation count">{players.length}</output><PlayerListView onlinePlayers={players} /></>;
}

describe('player list page', () => {
  beforeEach(() => {
    state.isAuthenticated = false;
    state.backendUrl = null;
    serverList = baseServerList;
  });

  it('lists online players by descending server capacity and links their server', () => {
    const { container } = render(<MemoryRouter><PlayerListPage /></MemoryRouter>);

    const rows = [...container.querySelectorAll('tbody tr')].map(row => row.textContent ?? '');
    expect(rows[0]).toContain('Steam Player');
    expect(rows[0]).toContain('8 / 20');
    expect(rows[1]).toContain('Ada');
    expect(rows[1]).toContain('1 / 12');
    expect(screen.getByRole('link', { name: 'Busy Server' })).toHaveAttribute('href', '/server/busy-server');
  });

  it('omits UID columns for guests and shows authorized Steam links to signed-in users', () => {
    const { rerender } = render(<MemoryRouter><PlayerListPage /></MemoryRouter>);
    expect(screen.queryByRole('columnheader', { name: 'uid' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Steam Player' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '76561198000000000' })).not.toBeInTheDocument();

    state.isAuthenticated = true;
    rerender(<MemoryRouter><PlayerListPage /></MemoryRouter>);
    expect(screen.getByRole('link', { name: '76561198000000000' })).toHaveAttribute('href', 'https://steamcommunity.com/profiles/76561198000000000');
    expect(screen.getByText('standalone-player-uid')).toBeInTheDocument();
  });

  it('keeps players with different names separate when their masked Steam IDs match', () => {
    serverList = [{ ...baseServerList[1], onlinePlayers: [
      { id: 'bbbbbbbbbbbbbbbbbbbbbbbb', name: 'Steam Player', uid: '7***************0', platform: 'Steam', ping: 10 },
      { id: 'cccccccccccccccccccccccc', name: 'Other Player', uid: '7***************0', platform: 'Steam', ping: 10 },
    ] }];
    render(<MemoryRouter><PlayerListPage /></MemoryRouter>);
    expect(screen.getByText('playerListSummary:{"count":2}')).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'uid' })).not.toBeInTheDocument();
  });

  it('keeps anonymous same-name slots separate without a durable mapping ID', () => {
    serverList = [{ ...baseServerList[1], onlinePlayers: [
      { id: 2, name: '**PRIVATE**', uid: '**PRIVATE**', platform: 'Standalone', ping: 10 },
      { id: 3, name: '**PRIVATE**', uid: '**PRIVATE**', platform: 'Standalone', ping: 12 },
    ] }];
    render(<MemoryRouter><PlayerListPage /></MemoryRouter>);
    expect(screen.getByText('playerListSummary:{"count":2}')).toBeInTheDocument();
  });

  it('adds names-only fallback rows from participating servers and keeps protected rows separate', async () => {
    state.isAuthenticated = true;
    state.backendUrl = 'https://manager.example';
    const legacy = { ...baseServerList[0], onlinePlayers: [], publicPlayerCount: 2 };
    serverList = [legacy, baseServerList[1], { ...legacy, id: 'master-only', masterOnly: true }];
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => (
      String(input).includes('/quiet-server/')
        ? Response.json({ names: ['Legacy player', 'Legacy player'], uid: 'do-not-render' })
        : Response.json({ names: ['Steam Player', 'Declined Player'] })
    ));
    try {
      render(<MemoryRouter><PlayerListPage /></MemoryRouter>);
      expect(await screen.findAllByText('Legacy player')).toHaveLength(2);
      expect(screen.getByText('playerListSummary:{"count":4}')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigation count')).toHaveTextContent('4');
      expect(screen.getByText('Declined Player')).toBeInTheDocument();
      expect(screen.getAllByText('Steam Player')).toHaveLength(1);
      expect(screen.queryByRole('link', { name: 'Declined Player' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Legacy player' })).not.toBeInTheDocument();
      expect(screen.queryByText('do-not-render')).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: '76561198000000000' })).toBeInTheDocument();
      expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
        'https://manager.example/api/storage/server/busy-server/guest-online-players',
        'https://manager.example/api/storage/server/quiet-server/guest-online-players',
      ]);
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('excludes master-only servers from the player list', () => {
    const active = { ...baseServerList[1], lastSeen: '2026-10-19T04:00:00.000Z' };
    const oldAddress = {
      ...active,
      id: 'old-address',
      masterOnly: true,
      queryUrl: 'https://old.example',
      lastSeen: '2026-10-15T04:00:00.000Z',
    };
    serverList = [baseServerList[0], oldAddress, active];

    const { container, rerender } = render(<MemoryRouter><PlayerListPage /></MemoryRouter>);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(screen.getByText('playerListSummary:{"count":2}')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Busy Server' })).toHaveAttribute('href', '/server/busy-server');

    serverList = [baseServerList[0], { ...oldAddress, lastSeen: '2026-10-20T04:00:00.000Z' }, active];
    rerender(<MemoryRouter><PlayerListPage /></MemoryRouter>);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Busy Server' })).toHaveAttribute('href', '/server/busy-server');
  });
});
