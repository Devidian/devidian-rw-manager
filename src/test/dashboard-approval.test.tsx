import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Index from '@/pages/Index';
import { BackendStorageAdapter } from '@/lib/storage';

const state = vi.hoisted(() => ({ approveServer: vi.fn() }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/components/ServerCard', () => ({ ServerCard: () => null }));
vi.mock('@/context/ServerContext', () => ({
  useServerContext: () => ({
    dashboardServerList: [],
    serverList: [{ id: 'server-candidate', label: 'Test server', masterOnly: true, canApprove: true }],
    approveServer: state.approveServer,
  }),
}));

describe('dashboard approval', () => {
  afterEach(() => vi.restoreAllMocks());

  it('uses the master-list ID and shows why contact verification failed', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ error: 'SERVER_CONTACT_MISMATCH' }, { status: 403 }),
    );
    const adapter = new BackendStorageAdapter('https://manager.example.com');
    state.approveServer.mockImplementation((id: string) => adapter.approveServer(id));
    render(<Index />);
    fireEvent.click(screen.getByRole('button', { name: 'approveServer' }));
    expect(fetchMock).toHaveBeenCalledWith(
      'https://manager.example.com/api/storage/server/server-candidate/approve',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('serverApprovalContactMismatch');
  });
});
