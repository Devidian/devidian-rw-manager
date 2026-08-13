import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppWindow, ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, Lock, RefreshCw, Star, Terminal, Users, MapPin, Server as ServerIcon } from 'lucide-react';
import { useServerContext } from '@/context/ServerContext';
import { useAuth } from '@/context/AuthContext';
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
import { serverConnectUrl } from '@/lib/serverConnect';
import { getServerDisplayName, getServerSecondaryName } from '@/lib/serverDisplay';
import { PinnedServerLimitAlert } from '@/components/PinnedServerLimitAlert';
import { Switch } from '@/components/ui/switch';

function StatusBadge({ server }: { server: ServerWithStatus }) {
  const { t } = useTranslation();
  const { status } = server;

  if (status === 'online') {
    return (
      <Badge className="gap-1.5 bg-[hsl(120_55%_42%/0.15)] text-[hsl(120_55%_62%)] border-[hsl(120_55%_42%/0.4)]">
        <span className="h-1.5 w-1.5 rounded-full status-dot-online" aria-label={t('online')} title={t('online')} />
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

function ServerTraitsBadges({ server }: { server: ServerWithStatus }) {
  const { t } = useTranslation();
  const os = server.queryData?.os?.toLowerCase();
  const requiresPassword = server.queryData?.locked || server.password;
  return (
    <div className="flex flex-wrap gap-1.5">
      {os && (
        <Badge variant="outline" className="gap-1.5 text-muted-foreground border-border">
          {os.includes('win')
            ? <AppWindow className="h-3.5 w-3.5" aria-label="Windows" title="Windows" />
            : <Terminal className="h-3.5 w-3.5" aria-label="Linux" title="Linux" />}
        </Badge>
      )}
      {requiresPassword && (
        <Badge variant="outline" className="gap-1.5 text-muted-foreground border-border">
          <Lock className="h-3.5 w-3.5" aria-label={t('locked')} title={t('locked')} />
        </Badge>
      )}
    </div>
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
  if (key === 'name') return getServerDisplayName(server).toLocaleLowerCase();
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

function statusBottomRank(status: ServerWithStatus['status']): number {
  return status === 'offline' || status === 'loading' ? 1 : 0;
}

function SortHeader({
  label,
  column,
  sortKey,
  sortDirection,
  onSort,
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (column: SortKey) => void;
}) {
  const active = sortKey === column;
  const Icon = !active ? ArrowUpDown : sortDirection === 'asc' ? ArrowUp : ArrowDown;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-0 gap-1.5 text-muted-foreground hover:text-foreground"
      onClick={() => onSort(column)}
    >
      {label}
      <Icon className="h-3.5 w-3.5" />
    </Button>
  );
}

export default function ServerListPage() {
  const { t } = useTranslation();
  const { isAdmin, isSuperAdmin } = useAuth();
  const [sortKey, setSortKey] = useState<SortKey>('players');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [blockedPendingIds, setBlockedPendingIds] = useState<Set<string>>(() => new Set());
  const [showOfflineServers, setShowOfflineServers] = useState(false);
  const {
    serverList,
    refreshServerList,
    refreshOne,
    pinServer,
    unpinServer,
    canPinServer,
    pinLimitReached,
    maxPinnedServers,
    setServerBlocked,
    isPinned,
  } = useServerContext();

  const visibleServerList = useMemo(
    () => isAdmin && showOfflineServers ? serverList : serverList.filter((server) => server.status !== 'offline'),
    [isAdmin, serverList, showOfflineServers],
  );
  const onlineCount = visibleServerList.filter(server => server.status === 'online').length;
  const serverTraits = useMemo(() => visibleServerList.reduce((counts, server) => {
    const os = server.queryData?.os?.toLowerCase();
    if (os?.includes('win')) counts.windows += 1;
    else if (os) counts.linux += 1;
    if (server.queryData?.locked || server.password) counts.password += 1;
    return counts;
  }, { windows: 0, linux: 0, password: 0 }), [visibleServerList]);
  const sortedServers = useMemo(() => {
    return [...visibleServerList].sort((left, right) => {
      const leftPinned = isPinned(left.id);
      const rightPinned = isPinned(right.id);
      if (leftPinned !== rightPinned) return leftPinned ? -1 : 1;

      const statusRank = statusBottomRank(left.status) - statusBottomRank(right.status);
      if (statusRank !== 0) return statusRank;

      const primary = compareValues(sortValue(left, sortKey), sortValue(right, sortKey));
      if (primary !== 0) return sortDirection === 'asc' ? primary : -primary;

      if (sortKey !== 'name') {
        const name = compareValues(sortValue(left, 'name'), sortValue(right, 'name'));
        if (name !== 0) return name;
      }
      return left.id.localeCompare(right.id, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [isPinned, sortDirection, sortKey, visibleServerList]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(key);
    setSortDirection(key === 'players' ? 'desc' : 'asc');
  };

  const toggleBlocked = async (server: ServerWithStatus) => {
    setBlockedPendingIds((current) => new Set(current).add(server.id));
    try {
      await setServerBlocked(server.id, server.blocked !== true);
    } finally {
      setBlockedPendingIds((current) => {
        const next = new Set(current);
        next.delete(server.id);
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      {pinLimitReached && <PinnedServerLimitAlert max={maxPinnedServers} />}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('serverList')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('serverListSummary', { online: onlineCount, total: visibleServerList.length })}
            {', '}
            {t('serverListDetails', serverTraits)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch checked={showOfflineServers} onCheckedChange={setShowOfflineServers} />
              {t('showOfflineServers')}
            </label>
          )}
          <Button size="sm" variant="outline" className="gap-2" onClick={refreshServerList}>
            <RefreshCw className="h-4 w-4" />
            {t('refreshAll')}
          </Button>
        </div>
      </div>

      {visibleServerList.length === 0 ? (
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
                <TableHead><SortHeader label={t('server')} column="name" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} /></TableHead>
                <TableHead><SortHeader label={t('status')} column="status" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} /></TableHead>
                <TableHead><SortHeader label={t('players')} column="players" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} /></TableHead>
                <TableHead><SortHeader label={t('map')} column="map" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} /></TableHead>
                <TableHead><SortHeader label={t('version')} column="version" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} /></TableHead>
                <TableHead><SortHeader label={t('ipPort')} column="address" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} /></TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedServers.map(server => {
                const data = server.queryData;
                const name = getServerDisplayName(server);
                const secondaryName = getServerSecondaryName(server);
                const map = data?.map ?? '-';
                const playerCount = data?.playercount ?? server.onlinePlayers?.length ?? 0;
                const maxPlayers = data?.maxplayers ?? '?';
                const version = data?.version ?? server.version ?? '-';
                const pinned = isPinned(server.id);
                const connectUrl = serverConnectUrl(server);

                return (
                  <TableRow key={server.id}>
                    <TableCell className="min-w-[16rem]">
                      <Link to={`/server/${server.id}`} className="font-medium text-foreground hover:text-primary">
                        <RichText text={name} />
                      </Link>
                      {secondaryName && secondaryName !== name && (
                        <div className="text-xs text-muted-foreground truncate max-w-[20rem]">{secondaryName}</div>
                      )}
                      {server.blocked && (
                        <Badge variant="destructive" className="mt-1 gap-1">
                          <Lock className="h-3 w-3" />
                          {t('serverBlockedBadge')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge server={server} />
                        <ServerTraitsBadges server={server} />
                      </div>
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
                          disabled={!canPinServer(server.id)}
                          title={pinned ? t('unpinServer') : !canPinServer(server.id)
                            ? t('pinnedServerLimitAction', { max: maxPinnedServers })
                            : t('pinServer')}
                        >
                          <Star className={cn('h-3.5 w-3.5', pinned && 'fill-current')} />
                        </Button>
                        {isSuperAdmin && (
                          <Button
                            size="sm"
                            variant={server.blocked ? 'destructive' : 'ghost'}
                            className={cn(
                              'h-8 w-8 p-0',
                              !server.blocked && 'text-muted-foreground hover:text-destructive',
                            )}
                            onClick={() => void toggleBlocked(server)}
                            disabled={blockedPendingIds.has(server.id)}
                            title={server.blocked ? t('unblockServer') : t('blockServer')}
                          >
                            <Lock className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {connectUrl && (
                          <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary">
                            <a href={connectUrl} title={t('connectServer')}>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
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
