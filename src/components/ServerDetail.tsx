import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ServerWithStatus, DbPlayer, ServerPlayerListPlayer, ServerConfig } from '@/types/server';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft, RefreshCw, Users, MapPin, Tag, Lock, Gamepad2,
  Search, Loader2, WifiOff, HardDrive, Globe, Shield,
  Clock, Monitor, Sword, Heart, Star, ExternalLink, Settings, Pencil,
  ArrowUp, ArrowDown,
  Map, Plug,
} from 'lucide-react';
import { useDatabasePlayers } from '@/hooks/useDatabasePlayers';
import { useServerConfig } from '@/hooks/useServerConfig';
import { useServerContext } from '@/context/ServerContext';
import { useStorageMode } from '@/context/StorageModeContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { de as deFns } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { RichText } from '@/components/RichText';
import { EditServerDialog } from '@/components/EditServerDialog';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAdminMapping } from '@/hooks/useAdminMapping';
import { AdminMapTab } from '@/components/AdminMapTab';
import { PluginsTab } from '@/components/PluginsTab';

interface ServerDetailProps {
  server: ServerWithStatus | undefined;
  onRefresh: () => void;
}

function useDateLocale() {
  const { i18n } = useTranslation();
  return i18n.language?.startsWith('de') ? deFns : enUS;
}

function SteamLink({ uid, platform }: { uid: string; platform: string }) {
  if (platform.toLowerCase() === 'steam') {
    return (
      <a
        href={`https://steamcommunity.com/profiles/${uid}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary underline underline-offset-2 hover:text-primary/80 font-mono text-xs"
        onClick={e => e.stopPropagation()}
      >
        {uid}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }
  return <span className="text-muted-foreground font-mono text-xs">{uid}</span>;
}

function StatusDisplay({ status }: { status: ServerWithStatus['status'] }) {
  const { t } = useTranslation();
  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>{t('connectionCheck')}</span>
      </div>
    );
  }
  if (status === 'online') {
    return (
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full status-dot-online" />
        <span className="text-[hsl(120_55%_62%)] font-semibold text-lg">{t('online')}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <WifiOff className="h-5 w-5 text-destructive" />
      <span className="text-destructive font-semibold text-lg">{t('offline')}</span>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number | boolean | null }) {
  const { t } = useTranslation();
  if (value === undefined || value === null || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? t('yes') : t('no')) : String(value);
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {display.includes('\n')?<pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono mt-1">{display}</pre>:
        <p className="text-sm text-foreground font-medium mt-0.5">{display.includes('<color')?<RichText text={display} />:display}</p>}
      </div>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatPlaytime(seconds: number): string {
  const h = Math.round(seconds / 3600);
  if (h > 0) return `${h}h`;
  return `${Math.round(seconds / 60)} min`;
}

function OnlinePlayersSection({ players }: { players: ServerPlayerListPlayer[] }) {
  const { t } = useTranslation();
  if (players.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">{t('noPlayersOnline')}</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead>{t('name')}</TableHead>
            <TableHead>{t('uid')}</TableHead>
            <TableHead>{t('platform')}</TableHead>
            <TableHead>{t('ping')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map(p => (
            <TableRow key={p.id} className="hover:bg-muted/20">
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell><SteamLink uid={BigInt(p.uid)+''} platform={p.platform} /></TableCell>
              <TableCell className="text-muted-foreground text-sm">{p.platform}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{p.ping} ms</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const CONFIG_GROUPS = ['Server', 'World', 'Settings', 'Database', 'RCON', 'Plugins', 'Permissions'] as const;

function ConfigTab({ backendUrl }: { backendUrl: string }) {
  const { t } = useTranslation();
  const { config, loading, error, fetchConfig } = useServerConfig();

  useEffect(() => {
    fetchConfig(backendUrl);
  }, [backendUrl, fetchConfig]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('connectionCheck')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
        {t('backendError')}: {error}
      </div>
    );
  }

  if (!config) return null;

  const grouped: Record<string, [string, string | number | boolean][]> = {};
  for (const [key, val] of Object.entries(config)) {
    const prefix = CONFIG_GROUPS.find(g => key.startsWith(g + '_')) ?? 'Other';
    if (!grouped[prefix]) grouped[prefix] = [];
    grouped[prefix].push([key, val]);
  }

  return (
    <div className="space-y-4">
      {CONFIG_GROUPS.map(group => {
        const entries = grouped[group];
        if (!entries || entries.length === 0) return null;
        return (
          <Card key={group} className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{group}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableBody>
                    {entries.map(([key, val]) => {
                      const shortKey = key.replace(`${group}_`, '');
                      const isSensitive = val === '***';
                      const isBool = val === 'True' || val === 'False';
                      const isRichText = typeof val === 'string' && (val.includes('<color'));
                      const strVal = String(val);

                      return (
                        <TableRow key={key} className="hover:bg-muted/20">
                          <TableCell className="font-medium text-sm w-1/3">{shortKey}</TableCell>
                          <TableCell className="text-sm">
                            {isRichText ? (
                              <RichText text={strVal} />
                            ) : isSensitive ? (
                              <Badge variant="outline" className="gap-1.5 text-xs text-muted-foreground">
                                <Lock className="h-3 w-3" />
                                {t('configSensitive')}
                              </Badge>
                            ) : isBool ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs',
                                  val === 'True'
                                    ? 'bg-[hsl(120_55%_42%/0.15)] text-[hsl(120_55%_62%)] border-[hsl(120_55%_42%/0.4)]'
                                    : 'bg-[hsl(0_55%_42%/0.15)] text-[hsl(0_55%_65%)] border-[hsl(0_55%_42%/0.4)]'
                                )}
                              >
                                {val === 'True' ? t('configTrue') : t('configFalse')}
                              </Badge>
                            ) : strVal.includes('\n') ? (
                              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">{strVal}</pre>
                            ) : (
                              <span className="text-muted-foreground">{strVal}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Player sort types ───────────────────────────────────────────────────────
type PlayerSortField = 'name' | 'platform' | 'permissiongroup' | 'playtime' | 'lastseen';
type SortDir = 'asc' | 'desc';
const PAGE_SIZE_KEY = 'rwm_player_page_size';

function SortablePlayerHeader({ field, label, sortField, sortDir, onSort }: {
  field: PlayerSortField; label: string; sortField: PlayerSortField; sortDir: SortDir;
  onSort: (f: PlayerSortField) => void;
}) {
  const active = sortField === field;
  return (
    <TableHead className="cursor-pointer select-none hover:text-foreground" onClick={() => onSort(field)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {active && (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </span>
    </TableHead>
  );
}

function PlayersTab({ server }: { server: ServerWithStatus }) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [search, setSearch] = useState('');
  const { players: dbPlayers, loading: dbLoading, error: dbError, fetchPlayers } = useDatabasePlayers();
  const hasDbAccess = !!server.backendUrl;
  const onlinePlayers = server.onlinePlayers ?? [];

  // Sort state
  const [sortField, setSortField] = useState<PlayerSortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Pagination state
  const [pageSize, setPageSize] = useState<number>(() => {
    const stored = localStorage.getItem(PAGE_SIZE_KEY);
    return stored ? parseInt(stored, 10) : 50;
  });
  const [currentPage, setCurrentPage] = useState(0);

  const handleSort = (field: PlayerSortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handlePageSize = (val: string) => {
    const num = parseInt(val, 10);
    setPageSize(num);
    setCurrentPage(0);
    localStorage.setItem(PAGE_SIZE_KEY, val);
  };

  useEffect(() => {
    if (server.backendUrl) {
      fetchPlayers(server.backendUrl);
    }
  }, [server.id, server.backendUrl, fetchPlayers]);

  const filteredDb = dbPlayers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.uid.toLowerCase().includes(search.toLowerCase())
  );

  const sortedDb = useMemo(() => {
    return [...filteredDb].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'platform': cmp = a.platform.localeCompare(b.platform); break;
        case 'permissiongroup': cmp = (a.permissiongroup || '').localeCompare(b.permissiongroup || ''); break;
        case 'playtime': cmp = a.playtime - b.playtime; break;
        case 'lastseen': cmp = (a.lastseen || 0) - (b.lastseen || 0); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredDb, sortField, sortDir]);

  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(sortedDb.length / pageSize));
  const pagedDb = pageSize === -1 ? sortedDb : sortedDb.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  // Reset page when search changes
  useEffect(() => { setCurrentPage(0); }, [search]);

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('onlinePlayers')}
            <Badge variant="secondary" className="text-xs">{onlinePlayers.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <OnlinePlayersSection players={onlinePlayers} />
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            {t('dbPlayers')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {!hasDbAccess ? (
            <div className="text-center py-12 text-muted-foreground">
              <HardDrive className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{t('noBackend')}</p>
              <p className="text-sm mt-1 max-w-sm mx-auto">{t('noBackendDesc')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('searchPlayers')}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Badge variant="outline" className="gap-1.5 text-xs">
                  <HardDrive className="h-3 w-3" />
                  {t('dbConnected')}
                </Badge>
              </div>

              {dbLoading && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('loadingPlayers')}
                </div>
              )}

              {dbError && (
                <div className="rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {t('backendError')}: {dbError}
                </div>
              )}

              {!dbLoading && !dbError && filteredDb.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">{t('noPlayersFound')}</p>
                </div>
              )}

              {pagedDb.length > 0 && (
                <>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <SortablePlayerHeader field="name" label={t('name')} sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                          <TableHead>{t('uid')}</TableHead>
                          <SortablePlayerHeader field="platform" label={t('platform')} sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                          <SortablePlayerHeader field="permissiongroup" label={t('group')} sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                          <SortablePlayerHeader field="playtime" label={t('playtime')} sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                          <SortablePlayerHeader field="lastseen" label={t('lastSeen')} sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                          <TableHead>{t('health')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedDb.map(player => (
                          <TableRow key={player.id} className="hover:bg-muted/20">
                            <TableCell className="font-medium">{player.name}</TableCell>
                            <TableCell><SteamLink uid={BigInt(player.uid)+''} platform={player.platform} /></TableCell>
                            <TableCell className="text-muted-foreground text-sm">{player.platform}</TableCell>
                            <TableCell>
                              {player.permissiongroup ? (
                                <Badge variant="secondary" className="text-xs py-0 h-5">{player.permissiongroup}</Badge>
                              ) : '—'}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatPlaytime(player.playtime)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {player.lastseen
                                ? formatDistanceToNow(new Date(player.lastseen * 1000), { addSuffix: true, locale: dateLocale })
                                : '—'}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              ❤ {Math.round(player.health)} | 🍖 {Math.round(player.hunger)} | 💧 {Math.round(player.thirst)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination controls */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>{t('pageSize')}:</span>
                      <Select value={String(pageSize)} onValueChange={handlePageSize}>
                        <SelectTrigger className="h-7 w-20 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[10, 25, 50, 100].map(n => (
                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                          ))}
                          <SelectItem value="-1">{t('all')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {pageSize !== -1 && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          disabled={currentPage === 0}
                          onClick={() => setCurrentPage(p => p - 1)}
                        >
                          ‹
                        </Button>
                        <span>{t('page')} {currentPage + 1} {t('of')} {totalPages}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          disabled={currentPage >= totalPages - 1}
                          onClick={() => setCurrentPage(p => p + 1)}
                        >
                          ›
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ServerDetail({ server, onRefresh }: ServerDetailProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updateServer } = useServerContext();
  const { mode } = useStorageMode();
  const { isAdmin, isAuthenticated } = useAuth();
  const canEdit = mode === 'local' || isAdmin;
  const showPublicFlag = mode === 'fixed' || mode === 'backend';
  const [editOpen, setEditOpen] = useState(false);
  const adminMapping = useAdminMapping(server?.backendUrl);

  if (!server) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-muted-foreground">
        <WifiOff className="h-12 w-12 mb-4 opacity-30" />
        <p className="font-medium">{t('serverNotFound')}</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('back')}
        </Button>
      </div>
    );
  }

  const data = server.queryData;
  const info = server.infoData;
  const serverName = data?.name ?? server.label;
  const playercount = data?.playercount ?? 0;
  const maxplayers = data?.maxplayers ?? '?';
  const gamemodeLabel = data?.gamemode === 0 ? t('survival') : data?.gamemode === 1 ? t('creative') : '—';
  const headerImageUrl = info?.headerimage ? `${server.queryUrl.replace(/\/$/, '')}/image/header` : null;
  const hasBackend = !!server.backendUrl;

  return (
    <div className="space-y-6">
      {headerImageUrl && (
        <div className="rounded-lg overflow-hidden border border-border">
          <img
            src={headerImageUrl}
            alt={`${serverName} Banner`}
            className="w-full h-48 object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-3 text-muted-foreground hover:text-foreground -ml-2"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('dashboard')}
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            <RichText text={serverName} />
          </h1>
          {info?.shortname && (
            <p className="text-sm text-muted-foreground mt-0.5">{info.shortname}</p>
          )}
          {!info?.shortname && server.label !== serverName && (
            <p className="text-sm text-muted-foreground mt-0.5">{server.label}</p>
          )}
          {/* {info?.description && (
            <span className="text-sm text-muted-foreground mt-2">
              <RichText text={info.description} code={true} />
            </span>
          )} */}
        </div>
        <div className="flex items-center gap-3 pt-9">
          <StatusDisplay status={server.status} />
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={onRefresh}
            disabled={server.status === 'loading'}
          >
            <RefreshCw className={cn('h-4 w-4', server.status === 'loading' && 'animate-spin')} />
            {t('refresh')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('playerCount'), value: `${playercount} / ${maxplayers}`, icon: Users },
          { label: t('map'), value: data?.map ?? '—', icon: MapPin },
          { label: t('version'), value: data?.version ? `v${data.version}` : '—', icon: Tag },
          { label: t('gamemode'), value: gamemodeLabel, icon: Gamepad2 },
        ].map(stat => (
          <Card key={stat.label} className="bg-muted/20 border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
              <p className="text-sm font-semibold text-foreground truncate">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-muted/30 border border-border">
          <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-muted">
            <Globe className="h-4 w-4" />
            {t('overview')}
          </TabsTrigger>
          <TabsTrigger value="players" className="gap-2 data-[state=active]:bg-muted">
            <Users className="h-4 w-4" />
            {t('players')}
            {playercount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">{playercount}</Badge>
            )}
          </TabsTrigger>
          {hasBackend && adminMapping.map.available && (
            <TabsTrigger value="admin-map" className="gap-2 data-[state=active]:bg-muted">
              <Map className="h-4 w-4" />
              {t('map')}
            </TabsTrigger>
          )}
          {hasBackend && (
            <TabsTrigger value="plugins" className="gap-2 data-[state=active]:bg-muted">
              <Plug className="h-4 w-4" />
              {t('plugins')}
            </TabsTrigger>
          )}
          {hasBackend && (
            isAuthenticated ? (
              <TabsTrigger value="config" className="gap-2 data-[state=active]:bg-muted">
                <Settings className="h-4 w-4" />
                {t('configuration')}
              </TabsTrigger>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground/50 cursor-not-allowed">
                    <Lock className="h-4 w-4" />
                    {t('configuration')}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t('configRequiresAuth')}</TooltipContent>
              </Tooltip>
            )
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('serverInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {server.status === 'offline' ? (
                <div className="text-center py-8 text-muted-foreground">
                  <WifiOff className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>{t('serverOffline')}</p>
                  {server.errorMessage && (
                    <p className="text-xs mt-2 text-destructive/70">{server.errorMessage}</p>
                  )}
                </div>
              ) : (
                <div>
                  <InfoRow icon={Tag} label={t('serverName')} value={serverName} />
                  {info?.shortname && <InfoRow icon={Tag} label={t('shortName')} value={info.shortname} />}
                  {info?.description && <InfoRow icon={Tag} label={t('description')} value={info.description} />}
                  <InfoRow icon={MapPin} label={t('map')} value={data?.map} />
                  <InfoRow icon={Tag} label={t('version')} value={data?.version} />
                  <InfoRow icon={Users} label={t('playerCount')} value={`${playercount} / ${maxplayers}`} />
                  <InfoRow icon={Gamepad2} label={t('gamemode')} value={gamemodeLabel} />
                  <InfoRow icon={Clock} label={t('uptime')} value={data?.uptime != null ? formatUptime(data.uptime) : undefined} />
                  <InfoRow icon={Monitor} label={t('os')} value={data?.os} />
                  <InfoRow icon={Globe} label={t('ipPort')} value={data?.ip && data?.port ? `${data.ip}:${data.port}` : undefined} />
                  <InfoRow icon={Tag} label={t('steamId')} value={data?.steamid != null ? BigInt(data.steamid)+'' : undefined} />
                  <InfoRow icon={Tag} label={t('contact')} value={info?.contact ?? data?.contact} />
                  <InfoRow icon={Lock} label={t('locked')} value={data?.locked} />
                  <InfoRow icon={Shield} label={t('whitelist')} value={data?.whitelist} />
                  <InfoRow icon={Sword} label={t('pvp')} value={data?.pvp} />
                  <InfoRow icon={Heart} label={t('pve')} value={data?.pve} />
                  <InfoRow icon={Star} label={t('peaceful')} value={data?.peaceful} />
                  <InfoRow icon={HardDrive} label={t('modsActive')} value={data?.mods} />
                  <InfoRow icon={Globe} label={t('queryUrl')} value={server.queryUrl} />
                  {server.backendUrl && (
                    <InfoRow icon={HardDrive} label={t('backendUrl')} value={server.backendUrl} />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players" className="mt-4">
          <PlayersTab server={server} />
        </TabsContent>

        {hasBackend && adminMapping.map.available && (
          <TabsContent value="admin-map" className="mt-4">
            <AdminMapTab
              backendUrl={server.backendUrl!}
              metadata={adminMapping.map.metadata}
              onlinePlayers={server.onlinePlayers ?? []}
              isAdmin={isAdmin}
            />
          </TabsContent>
        )}

        {hasBackend && (
          <TabsContent value="plugins" className="mt-4">
            <PluginsTab plugins={adminMapping.plugins} loading={adminMapping.pluginsLoading} error={adminMapping.pluginsError} />
          </TabsContent>
        )}

        {hasBackend && isAuthenticated && (
          <TabsContent value="config" className="mt-4">
            <ConfigTab backendUrl={server.backendUrl!} />
          </TabsContent>
        )}
      </Tabs>

      {canEdit && (
        <EditServerDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          server={server}
          onSave={updateServer}
          showPublicFlag={showPublicFlag}
        />
      )}
    </div>
  );
}
