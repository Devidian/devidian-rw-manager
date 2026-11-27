import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, Lock, RefreshCw, Star, Trash2, Users, MapPin, Server as ServerIcon } from 'lucide-react';
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
import { getServerDisplayName, getServerSecondaryName, getServerPlayerCount, getServerPlayerCountDisplay } from '@/lib/serverDisplay';

const statusBadgeSize = 'h-5 w-7 justify-center p-0';

function StatusBadge({ server }: { server: ServerWithStatus }) {
  const { t } = useTranslation();
  const { status } = server;

  if (status === 'online') {
    return (
      <Badge className={cn(statusBadgeSize, 'bg-[hsl(120_55%_42%/0.15)] text-[hsl(120_55%_62%)] border-[hsl(120_55%_42%/0.4)]')} aria-label={t('online')} title={t('online')}>
        <span className="h-1.5 w-1.5 rounded-full status-dot-online" />
      </Badge>
    );
  }

  if (status === 'offline') {
    return (
      <Badge className={cn(statusBadgeSize, 'bg-[hsl(0_55%_42%/0.15)] text-[hsl(0_55%_65%)] border-[hsl(0_55%_42%/0.4)]')} aria-label={t('offline')} title={t('offline')}>
        <span className="h-1.5 w-1.5 rounded-full status-dot-offline" />
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn(statusBadgeSize, 'text-muted-foreground border-border')} aria-label={status === 'loading' ? t('checking') : t('unknown')} title={status === 'loading' ? t('checking') : t('unknown')}>
      <span className="h-1.5 w-1.5 rounded-full status-dot-unknown" />
    </Badge>
  );
}

function WindowsLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <path fill="currentColor" d="M3 5.1 10.3 4v7H3V5.1Zm8.6-1.3L21 2.5V11h-9.4V3.8ZM3 12.8h7.3v7L3 18.9v-6.1Zm8.6 0H21v8.7l-9.4-1.3v-7.4Z" />
    </svg>
  );
}

function LinuxPenguin() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <path fill="currentColor" d="M12 2.5c-3.5 0-5.3 3.5-5.3 7.2 0 2-.8 3.7-1.8 5.1-.8 1.1-.1 2.7 1.3 2.7h11.6c1.4 0 2.1-1.6 1.3-2.7-1-1.4-1.8-3.1-1.8-5.1 0-3.7-1.8-7.2-5.3-7.2Z" />
      <ellipse cx="12" cy="13.1" rx="3.2" ry="4.5" fill="hsl(var(--background))" />
      <circle cx="10.2" cy="7.7" r=".8" fill="hsl(var(--background))" />
      <circle cx="13.8" cy="7.7" r=".8" fill="hsl(var(--background))" />
      <path fill="currentColor" d="M8 17.4c-2.1 0-3.5 1-3.5 2.1 0 .8 1.2 1.3 3.1 1.3h1.1v-3.4H8Zm8 0h-.7v3.4h1.1c1.9 0 3.1-.5 3.1-1.3 0-1.1-1.4-2.1-3.5-2.1Z" />
    </svg>
  );
}

function ServerTraitsBadges({ server }: { server: ServerWithStatus }) {
  const { t } = useTranslation();
  const os = server.queryData?.os?.toLowerCase();
  const osName = os?.includes('win') ? 'Windows' : os?.includes('linux') ? 'Linux' : undefined;
  const requiresPassword = server.queryData?.locked || server.password;
  return (
    <div className="flex flex-wrap gap-1.5">
      {osName && (
        <Badge variant="outline" className={cn(statusBadgeSize, 'border-border', osName === 'Windows' ? 'bg-blue-500/15 text-blue-500' : 'bg-green-500/15 text-green-600')} title={osName} aria-label={osName}>
          {osName === 'Windows'
            ? <WindowsLogo />
            : <LinuxPenguin />}
        </Badge>
      )}
      {requiresPassword && (
        <Badge variant="outline" className={cn(statusBadgeSize, 'border-red-500/40 bg-red-500/15 text-red-600')} title={t('locked')} aria-label={t('locked')}>
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
        </Badge>
      )}
    </div>
  );
}

function OZToolsBadge({ server }: { server: ServerWithStatus }) {
  if (!server.ozToolsInstalled) return null;
  const connected = server.status === 'online';
  const exposed = server.pluginListAvailable;
  const current = versionsMatch(server.ozToolsVersion, server.latestOZToolsVersion);
  const className = !exposed && !current
    ? 'border-muted-foreground/40 bg-muted text-muted-foreground'
    : connected && !current
      ? 'border-yellow-500/40 bg-yellow-500/15 text-yellow-700'
      : connected
        ? 'border-green-500/40 bg-green-500/15 text-green-600'
        : 'border-blue-500/40 bg-blue-500/15 text-blue-600';
  const title = server.latestOZToolsVersion
    ? `OZ Tools ${server.ozToolsVersion ?? '?'} / latest ${server.latestOZToolsVersion}`
    : `OZ Tools ${server.ozToolsVersion ?? ''}`.trim();
  return <Badge variant="outline" className={cn(statusBadgeSize, 'font-semibold', className)} title={title}>Ω</Badge>;
}

function versionsMatch(installed?: string, latest?: string): boolean {
  return !!installed && !!latest && installed.replace(/^v/i, '') === latest.replace(/^v/i, '');
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
  if (key === 'players') return getServerPlayerCount(server);
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
  const { isAdmin, isSuperAdmin, isAuthenticated } = useAuth();
  const [sortKey, setSortKey] = useState<SortKey>('players');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [blockedPendingIds, setBlockedPendingIds] = useState<Set<string>>(() => new Set());
  const [approvalPendingId, setApprovalPendingId] = useState<string | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [deletionPendingId, setDeletionPendingId] = useState<string | null>(null);
  const {
    serverList,
    addServer,
    removeServer,
    refreshServerList,
    refreshOne,
    setServerBlocked,
  } = useServerContext();

  const visibleServerList = serverList;
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
      if (!!left.masterOnly !== !!right.masterOnly) return left.masterOnly ? 1 : -1;
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
  }, [sortDirection, sortKey, visibleServerList]);

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

  const approveServer = async (server: ServerWithStatus) => {
    setApprovalError(null);
    setApprovalPendingId(server.id);
    try {
      await addServer({ label: getServerDisplayName(server), queryUrl: server.queryUrl, public: true });
      refreshServerList();
    } catch (error) {
      setApprovalError(error instanceof Error ? error.message : t('serverApprovalFailed'));
    } finally {
      setApprovalPendingId(null);
    }
  };

  const deleteOwnedServer = async (server: ServerWithStatus) => {
    if (!window.confirm(t('deleteServerConfirm', { name: getServerDisplayName(server) }))) return;
    setApprovalError(null);
    setDeletionPendingId(server.id);
    try {
      await removeServer(server.id);
      refreshServerList();
    } catch (error) {
      setApprovalError(error instanceof Error ? error.message : t('serverDeletionFailed'));
    } finally {
      setDeletionPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {approvalError && <p role="alert" className="text-sm text-destructive">{approvalError}</p>}
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
                const playerCount = getServerPlayerCountDisplay(server);
                const maxPlayers = data?.maxplayers ?? '?';
                const version = data?.version ?? server.version ?? '-';
                const connectUrl = server.masterOnly ? undefined : serverConnectUrl(server);

                return (
                  <TableRow key={server.id} className={server.masterOnly ? 'bg-muted/60 text-muted-foreground hover:bg-muted/70' : undefined}>
                    <TableCell className="min-w-[16rem]">
                      {server.masterOnly
                        ? <span className="font-medium"><RichText text={name} /></span>
                        : <Link to={`/server/${server.id}`} className="font-medium text-foreground hover:text-primary"><RichText text={name} /></Link>}
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
                        <OZToolsBadge server={server} />
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
                        <span className={cn('truncate', server.mapUrl && 'font-bold text-foreground')}>{map}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{version}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {getAddress(server)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {server.masterOnly && server.canApprove && (
                          <Button size="sm" variant="outline" disabled={approvalPendingId === server.id}
                            onClick={() => void approveServer(server)}>{t('approveServer')}</Button>
                        )}
                        {isAuthenticated && !server.masterOnly && <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => refreshOne(server.id)}
                          title={t('refreshStatus')}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>}
                        {server.canDelete && <Button size="sm" variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          disabled={deletionPendingId === server.id}
                          onClick={() => void deleteOwnedServer(server)} title={t('deleteServer')}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>}
                        {isSuperAdmin && !server.masterOnly && (
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
                        {!server.masterOnly && <Button asChild size="sm" variant="outline" className="h-8">
                          <Link to={`/server/${server.id}`}>{t('details')}</Link>
                        </Button>}
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
