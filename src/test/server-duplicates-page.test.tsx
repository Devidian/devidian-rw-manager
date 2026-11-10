import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  groups: vi.fn(), preview: vi.fn(), merge: vi.fn(), refresh: vi.fn(), updateUser: vi.fn(), validate: vi.fn(), toast: vi.fn(), t: (key: string) => key,
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: state.t }) }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ isSuperAdmin: true, applyUserUpdate: state.updateUser }) }));
vi.mock('@/context/StorageModeContext', () => ({ useStorageMode: () => ({ mode: 'fixed', fixedBackendUrl: 'https://backend.example' }) }));
vi.mock('@/context/ServerContext', () => ({ useServerContext: () => ({ refreshServerList: state.refresh }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: state.toast }) }));
vi.mock('@/lib/authApi', () => ({ TOKEN_KEY: 'token', validate: state.validate }));
vi.mock('@/lib/serverDuplicateApi', () => ({
  getDuplicateGroups: state.groups, previewMerge: state.preview, mergeServers: state.merge,
}));
const { default: ServerDuplicatesPage } = await import('@/pages/ServerDuplicatesPage');

describe('server duplicate review', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'admin-token');
    state.groups.mockReset().mockResolvedValue([{ targetId: 'old', entries: [
      { id: 'old', name: 'Server', shortname: 'Short', map: 'World', gamemode: 0, os: 'Linux', ip: '192.0.2.1', port: 4255, firstSeen: '2026-11-01T00:00:00Z', lastSeen: '2026-11-01T01:00:00Z', status: 'offline', strength: 'strong' },
      { id: 'new', name: 'Renamed', shortname: 'Short', map: 'World', gamemode: 0, os: 'Linux', ip: '192.0.2.2', port: 4255, firstSeen: '2026-11-02T00:00:00Z', lastSeen: '2026-11-02T01:00:00Z', status: 'online', strength: 'possible' },
    ] }]);
    state.preview.mockReset().mockResolvedValue({ targetId: 'old', sourceIds: ['new'], currentAddress: '192.0.2.2:4255', affectedFavorites: 2, statisticHours: 3 });
    state.merge.mockReset().mockResolvedValue({});
    state.refresh.mockReset(); state.updateUser.mockReset();
    state.validate.mockReset().mockResolvedValue({ user: { id: 'admin' } });
  });

  it('previews only the selected source and merges after confirmation', async () => {
    render(<MemoryRouter><ServerDuplicatesPage /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'Server' }));
    expect(screen.getByText('duplicateModeOs')).toBeInTheDocument();
    expect(screen.getByText('duplicateSeen')).toBeInTheDocument();
    expect(screen.getByText('online')).toHaveClass('border-green-500/50');
    expect(screen.getByText('offline')).toHaveClass('border-red-500/50');
    fireEvent.click(screen.getByRole('checkbox', { name: 'duplicateSelect Renamed' }));
    fireEvent.click(screen.getByRole('button', { name: 'duplicateMergeSelected (1)' }));
    await waitFor(() => expect(state.preview).toHaveBeenCalledWith('https://backend.example', 'admin-token', { targetId: 'old', sourceIds: ['new'] }));
    expect(await screen.findByText('192.0.2.2:4255')).toBeInTheDocument();
    expect(state.merge).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'duplicateConfirm' }));
    await waitFor(() => expect(state.merge).toHaveBeenCalled());
    expect(state.refresh).toHaveBeenCalled();
  });

  it('selects and clears every source in a group', async () => {
    render(<MemoryRouter><ServerDuplicatesPage /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'duplicateSelectAll' }));
    expect(screen.getByRole('checkbox', { name: 'duplicateSelect Renamed' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'duplicateMergeSelected (1)' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'duplicateClearSelection' }));
    expect(screen.getByRole('checkbox', { name: 'duplicateSelect Renamed' })).not.toBeChecked();
  });

  it('renders Rising World color tags in server names', async () => {
    const groups = await state.groups();
    groups[0].entries[0].name = '<color=#00FFFF>Server</color>';
    state.groups.mockResolvedValue(groups);
    render(<MemoryRouter><ServerDuplicatesPage /></MemoryRouter>);
    const colored = await screen.findByText('Server');
    expect(colored).toHaveStyle({ color: '#00FFFF' });
  });
});
