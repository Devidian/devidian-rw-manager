import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { BarChart3, Loader2, Users } from 'lucide-react';
import { useStorageMode } from '@/context/StorageModeContext';
import type { GlobalStatisticsPayload, ServerStatisticsBucket } from '@/types/server';
import {
  buildGlobalStatisticsPoints,
  isoDate,
  statisticsRange,
  type StatisticsView,
} from '@/lib/statistics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useAuth } from '@/context/AuthContext';

const STEAM_ID_PATTERN = /^\d{17}$/;

function isSteamId(uid: string): boolean {
  return STEAM_ID_PATTERN.test(uid);
}

function maskUid(uid: string): string {
  if (uid.length <= 8) return uid;
  return `${uid.slice(0, 4)}${'*'.repeat(uid.length - 8)}${uid.slice(-4)}`;
}

function PlayerUid({ uid, authenticated }: { uid: string; authenticated: boolean }) {
  if (authenticated && isSteamId(uid)) {
    return (
      <a
        href={`https://steamcommunity.com/profiles/${uid}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:text-primary/80"
      >
        {uid}
      </a>
    );
  }
  return <span>{authenticated ? uid : maskUid(uid)}</span>;
}

export default function StatisticsPage() {
  const { t, i18n } = useTranslation();
  const { adapter } = useStorageMode();
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState<StatisticsView>('day');
  const [dateValue, setDateValue] = useState(() => isoDate(new Date()));
  const [buckets, setBuckets] = useState<ServerStatisticsBucket[]>([]);
  const [players, setPlayers] = useState<GlobalStatisticsPayload['players']>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adapter.getGlobalStatistics(statisticsRange(view, dateValue))
      .then((payload) => {
        if (cancelled) return;
        setBuckets(payload.buckets);
        setPlayers([...payload.players].sort((a, b) => a.uid.localeCompare(b.uid)));
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('statistics')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('globalStatisticsSummary')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={view} onValueChange={(value) => setView(value as StatisticsView)}>
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
          {view !== 'weekday' && (
            <Input
              type="date"
              value={dateValue}
              onChange={(event) => setDateValue(event.target.value)}
              className="h-8 w-36 text-xs"
            />
          )}
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
            <ChartContainer
              config={{
                averagePlayers: { label: t('averagePlayers'), color: 'hsl(var(--primary))' },
                maxPlayers: { label: t('maxPlayers'), color: 'hsl(var(--muted-foreground))' },
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
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('uniquePlayers')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">{t('noPlayersFound')}</div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>{t('name')}</TableHead>
                    <TableHead>{t('uid')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((player) => (
                    <TableRow key={player.uid} className="hover:bg-muted/20">
                      <TableCell className="font-medium">{player.name || '-'}</TableCell>
                      <TableCell className="font-mono text-xs">
                        <PlayerUid uid={player.uid} authenticated={isAuthenticated} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
