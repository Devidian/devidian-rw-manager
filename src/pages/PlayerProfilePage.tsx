import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useServerContext } from '@/context/ServerContext';
import { useStorageMode } from '@/context/StorageModeContext';
import { getServerDisplayName } from '@/lib/serverDisplay';
import { authHeaders } from '@/lib/authApi';
import { RichText } from '@/components/RichText';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PlayerProfilePage() {
  const { t } = useTranslation();
  const { uid } = useParams<{ uid: string }>();
  const location = useLocation();
  const { serverList } = useServerContext();
  const { fixedBackendUrl, backendUrl } = useStorageMode();
  const baseUrl = fixedBackendUrl ?? backendUrl;
  const [history, setHistory] = useState<Array<{ serverId: string; label: string; status: string; name?: string; playtime?: number }>>([]);
  const [loading, setLoading] = useState(true);
  const activeServers = useMemo(() => serverList.filter((server) =>
    server.public === true && !server.blocked && !server.userId &&
    server.status === 'online' && server.onlinePlayers?.some((player) => player.uid === uid)), [serverList, uid]);
  const profileServers = useMemo(() => [
    ...history,
    ...activeServers.filter((server) => !history.some((item) => item.serverId === server.id))
      .map((server) => ({ serverId: server.id, label: getServerDisplayName(server), status: 'online' })),
  ], [activeServers, history]);
  const linkedName = (location.state as { playerName?: unknown } | null)?.playerName;
  const name = activeServers.flatMap((server) => server.onlinePlayers ?? []).find((player) => player.uid === uid)?.name
    ?? history.find((item) => item.name)?.name
    ?? (typeof linkedName === 'string' ? linkedName : uid);

  useEffect(() => {
    setHistory([]);
    setLoading(true);
    if (!uid || !baseUrl) { setLoading(false); return; }
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/storage/player/${encodeURIComponent(uid)}/history`, { headers: authHeaders(), signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json() as { items?: typeof history };
        if (!controller.signal.aborted && Array.isArray(data.items)) setHistory(data.items);
      } catch {
        // Keep the profile usable if the backend is temporarily unavailable.
      }
      finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [baseUrl, uid]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{name || t('playerProfile')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('playerProfileServerHistory')}</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">{t('servers')}</CardTitle></CardHeader>
        <CardContent>
          {!loading && profileServers.length === 0 ? <p className="text-sm text-muted-foreground">{t('playerProfileNoHistory')}</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>{t('server')}</TableHead><TableHead>{t('playtime')}</TableHead><TableHead>{t('status')}</TableHead></TableRow></TableHeader>
              <TableBody>{profileServers.map((item) => (
                <TableRow key={item.serverId}>
                  <TableCell><Link to={`/server/${encodeURIComponent(item.serverId)}`} className="hover:underline"><RichText text={serverList.find((server) => server.id === item.serverId)
                    ? getServerDisplayName(serverList.find((server) => server.id === item.serverId)!) : item.label} /></Link></TableCell>
                  <TableCell>{item.playtime === undefined ? '—' : `${(item.playtime / 3600).toFixed(1)} h`}</TableCell>
                  <TableCell>{activeServers.some((server) => server.id === item.serverId) ? t('playerProfileOnlineNow') : '—'}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
