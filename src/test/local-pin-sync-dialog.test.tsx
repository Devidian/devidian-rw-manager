import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '@/types/server';
import type { StorageAdapter } from '@/lib/storage';

const state = vi.hoisted(() => ({
  user: {
    id: 'user-1',
    role: 'user',
    pinnedServers: [],
  } as AuthUser,
  applyUserUpdate: vi.fn(),
  clearLocalPinnedServers: vi.fn(),
}));

const updatedUser: AuthUser = {
  id: 'user-1',
  role: 'user',
  pinnedServers: ['server-a', 'server-b'],
};

const adapter = {
  getServers: vi.fn(),
  refreshServers: vi.fn(),
  addServer: vi.fn(),
  updateServer: vi.fn(),
  deleteServer: vi.fn(),
  getPinnedServers: vi.fn(async () => ['server-a', 'server-b', 'server-a']),
  pinServer: vi.fn(async () => updatedUser),
  unpinServer: vi.fn(),
  setServerBlocked: vi.fn(),
  getServerLiveStatus: vi.fn(),
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => params ? `${key}:${params.count}` : key,
  }),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: state.user,
    applyUserUpdate: state.applyUserUpdate,
  }),
}));
vi.mock('@/context/StorageModeContext', () => ({
  useStorageMode: () => ({ adapter }),
}));
vi.mock('@/context/BackendInfoContext', () => ({
  useBackendInfo: () => ({ services: ['storage'], maxPinnedServers: 50 }),
}));
vi.mock('@/lib/storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/storage')>();
  return {
    ...actual,
    clearLocalPinnedServers: state.clearLocalPinnedServers,
  };
});

const { LocalPinSyncDialog } = await import('@/components/LocalPinSyncDialog');

describe('local pin sync dialog', () => {
  beforeEach(() => {
    state.applyUserUpdate.mockClear();
    state.clearLocalPinnedServers.mockClear();
    vi.clearAllMocks();
  });

  it('offers local pin synchronization and merges unique pins into the signed-in user', async () => {
    render(<LocalPinSyncDialog />);

    await screen.findByText('syncLocalPinsTitle');
    expect(screen.getByText('syncLocalPinsDesc:2')).toBeInTheDocument();

    fireEvent.click(screen.getByText('syncLocalPinsConfirm'));

    await waitFor(() => expect(adapter.pinServer).toHaveBeenCalledTimes(2));
    expect(adapter.pinServer).toHaveBeenNthCalledWith(1, 'server-a');
    expect(adapter.pinServer).toHaveBeenNthCalledWith(2, 'server-b');
    expect(state.applyUserUpdate).toHaveBeenCalledWith(updatedUser);
    expect(state.clearLocalPinnedServers).toHaveBeenCalledTimes(1);
  });
});
