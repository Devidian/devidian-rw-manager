import { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { BarChart3, Loader2 } from 'lucide-react';
import { useStorageMode } from '@/context/StorageModeContext';
import type { GlobalStatisticsPayload } from '@/types/server';
import {
  buildGlobalStatisticsPoints,
  buildObservedPlayerPoints,
  isoDate,
  statisticsPickerValue,
  statisticsRange,
  summarizeObservedPlayers,
  type StatisticsView,
  type StatisticsPoint,
} from '@/lib/statistics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { StatisticsDatePicker } from '@/components/StatisticsDatePicker';

const GlobalStatisticsChart = memo(function GlobalStatisticsChart({ points, averageLabel, maxLabel, minLabel, sampleLabel, locale }: {
  points: StatisticsPoint[];
  averageLabel: string;
  maxLabel: string;
  minLabel?: string;
  sampleLabel?: string;
  locale?: string;
}) {
  const data = minLabel ? points.map(point => point.samples ? point : { label: point.label, samples: 0 }) : points;
  const format = new Intl.NumberFormat(locale);
  return (
    <ChartContainer
      config={{
        averagePlayers: { label: averageLabel, color: 'hsl(var(--primary))' },
        maxPlayers: { label: maxLabel, color: 'hsl(var(--muted-foreground))' },
        ...(minLabel ? { minPlayers: { label: minLabel, color: 'hsl(var(--chart-2))' } } : {}),
      }}
      className="h-72 w-full"
    >
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={20} />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent
          labelFormatter={(label, items) => sampleLabel ? (
            <>{label} · {sampleLabel} {format.format(items[0]?.payload?.samples ?? 0)}</>
          ) : label}
          formatter={minLabel ? (value, series) => (
            <span className="flex w-full justify-between gap-3">
              <span>{series === 'minPlayers' ? minLabel : series === 'maxPlayers' ? maxLabel : averageLabel}</span>
              <span className="tabular-nums">{format.format(Number(value))}</span>
            </span>
          ) : undefined}
        />} />
        {minLabel && <Bar dataKey="minPlayers" fill="var(--color-minPlayers)" radius={[4, 4, 0, 0]} />}
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
  const [statistics, setStatistics] = useState<GlobalStatisticsPayload>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adapter.getGlobalStatistics(statisticsRange(view, dateValue))
      .then((payload) => {
        if (cancelled) return;
        setStatistics(payload);
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
    () => buildGlobalStatisticsPoints(statistics?.buckets ?? [], view, dateValue, i18n.language || 'en'),
    [statistics, dateValue, i18n.language, view],
  );
  const observed = useMemo(
    () => buildObservedPlayerPoints(statistics?.globalPlayerBuckets ?? [], view, dateValue, i18n.language || 'en'),
    [statistics, dateValue, i18n.language, view],
  );
  const observedSummary = useMemo(() => summarizeObservedPlayers(statistics?.globalPlayerBuckets ?? []), [statistics]);
  const numberFormat = new Intl.NumberFormat(i18n.language || 'en');
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
            {t('storedServerStatistics')}
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

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('observedPlayerStatistics')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t('observedPlayerStatisticsCoverage')}</p>
        </CardHeader>
        <CardContent aria-busy={loading}>
          {!loading && (error || statistics?.globalPlayerBuckets === undefined) && (
            <p className="text-sm text-muted-foreground">{t('observedPlayerStatisticsUnavailable')}</p>
          )}
          {!loading && !error && statistics?.globalPlayerBuckets !== undefined && (
            observedSummary.samples > 0
              ? <>
                  <dl className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {([
                      ['minPlayers', observedSummary.minPlayers],
                      ['maxPlayers', observedSummary.maxPlayers],
                      ['averagePlayers', observedSummary.averagePlayers],
                      ['statisticsSampleCount', observedSummary.samples],
                    ] as const).map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-sm text-muted-foreground">{t(label)}</dt>
                        <dd className="font-medium tabular-nums">{numberFormat.format(value ?? 0)}</dd>
                      </div>
                    ))}
                  </dl>
                  <GlobalStatisticsChart points={observed} averageLabel={t('averagePlayers')}
                    minLabel={t('minPlayers')} maxLabel={t('maxPlayers')} sampleLabel={t('statisticsSampleCount')}
                    locale={i18n.language || 'en'} />
                </>
              : <p className="text-sm text-muted-foreground">{t('noObservedPlayerStatistics')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
