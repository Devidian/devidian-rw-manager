import { describe, expect, it } from 'vitest';
import { buildGlobalStatisticsPoints, isoDate, isoWeekStart, statisticsPickerValue, statisticsRange } from '@/lib/statistics';
import type { ServerStatisticsBucket } from '@/types/server';

function bucket(serverId: string, hourStart: string, maxPlayers: number): ServerStatisticsBucket {
  return {
    id: `${serverId}:${hourStart}`, serverId, hourStart, maxPlayers,
    sampleCount: 1, onlineSampleCount: 1, playerSampleTotal: maxPlayers,
    averagePlayers: maxPlayers, availability: 100, onlinePlayerUids: [], updatedAt: hourStart,
  };
}

describe('statistics ranges', () => {
  it('keeps local calendar dates and ISO weeks across timezone and year boundaries', () => {
    expect(isoDate(new Date(2026, 9, 1))).toBe('2026-10-01');
    expect(statisticsPickerValue('week', new Date(2025, 11, 31))).toBe('2026-W01');
    expect(isoWeekStart('2026-W01').getDay()).toBe(1);
    expect(isoDate(isoWeekStart('2026-W01'))).toBe('2025-12-29');
  });

  it('renders exactly the selected calendar month', () => {
    const points = buildGlobalStatisticsPoints([
      bucket('a', new Date(2026, 8, 30, 23).toISOString(), 2),
      bucket('a', new Date(2026, 9, 1, 0).toISOString(), 4),
    ], 'month', '2026-10', 'en');
    expect(points).toHaveLength(31);
    expect(points[0]).toMatchObject({ label: '2026-10-01', maxPlayers: 4 });
    expect(points[30].label).toBe('2026-10-31');
  });

  it('uses the complete selected calendar month', () => {
    const range = statisticsRange('month', '2026-02');
    expect(new Date(range.from!).getFullYear()).toBe(2026);
    expect(new Date(range.from!).getMonth()).toBe(1);
    expect(new Date(range.from!).getDate()).toBe(1);
    expect(new Date(range.to!).getMonth()).toBe(2);
    expect(new Date(range.to!).getDate()).toBe(1);
  });

  it('uses Monday through the following Monday for an ISO week', () => {
    expect(isoWeekStart('2026-W01').getDay()).toBe(1);
    const range = statisticsRange('week', '2026-W20');
    expect(new Date(range.to!).getTime() - new Date(range.from!).getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('uses the maximum simultaneous player total for weekday groups', () => {
    const points = buildGlobalStatisticsPoints([
      bucket('a', '2026-06-22T10:00:00.000Z', 4),
      bucket('b', '2026-06-22T10:00:00.000Z', 3),
      bucket('a', '2026-06-29T09:00:00.000Z', 6),
      bucket('b', '2026-06-29T11:00:00.000Z', 5),
    ], 'weekday', '2026-06-22', 'en');
    expect(points[1].maxPlayers).toBe(7);
  });
});
