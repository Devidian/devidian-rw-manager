import { afterEach, expect, it, vi } from 'vitest';
import { LocalStorageAdapter } from '@/lib/storage';
import type { ServerConfig } from '@/types/server';

afterEach(() => vi.unstubAllGlobals());

it('keeps direct local player-list entries anonymous without a backend mapping', async () => {
  const fetchMock = vi.fn(async (input: string | URL) => ({ ok: true, json: async () =>
    String(input).endsWith('/playerlist') ? { players: [
      { id: 1, name: 'Alice', uid: '76561198000000001', platform: 'Steam', ping: 10 },
      { id: 2, name: 'Alice', uid: '76561198000000002', platform: 'Steam', ping: 11 },
    ] } : {} }));
  vi.stubGlobal('fetch', fetchMock);
  const server = { id: 'local', label: 'Local', queryUrl: 'https://game.example', createdAt: '' } as ServerConfig;
  const response = await new LocalStorageAdapter().getServerLiveStatus(server);
  expect(response.onlinePlayers).toEqual([
    { id: 1, name: '**PRIVATE**', uid: '**PRIVATE**', platform: 'Steam', ping: 10 },
    { id: 2, name: '**PRIVATE**', uid: '**PRIVATE**', platform: 'Steam', ping: 11 },
  ]);
});
