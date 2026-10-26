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
  return localIsoDate(value);
}

function localIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

export function isoWeekStart(value: string): Date {
  const match = /^(\d{4})-W(\d{2})$/.exec(value);
  if (!match) return startOfLocalDay(isoDate(new Date()));
  const year = Number(match[1]);
  const week = Number(match[2]);
  const januaryFourth = new Date(year, 0, 4);
  const weekday = januaryFourth.getDay() || 7;
  return addDays(new Date(year, 0, 5 - weekday), (week - 1) * 7);
}

export function statisticsDate(view: StatisticsView, value: string): Date {
  if (view === 'week') return isoWeekStart(value);
  if (view === 'month') {
    const match = /^(\d{4})-(\d{2})$/.exec(value);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, 1);
  }
  return startOfLocalDay(value);
}

export function statisticsPickerValue(view: StatisticsView, value = new Date()): string {
  if (view === 'month') return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
  if (view === 'week') {
    const date = new Date(value);
    const weekday = date.getDay() || 7;
    date.setDate(date.getDate() + 4 - weekday);
    const yearStart = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.round((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(yearStart.getFullYear(), 0, 1)) / 86400000);
    const week = Math.ceil((dayOfYear + 1) / 7);
    return `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
  }
  return localIsoDate(value);
}

export function statisticsRange(view: StatisticsView, dateValue: string): { from?: string; to?: string } {
  if (view === 'weekday') return {};
  const from = statisticsDate(view, dateValue);
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
      const label = formatter.format(new Date(2026, 5, 21 + index));
      return aggregate(label, dayBuckets);
    });
  }

  const start = statisticsDate(view, dateValue);
  const hours = view === 'day' ? 24 : view === 'week' ? 24 * 7 : 24 * 31;
  const end = view === 'month' ? addMonths(start, 1) : addDays(start, hours / 24);
  const grouped = new Map<string, ServerStatisticsBucket[]>();

  for (const bucket of buckets) {
    const date = new Date(bucket.hourStart);
    if (date < start || date >= end) continue;
    const key = view === 'day'
      ? date.getHours().toString().padStart(2, '0') + ':00'
      : localIsoDate(date);
    grouped.set(key, [...(grouped.get(key) ?? []), bucket]);
  }

  if (view === 'day') {
    return Array.from({ length: 24 }, (_, hour) => {
      const label = hour.toString().padStart(2, '0') + ':00';
      return aggregate(label, grouped.get(label) ?? []);
    });
  }

  const days = view === 'week' ? 7 : new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(start, index);
    const label = localIsoDate(date);
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
  const playersByHour = new Map<string, number>();
  for (const bucket of buckets) {
    byServer.set(bucket.serverId, [...(byServer.get(bucket.serverId) ?? []), bucket]);
    playersByHour.set(bucket.hourStart, (playersByHour.get(bucket.hourStart) ?? 0) + bucket.maxPlayers);
  }
  let averagePlayers = 0;
  let maxPlayers = 0;
  let samples = 0;
  for (const serverBuckets of byServer.values()) {
    const serverSamples = serverBuckets.reduce((sum, bucket) => sum + bucket.sampleCount, 0);
    const serverPlayerTotal = serverBuckets.reduce((sum, bucket) => sum + bucket.playerSampleTotal, 0);
    averagePlayers += serverSamples > 0 ? serverPlayerTotal / serverSamples : 0;
    samples += serverSamples;
  }
  maxPlayers = Math.max(0, ...playersByHour.values());
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
