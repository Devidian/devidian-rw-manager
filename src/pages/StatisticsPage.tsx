import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { BarChart3, Loader2 } from 'lucide-react';
import { useStorageMode } from '@/context/StorageModeContext';
import type { ServerStatisticsBucket } from '@/types/server';
import {
  buildGlobalStatisticsPoints,
  isoDate,
  statisticsPickerValue,
  statisticsRange,
  type StatisticsView,
  type StatisticsPoint,
} from '@/lib/statistics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { StatisticsDatePicker } from '@/components/StatisticsDatePicker';

const GlobalStatisticsChart = memo(function GlobalStatisticsChart({ points, averageLabel, maxLabel }: {
  points: StatisticsPoint[];
  averageLabel: string;
  maxLabel: string;
}) {
  return (
    <ChartContainer
      config={{
        averagePlayers: { label: averageLabel, color: 'hsl(var(--primary))' },
        maxPlayers: { label: maxLabel, color: 'hsl(var(--muted-foreground))' },
      }}
      className="h-72 w-full"
    >
      <BarChart data={points}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={20} />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="averagePlayers" fill="var(--color-averagePlayers)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="maxPlayers" fill="var(--color-maxPlayers)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
});

export default function StatisticsPage() {
  const { t, i18n } = useTranslation();
  const { adapter } = useStorageMode();
  const [view, setView] = useState<StatisticsView>('day');
  const [dateValue, setDateValue] = useState(() => isoDate(new Date()));
  const [buckets, setBuckets] = useState<ServerStatisticsBucket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const snapshotRef = useRef({ range: '', chart: '' });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adapter.getGlobalStatistics(statisticsRange(view, dateValue))
      .then((payload) => {
        if (cancelled) return;
        const range = `${view}:${dateValue}`;
        const chart = JSON.stringify(buildGlobalStatisticsPoints(payload.buckets, view, dateValue, 'en').map((point) => [
          point.label, point.averagePlayers, point.maxPlayers, point.samples > 0,
        ]));
        if (range !== snapshotRef.current.range || chart !== snapshotRef.current.chart) {
          setBuckets(payload.buckets);
        }
        snapshotRef.current = { range, chart };
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'UNKNOWN_ERROR');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [adapter, dateValue, view]);

  const points = useMemo(
    () => buildGlobalStatisticsPoints(buckets, view, dateValue, i18n.language || 'en'),
    [buckets, dateValue, i18n.language, view],
  );
  const hasData = points.some((point) => point.samples > 0);
  const changeView = (nextView: StatisticsView) => {
    setView(nextView);
    setDateValue(statisticsPickerValue(nextView));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('statistics')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('globalStatisticsSummary')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={view} onValueChange={(value) => changeView(value as StatisticsView)}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">{t('statisticsDay')}</SelectItem>
              <SelectItem value="week">{t('statisticsWeek')}</SelectItem>
              <SelectItem value="month">{t('statisticsMonth')}</SelectItem>
              <SelectItem value="weekday">{t('statisticsWeekday')}</SelectItem>
            </SelectContent>
          </Select>
          <StatisticsDatePicker view={view} value={dateValue} onChange={setDateValue} />
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('players')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-6">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('loadingStatistics')}
            </div>
          )}
          {error && (
            <div className="rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {t('backendError')}: {error}
            </div>
          )}
          {!loading && !error && !hasData && (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{t('noStatistics')}</p>
            </div>
          )}
          {!loading && !error && hasData && (
            <GlobalStatisticsChart points={points} averageLabel={t('averagePlayers')} maxLabel={t('maxPlayers')} />
          )}
        </CardContent>
      </Card>


    </div>
  );
}
