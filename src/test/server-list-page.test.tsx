import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerWithStatus } from '@/types/server';

const state = vi.hoisted(() => ({
  pinServer: vi.fn(),
  unpinServer: vi.fn(),
  isPinned: vi.fn((id: string) => id === 'server-a'),
}));

const serverList: ServerWithStatus[] = [
  {
    id: 'server-a',
    label: 'Pinned Server',
    queryUrl: 'https://server-a.example',
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
    label: 'Unpinned Server',
    queryUrl: 'https://server-b.example',
    createdAt: '2026-06-12T00:00:00.000Z',
    status: 'offline',
  },
];

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, params?: Record<string, unknown>) => params ? `${key}:${JSON.stringify(params)}` : key }),
}));
vi.mock('@/context/ServerContext', () => ({
  useServerContext: () => ({
    serverList,
    refreshAll: vi.fn(),
    refreshOne: vi.fn(),
    pinServer: state.pinServer,
    unpinServer: state.unpinServer,
    isPinned: state.isPinned,
  }),
}));

const { default: ServerListPage } = await import('@/pages/ServerListPage');

describe('server list page', () => {
  beforeEach(() => {
    state.pinServer.mockClear();
    state.unpinServer.mockClear();
    state.isPinned.mockClear();
  });

  it('renders all servers and toggles pin state through the server context', () => {
    render(
      <MemoryRouter>
        <ServerListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Pinned Server')).toBeInTheDocument();
    expect(screen.getByText('Unpinned Server')).toBeInTheDocument();
    expect(screen.getByText('127.0.0.1:4255')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('unpinServer'));
    expect(state.unpinServer).toHaveBeenCalledWith('server-a');

    fireEvent.click(screen.getByTitle('pinServer'));
    expect(state.pinServer).toHaveBeenCalledWith('server-b');
  });
});
