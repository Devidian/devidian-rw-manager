import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { ServerWithStatus } from '@/types/server';

const state = vi.hoisted(() => ({ fetch: vi.fn() }));
const playerId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const servers: ServerWithStatus[] = [
  { id: 'one', label: '<color=#ff0000>One</color>', queryUrl: 'https://one.example', createdAt: '', public: true, status: 'online', onlinePlayers: [{ id: playerId, uid: 'uid-1', name: 'Ada', platform: 'Steam', ping: 1 }] },
  { id: 'two', label: 'Two', queryUrl: 'https://two.example', createdAt: '', public: true, status: 'online', onlinePlayers: [{ id: playerId, uid: 'uid-1', name: 'Ada', platform: 'Steam', ping: 1 }] },
  { id: 'offline', label: 'Offline', queryUrl: 'https://offline.example', createdAt: '', public: true, status: 'offline', onlinePlayers: [{ id: playerId, uid: 'uid-1', name: 'Ada', platform: 'Steam', ping: 1 }] },
];

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/context/ServerContext', () => ({ useServerContext: () => ({ serverList: servers }) }));
vi.mock('@/context/StorageModeContext', () => ({ useStorageMode: () => ({ fixedBackendUrl: 'https://api.example', backendUrl: null }) }));

const { default: PlayerProfilePage } = await import('@/pages/PlayerProfilePage');

describe('player profile', () => {
  it('lists cached historical and current servers with available playtime', async () => {
    state.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ items: [
      { serverId: 'one', label: 'One', status: 'online', playtime: 7200 },
      { serverId: 'offline', label: 'Offline', status: 'offline', playtime: 1800 },
    ] }) });
    vi.stubGlobal('fetch', state.fetch);
    try {
      render(<MemoryRouter initialEntries={[`/player/${playerId}`]}><Routes><Route path="/player/:id" element={<PlayerProfilePage />} /></Routes></MemoryRouter>);
      expect(screen.getByRole('heading', { name: 'Ada' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'One' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'One' }).querySelector('[style*="color: rgb(255, 0, 0)"]')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Two' })).toBeInTheDocument();
      expect(await screen.findByRole('link', { name: 'Offline' })).toBeInTheDocument();
      expect(await screen.findByText('2.0 h')).toBeInTheDocument();
      expect(screen.getByText('0.5 h')).toBeInTheDocument();
      expect(state.fetch).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
