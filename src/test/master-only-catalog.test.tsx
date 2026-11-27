import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useServers } from '@/hooks/useServers';
import type { StorageAdapter } from '@/lib/storage';
import type { ServerConfig } from '@/types/server';

it('expires public names during an outage and refreshes only discovered rows', async () => {
  vi.useFakeTimers();
  try {
    const stored: ServerConfig = { id: 'stored', label: 'Stored', queryUrl: 'https://stored.example', createdAt: '' };
    const discovered: ServerConfig = {
      ...stored,
      id: 'discovered',
      masterOnly: true,
      status: 'online',
      masterOnlyPlayerNames: ['Public name'],
      masterOnlyLiveUntil: new Date(Date.now() + 10_000).toISOString(),
    };
    const getServers = vi.fn().mockResolvedValue([stored, discovered]);
    const getMasterOnlyServers = vi.fn().mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValueOnce([]);
    const adapter = { getServers, getMasterOnlyServers } as unknown as StorageAdapter;
    const { result, unmount } = renderHook(() => useServers(adapter));
    await act(async () => undefined);
    expect(result.current.servers[1].masterOnlyPlayerNames).toEqual(['Public name']);

    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(result.current.servers[1]).toMatchObject({ status: 'unknown', masterOnlyPlayerNames: undefined });
    expect(result.current.servers[0]).toBe(stored);

    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(result.current.servers).toEqual([stored]);
    expect(getServers).toHaveBeenCalledTimes(1);
    expect(getMasterOnlyServers).toHaveBeenCalledTimes(2);
    unmount();
  } finally {
    vi.useRealTimers();
  }
});
