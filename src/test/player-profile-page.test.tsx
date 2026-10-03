import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { ServerWithStatus } from '@/types/server';

const state = vi.hoisted(() => ({ fetch: vi.fn() }));
const servers: ServerWithStatus[] = [
  { id: 'one', label: 'One', queryUrl: 'https://one.example', createdAt: '', status: 'online', onlinePlayers: [{ id: 1, uid: 'uid-1', name: 'Ada', platform: 'Steam', ping: 1 }] },
  { id: 'two', label: 'Two', queryUrl: 'https://two.example', createdAt: '', status: 'online', onlinePlayers: [{ id: 2, uid: 'uid-1', name: 'Ada', platform: 'Steam', ping: 1 }] },
  { id: 'offline', label: 'Offline', queryUrl: 'https://offline.example', createdAt: '', status: 'offline', onlinePlayers: [{ id: 3, uid: 'uid-1', name: 'Ada', platform: 'Steam', ping: 1 }] },
];

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/context/ServerContext', () => ({ useServerContext: () => ({ serverList: servers }) }));
vi.mock('@/context/StorageModeContext', () => ({ useStorageMode: () => ({ fixedBackendUrl: 'https://api.example', backendUrl: null }) }));

const { default: PlayerProfilePage } = await import('@/pages/PlayerProfilePage');

describe('player profile', () => {
  it('lists every current server and available per-server playtime', async () => {
    state.fetch.mockImplementation((url: string) => Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [{ uid: 'uid-1', playtime: url.includes('/one/') ? 7200 : 1800 }] }) }));
    vi.stubGlobal('fetch', state.fetch);
    try {
      render(<MemoryRouter initialEntries={['/player/uid-1']}><Routes><Route path="/player/:uid" element={<PlayerProfilePage />} /></Routes></MemoryRouter>);
      expect(screen.getByRole('heading', { name: 'Ada' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'One' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Two' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Offline' })).not.toBeInTheDocument();
      expect(await screen.findByText('2.0 h')).toBeInTheDocument();
      expect(screen.getByText('0.5 h')).toBeInTheDocument();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
