import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, RefreshCw, Star, Users, MapPin, Server as ServerIcon } from 'lucide-react';
import { useServerContext } from '@/context/ServerContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RichText } from '@/components/RichText';
import { ServerWithStatus } from '@/types/server';
import { cn } from '@/lib/utils';

function StatusBadge({ status }: { status: ServerWithStatus['status'] }) {
  const { t } = useTranslation();

  if (status === 'online') {
    return (
      <Badge className="gap-1.5 bg-[hsl(120_55%_42%/0.15)] text-[hsl(120_55%_62%)] border-[hsl(120_55%_42%/0.4)]">
        <span className="h-1.5 w-1.5 rounded-full status-dot-online" />
        {t('online')}
      </Badge>
    );
  }

  if (status === 'offline') {
    return (
      <Badge className="gap-1.5 bg-[hsl(0_55%_42%/0.15)] text-[hsl(0_55%_65%)] border-[hsl(0_55%_42%/0.4)]">
        <span className="h-1.5 w-1.5 rounded-full status-dot-offline" />
        {t('offline')}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1.5 text-muted-foreground border-border">
      <span className="h-1.5 w-1.5 rounded-full status-dot-unknown" />
      {status === 'loading' ? t('checking') : t('unknown')}
    </Badge>
  );
}

function getAddress(server: ServerWithStatus): string {
  if (server.addr) return server.addr;
  if (server.ip && server.port) return `${server.ip}:${server.port}`;
  if (server.queryData?.ip && server.queryData?.port) return `${server.queryData.ip}:${server.queryData.port}`;
  return '-';
}

type SortKey = 'name' | 'status' | 'players' | 'map' | 'version' | 'address';
type SortDirection = 'asc' | 'desc';

function sortValue(server: ServerWithStatus, key: SortKey): string | number {
  const data = server.queryData;
  if (key === 'name') return (server.label || server.name || data?.name || '').toLocaleLowerCase();
  if (key === 'status') return server.status;
  if (key === 'players') return data?.playercount ?? server.onlinePlayers?.length ?? 0;
  if (key === 'map') return (data?.map ?? '').toLocaleLowerCase();
  if (key === 'version') return (data?.version ?? server.version ?? '').toLocaleLowerCase();
  return getAddress(server).toLocaleLowerCase();
}

function compareValues(left: string | number, right: string | number): number {
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
}

export default function ServerListPage() {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const {
    serverList,
    refreshAll,
    refreshOne,
    pinServer,
    unpinServer,
    isPinned,
  } = useServerContext();

  const onlineCount = serverList.filter(server => server.status === 'online').length;
  const sortedServers = useMemo(() => {
    return [...serverList].sort((left, right) => {
      const leftPinned = isPinned(left.id);
      const rightPinned = isPinned(right.id);
      if (leftPinned !== rightPinned) return leftPinned ? -1 : 1;

      const result = compareValues(sortValue(left, sortKey), sortValue(right, sortKey));
      return sortDirection === 'asc' ? result : -result;
    });
  }, [isPinned, serverList, sortDirection, sortKey]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  };

  const SortHeader = ({ label, column }: { label: string; column: SortKey }) => {
    const active = sortKey === column;
    const Icon = !active ? ArrowUpDown : sortDirection === 'asc' ? ArrowUp : ArrowDown;
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-0 gap-1.5 text-muted-foreground hover:text-foreground"
        onClick={() => toggleSort(column)}
      >
        {label}
        <Icon className="h-3.5 w-3.5" />
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('serverList')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('serverListSummary', { online: onlineCount, total: serverList.length })}
          </p>
        </div>
        <Button size="sm" variant="outline" className="gap-2" onClick={refreshAll}>
          <RefreshCw className="h-4 w-4" />
          {t('refreshAll')}
        </Button>
      </div>

      {serverList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/30 border border-border mb-6">
            <ServerIcon className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">{t('noServersYet')}</h2>
          <p className="text-muted-foreground text-sm max-w-sm">{t('serverListEmptyDesc')}</p>
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead><SortHeader label={t('server')} column="name" /></TableHead>
                <TableHead><SortHeader label={t('status')} column="status" /></TableHead>
                <TableHead><SortHeader label={t('players')} column="players" /></TableHead>
                <TableHead><SortHeader label={t('map')} column="map" /></TableHead>
                <TableHead><SortHeader label={t('version')} column="version" /></TableHead>
                <TableHead><SortHeader label={t('ipPort')} column="address" /></TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedServers.map(server => {
                const data = server.queryData;
                const name = server.label || server.name || data?.name || server.id;
                const secondaryName = data?.name ?? server.name;
                const map = data?.map ?? '-';
                const playerCount = data?.playercount ?? server.onlinePlayers?.length ?? 0;
                const maxPlayers = data?.maxplayers ?? '?';
                const version = data?.version ?? server.version ?? '-';
                const pinned = isPinned(server.id);

                return (
                  <TableRow key={server.id}>
                    <TableCell className="min-w-[16rem]">
                      <Link to={`/server/${server.id}`} className="font-medium text-foreground hover:text-primary">
                        <RichText text={name} />
                      </Link>
                      {secondaryName && secondaryName !== name && (
                        <div className="text-xs text-muted-foreground truncate max-w-[20rem]">{secondaryName}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={server.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-foreground font-medium">{playerCount}</span>
                        <span>/ {maxPlayers}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground max-w-[12rem]">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{map}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{version}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {getAddress(server)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => refreshOne(server.id)}
                          title={t('refreshStatus')}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={cn('h-8 w-8 p-0 text-muted-foreground hover:text-primary', pinned && 'text-primary')}
                          onClick={() => void (pinned ? unpinServer(server.id) : pinServer(server.id))}
                          title={pinned ? t('unpinServer') : t('pinServer')}
                        >
                          <Star className={cn('h-3.5 w-3.5', pinned && 'fill-current')} />
                        </Button>
                        <Button asChild size="sm" variant="outline" className="h-8">
                          <Link to={`/server/${server.id}`}>{t('details')}</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
