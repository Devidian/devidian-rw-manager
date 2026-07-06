import type { ServerStatisticsBucket } from '@/types/server';

export type StatisticsView = 'day' | 'week' | 'month' | 'weekday';

export interface StatisticsPoint {
  label: string;
  averagePlayers: number;
  maxPlayers: number;
  availability: number;
  samples: number;
}

export function startOfLocalDay(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(value: Date, months: number): Date {
  const next = new Date(value);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function statisticsRange(view: StatisticsView, dateValue: string): { from?: string; to?: string } {
  if (view === 'weekday') return {};
  const from = startOfLocalDay(dateValue);
  const to = view === 'day'
    ? addDays(from, 1)
    : view === 'week'
      ? addDays(from, 7)
      : addMonths(from, 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

function groupBuckets(
  buckets: ServerStatisticsBucket[],
  view: StatisticsView,
  dateValue: string,
  locale: string,
  aggregate: (label: string, buckets: ServerStatisticsBucket[]) => StatisticsPoint,
): StatisticsPoint[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  if (view === 'weekday') {
    return Array.from({ length: 7 }, (_, index) => {
      const dayBuckets = buckets.filter((bucket) => new Date(bucket.hourStart).getDay() === index);
      const label = formatter.format(addDays(new Date('2026-06-21T00:00:00.000Z'), index));
      return aggregate(label, dayBuckets);
    });
  }

  const start = startOfLocalDay(dateValue);
  const hours = view === 'day' ? 24 : view === 'week' ? 24 * 7 : 24 * 31;
  const end = view === 'month' ? addMonths(start, 1) : addDays(start, hours / 24);
  const grouped = new Map<string, ServerStatisticsBucket[]>();

  for (const bucket of buckets) {
    const date = new Date(bucket.hourStart);
    if (date < start || date >= end) continue;
    const key = view === 'day'
      ? date.getHours().toString().padStart(2, '0') + ':00'
      : isoDate(date);
    grouped.set(key, [...(grouped.get(key) ?? []), bucket]);
  }

  if (view === 'day') {
    return Array.from({ length: 24 }, (_, hour) => {
      const label = hour.toString().padStart(2, '0') + ':00';
      return aggregate(label, grouped.get(label) ?? []);
    });
  }

  const days = view === 'week' ? 7 : Math.ceil((end.getTime() - start.getTime()) / 86400000);
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(start, index);
    const label = isoDate(date);
    return aggregate(label, grouped.get(label) ?? []);
  });
}

function aggregateServerBucketGroup(label: string, buckets: ServerStatisticsBucket[]): StatisticsPoint {
  const samples = buckets.reduce((sum, bucket) => sum + bucket.sampleCount, 0);
  const playerTotal = buckets.reduce((sum, bucket) => sum + bucket.playerSampleTotal, 0);
  const onlineSamples = buckets.reduce((sum, bucket) => sum + bucket.onlineSampleCount, 0);
  return {
    label,
    averagePlayers: samples > 0 ? Number((playerTotal / samples).toFixed(1)) : 0,
    maxPlayers: buckets.reduce((max, bucket) => Math.max(max, bucket.maxPlayers), 0),
    availability: samples > 0 ? Number(((onlineSamples / samples) * 100).toFixed(1)) : 0,
    samples,
  };
}

function aggregateGlobalBucketGroup(label: string, buckets: ServerStatisticsBucket[]): StatisticsPoint {
  const byServer = new Map<string, ServerStatisticsBucket[]>();
  for (const bucket of buckets) {
    byServer.set(bucket.serverId, [...(byServer.get(bucket.serverId) ?? []), bucket]);
  }
  let averagePlayers = 0;
  let maxPlayers = 0;
  let samples = 0;
  for (const serverBuckets of byServer.values()) {
    const serverSamples = serverBuckets.reduce((sum, bucket) => sum + bucket.sampleCount, 0);
    const serverPlayerTotal = serverBuckets.reduce((sum, bucket) => sum + bucket.playerSampleTotal, 0);
    averagePlayers += serverSamples > 0 ? serverPlayerTotal / serverSamples : 0;
    maxPlayers += serverBuckets.reduce((max, bucket) => Math.max(max, bucket.maxPlayers), 0);
    samples += serverSamples;
  }
  return {
    label,
    averagePlayers: Number(averagePlayers.toFixed(1)),
    maxPlayers,
    availability: 0,
    samples,
  };
}

export function buildServerStatisticsPoints(
  buckets: ServerStatisticsBucket[],
  view: StatisticsView,
  dateValue: string,
  locale: string,
): StatisticsPoint[] {
  return groupBuckets(buckets, view, dateValue, locale, aggregateServerBucketGroup);
}

export function buildGlobalStatisticsPoints(
  buckets: ServerStatisticsBucket[],
  view: StatisticsView,
  dateValue: string,
  locale: string,
): StatisticsPoint[] {
  return groupBuckets(buckets, view, dateValue, locale, aggregateGlobalBucketGroup);
}
