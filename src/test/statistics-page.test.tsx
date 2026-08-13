import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GlobalStatisticsPayload } from '@/types/server';

const state = vi.hoisted(() => ({
  isAuthenticated: false,
  getGlobalStatistics: vi.fn(),
}));

const payload: GlobalStatisticsPayload = {
  buckets: [
    {
      id: 'server-1:2026-07-02T10:00:00.000Z',
      serverId: 'server-1',
      hourStart: '2026-07-02T10:00:00.000Z',
      sampleCount: 1,
      onlineSampleCount: 1,
      playerSampleTotal: 1,
      maxPlayers: 1,
      averagePlayers: 1,
      availability: 100,
      onlinePlayerUids: ['76561198000000000'],
      updatedAt: '2026-07-02T10:00:00.000Z',
    },
  ],
  players: [
    { uid: '76561198000000000', name: 'Steam Player' },
    { uid: 'standalone-player-uid', name: 'Standalone Player' },
  ],
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));
vi.mock('@/context/StorageModeContext', () => ({
  useStorageMode: () => ({
    adapter: {
      getGlobalStatistics: state.getGlobalStatistics,
    },
  }),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: state.isAuthenticated,
  }),
}));
vi.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}));

const { default: StatisticsPage } = await import('@/pages/StatisticsPage');

describe('StatisticsPage', () => {
  beforeEach(() => {
    state.isAuthenticated = false;
    state.getGlobalStatistics.mockReset().mockResolvedValue(payload);
    localStorage.removeItem('risingworld_statistics_page_size');
  });

  it('masks player UIDs for guests and does not render Steam links', async () => {
    render(<StatisticsPage />);

    expect(await screen.findByText('7656*********0000')).toBeInTheDocument();
    expect(screen.getByText('stan*************-uid')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '76561198000000000' })).not.toBeInTheDocument();
  });

  it('renders Steam IDs as profile links for authenticated users', async () => {
    state.isAuthenticated = true;
    render(<StatisticsPage />);

    const link = await screen.findByRole('link', { name: '76561198000000000' });
    expect(link).toHaveAttribute('href', 'https://steamcommunity.com/profiles/76561198000000000');
    await waitFor(() => expect(screen.getByText('standalone-player-uid')).toBeInTheDocument());
  });

  it('restores the saved player page size', async () => {
    localStorage.setItem('risingworld_statistics_page_size', '10');
    render(<StatisticsPage />);
    await screen.findByText('Steam Player');

    expect(screen.getByText('10').closest('button')).toBeInTheDocument();
  });
});
