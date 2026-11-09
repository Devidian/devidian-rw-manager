import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { ServerWithStatus } from '@/types/server';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    isSuperAdmin: false,
    hasAuthService: true,
    logout: vi.fn(),
  }),
}));

const intercomState = vi.hoisted(() => ({
  unreadCount: 0,
}));

vi.mock('@/context/GlobalIntercomContext', () => ({
  useGlobalIntercom: () => ({
    unreadCount: intercomState.unreadCount,
  }),
}));

const { AppSidebar } = await import('@/components/AppSidebar');

describe('app sidebar', () => {
  beforeEach(() => {
    intercomState.unreadCount = 0;
  });

  it('renders the Global Intercom navigation item and player counts for pinned servers', () => {
    render(
      <MemoryRouter>
        <SidebarProvider>
          <AppSidebar servers={[server()]} onlinePlayerCount={0} />
        </SidebarProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('globalIntercomChat')).toBeInTheDocument();
    expect(screen.getByText('Pinned Server')).toBeInTheDocument();
    expect(screen.getByText('3/12')).toBeInTheDocument();
  });

  it('shows the live server name instead of an imported server ID', () => {
    render(
      <MemoryRouter>
        <SidebarProvider>
          <AppSidebar servers={[{ ...server(), label: 'server-a' }]} onlinePlayerCount={0} />
        </SidebarProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('Pinned Server')).toBeInTheDocument();
    expect(screen.queryByText('server-a')).not.toBeInTheDocument();
  });

  it('uses the stored name while live query data is unavailable', () => {
    render(
      <MemoryRouter>
        <SidebarProvider>
          <AppSidebar servers={[{ ...server(), label: 'server-a', name: 'Development Server', queryData: undefined }]} onlinePlayerCount={0} />
        </SidebarProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('Development Server')).toBeInTheDocument();
  });

  it('renders the unread Global Intercom badge', () => {
    intercomState.unreadCount = 7;

    render(
      <MemoryRouter>
        <SidebarProvider>
          <AppSidebar servers={[]} onlinePlayerCount={0} />
        </SidebarProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('7')).toBeInTheDocument();
  });
});

function server(): ServerWithStatus {
  return {
    id: 'server-a',
    label: 'Pinned Server',
    queryUrl: 'https://server-a.example',
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
  };
}
