import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GlobalStatisticsPayload } from '@/types/server';
import { isoDate } from '@/lib/statistics';

const state = vi.hoisted(() => {
  const getGlobalStatistics = vi.fn();
  return { isAuthenticated: false, getGlobalStatistics, adapter: { getGlobalStatistics }, chartRenders: vi.fn() };
});

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
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));
vi.mock('@/context/StorageModeContext', () => ({
  useStorageMode: () => ({
    adapter: state.adapter,
  }),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: state.isAuthenticated,
  }),
}));
vi.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children }: { children: React.ReactNode }) => { state.chartRenders(); return <div>{children}</div>; },
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}));

const { default: StatisticsPage } = await import('@/pages/StatisticsPage');

describe('StatisticsPage', () => {
  beforeEach(() => {
    state.isAuthenticated = false;
    state.getGlobalStatistics.mockReset().mockResolvedValue(payload);
    state.chartRenders.mockReset();
    localStorage.removeItem('risingworld_statistics_page_size');
  });

  it('renders aggregates without a player list for guests', async () => {
    render(<MemoryRouter><StatisticsPage /></MemoryRouter>);

    await screen.findByText('noStatistics');
    expect(screen.queryByText('Steam Player')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '76561198000000000' })).not.toBeInTheDocument();
  });

  it('does not render player lists for authenticated users either', async () => {
    state.isAuthenticated = true;
    render(<MemoryRouter><StatisticsPage /></MemoryRouter>);

    await screen.findByText('noStatistics');
    expect(screen.queryByText('Steam Player')).not.toBeInTheDocument();
  });

  it('keeps the chart mounted across unrelated parent renders', async () => {
    const { rerender } = render(<MemoryRouter><StatisticsPage /></MemoryRouter>);
    fireEvent.change(screen.getByDisplayValue(isoDate(new Date())), { target: { value: '2026-07-02' } });
    await waitFor(() => expect(state.chartRenders.mock.calls.length).toBeGreaterThan(0));
    const renders = state.chartRenders.mock.calls.length;
    rerender(<MemoryRouter><StatisticsPage /></MemoryRouter>);
    expect(state.chartRenders).toHaveBeenCalledTimes(renders);
  });
});

it('renders the separate global sample summary including confirmed zeroes', async () => {
  const hourStart = new Date(`${isoDate(new Date())}T10:00:00`).toISOString();
  state.getGlobalStatistics.mockResolvedValue({ buckets: [], globalPlayerBuckets: [
    { hourStart, sampleCount: 2, minPlayers: 0, maxPlayers: 8, averagePlayers: 4 },
  ] } satisfies GlobalStatisticsPayload);
  render(<MemoryRouter><StatisticsPage /></MemoryRouter>);
  expect(screen.getByText('storedServerStatistics')).toBeInTheDocument();
  expect(screen.getByText('observedPlayerStatistics')).toBeInTheDocument();
  expect(await screen.findByText('statisticsSampleCount')).toBeInTheDocument();
  expect(screen.getByText('minPlayers').nextElementSibling).toHaveTextContent('0');
  expect(screen.getByText('maxPlayers').nextElementSibling).toHaveTextContent('8');
  expect(screen.getByText('averagePlayers').nextElementSibling).toHaveTextContent('4');
  expect(screen.getByText('statisticsSampleCount').nextElementSibling).toHaveTextContent('2');
  expect(screen.getByText('observedPlayerStatisticsCoverage')).toBeInTheDocument();
});
