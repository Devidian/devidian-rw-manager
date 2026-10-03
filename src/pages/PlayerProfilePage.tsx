import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useServerContext } from '@/context/ServerContext';
import { useStorageMode } from '@/context/StorageModeContext';
import { getServerDisplayName } from '@/lib/serverDisplay';
import { authHeaders } from '@/lib/authApi';
import type { DataPlayerListResponse } from '@/types/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PlayerProfilePage() {
  const { t } = useTranslation();
  const { uid } = useParams<{ uid: string }>();
  const location = useLocation();
  const { serverList } = useServerContext();
  const { fixedBackendUrl, backendUrl } = useStorageMode();
  const baseUrl = fixedBackendUrl ?? backendUrl;
  const [playtimeByServer, setPlaytimeByServer] = useState<Record<string, number>>({});
  const activeServers = useMemo(() => serverList.filter((server) =>
    server.status === 'online' && server.onlinePlayers?.some((player) => player.uid === uid)), [serverList, uid]);
  const activeServerIds = activeServers.map((server) => server.id).join('|');
  const linkedName = (location.state as { playerName?: unknown } | null)?.playerName;
  const name = activeServers.flatMap((server) => server.onlinePlayers ?? []).find((player) => player.uid === uid)?.name
    ?? (typeof linkedName === 'string' ? linkedName : uid);

  useEffect(() => {
    setPlaytimeByServer({});
    if (!uid || !baseUrl || !activeServerIds) return;
    const controller = new AbortController();
    const ids = activeServerIds.split('|');
    void Promise.all(ids.map(async (serverId) => {
      try {
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/storage/server/${encodeURIComponent(serverId)}/player`, { headers: authHeaders(), signal: controller.signal });
        if (!response.ok) return null;
        const data = await response.json() as DataPlayerListResponse;
        const seconds = data.items.find((player) => player.uid === uid)?.playtime;
        return typeof seconds === 'number' && Number.isFinite(seconds) ? [serverId, seconds] as const : null;
      } catch {
        return null;
      }
    })).then((items) => {
      if (!controller.signal.aborted) setPlaytimeByServer(Object.fromEntries(items.filter((item): item is readonly [string, number] => item !== null)));
    });
    return () => controller.abort();
  }, [activeServerIds, baseUrl, uid]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{name || t('playerProfile')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('playerProfileActiveServers')}</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">{t('servers')}</CardTitle></CardHeader>
        <CardContent>
          {activeServers.length === 0 ? <p className="text-sm text-muted-foreground">{t('playerProfileOffline')}</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>{t('server')}</TableHead><TableHead>{t('playtime')}</TableHead></TableRow></TableHeader>
              <TableBody>{activeServers.map((server) => (
                <TableRow key={server.id}>
                  <TableCell><Link to={`/server/${encodeURIComponent(server.id)}`} className="hover:underline">{getServerDisplayName(server)}</Link></TableCell>
                  <TableCell>{playtimeByServer[server.id] === undefined ? '—' : `${(playtimeByServer[server.id] / 3600).toFixed(1)} h`}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
