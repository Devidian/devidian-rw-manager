import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ServerWithStatus, DbPlayer } from '@/types/server';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft, RefreshCw, Users, MapPin, Tag, Lock, Gamepad2,
  Search, Loader2, WifiOff, HardDrive, Globe, Shield,
  Clock, Monitor, Sword, Heart, Star,
} from 'lucide-react';
import { useDatabasePlayers } from '@/hooks/useDatabasePlayers';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface ServerDetailProps {
  server: ServerWithStatus | undefined;
  onRefresh: () => void;
}

function StatusDisplay({ status }: { status: ServerWithStatus['status'] }) {
  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Verbindung wird geprüft…</span>
      </div>
    );
  }
  if (status === 'online') {
    return (
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full status-dot-online" />
        <span className="text-[hsl(120_55%_62%)] font-semibold text-lg">Online</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <WifiOff className="h-5 w-5 text-destructive" />
      <span className="text-destructive font-semibold text-lg">Offline</span>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number | boolean | null }) {
  if (value === undefined || value === null || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? 'Ja' : 'Nein') : String(value);
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground font-medium mt-0.5">{display}</p>
      </div>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function PlayersTab({ server }: { server: ServerWithStatus }) {
  const [search, setSearch] = useState('');
  const { players: dbPlayers, loading: dbLoading, error: dbError, fetchPlayers } = useDatabasePlayers();
  const hasDbAccess = !!server.backendUrl;

  useEffect(() => {
    if (server.backendUrl) {
      fetchPlayers(server.backendUrl);
    }
  }, [server.id, server.backendUrl]);

  const filtered = dbPlayers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.steamId ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {!hasDbAccess ? (
        <div className="text-center py-16 text-muted-foreground">
          <HardDrive className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Kein Game-Backend konfiguriert</p>
          <p className="text-sm mt-1 max-w-sm mx-auto">
            Füge eine Backend-URL beim Server hinzu, um Spielerdaten aus der Player.db abzurufen.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Spieler oder SteamID suchen…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="outline" className="gap-1.5 text-xs">
              <HardDrive className="h-3 w-3" />
              Player.db verbunden
            </Badge>
          </div>

          {dbLoading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Lade Spielerdaten aus der Datenbank…
            </div>
          )}

          {dbError && (
            <div className="rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Backend-Fehler: {dbError}
            </div>
          )}

          {!dbLoading && !dbError && filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Keine Spieler gefunden</p>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>Name</TableHead>
                    <TableHead>SteamID</TableHead>
                    <TableHead>Gruppe</TableHead>
                    <TableHead>Letzter Login</TableHead>
                    <TableHead>Spielzeit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((player) => (
                    <TableRow key={player.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {player.steamId ?? '—'}
                      </TableCell>
                      <TableCell>
                        {player.group ? (
                          <Badge variant="secondary" className="text-xs py-0 h-5">
                            {player.group}
                          </Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {player.lastLogin
                          ? formatDistanceToNow(new Date(player.lastLogin), { addSuffix: true, locale: de })
                          : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {player.playTime != null ? `${Math.round(player.playTime / 60)} Min.` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function ServerDetail({ server, onRefresh }: ServerDetailProps) {
  const navigate = useNavigate();

  if (!server) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-muted-foreground">
        <WifiOff className="h-12 w-12 mb-4 opacity-30" />
        <p className="font-medium">Server nicht gefunden.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
      </div>
    );
  }

  const data = server.queryData;
  const serverName = data?.name ?? server.label;
  const playercount = data?.playercount ?? 0;
  const maxplayers = data?.maxplayers ?? '?';
  const gamemodeLabel = data?.gamemode === 0 ? 'Survival' : data?.gamemode === 1 ? 'Creative' : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-3 text-muted-foreground hover:text-foreground -ml-2"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{serverName}</h1>
          {server.label !== serverName && (
            <p className="text-sm text-muted-foreground mt-0.5">{server.label}</p>
          )}
        </div>
        <div className="flex items-center gap-3 pt-9">
          <StatusDisplay status={server.status} />
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={onRefresh}
            disabled={server.status === 'loading'}
          >
            <RefreshCw className={cn('h-4 w-4', server.status === 'loading' && 'animate-spin')} />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Spieler', value: `${playercount} / ${maxplayers}`, icon: Users },
          { label: 'Karte', value: data?.map ?? '—', icon: MapPin },
          { label: 'Version', value: data?.version ? `v${data.version}` : '—', icon: Tag },
          { label: 'Spielmodus', value: gamemodeLabel, icon: Gamepad2 },
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

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-muted/30 border border-border">
          <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-muted">
            <Globe className="h-4 w-4" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="players" className="gap-2 data-[state=active]:bg-muted">
            <Users className="h-4 w-4" />
            Spieler
            {playercount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">{playercount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Server-Informationen</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {server.status === 'offline' ? (
                <div className="text-center py-8 text-muted-foreground">
                  <WifiOff className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>Server ist offline oder nicht erreichbar.</p>
                  {server.errorMessage && (
                    <p className="text-xs mt-2 text-destructive/70">{server.errorMessage}</p>
                  )}
                </div>
              ) : (
                <div>
                  <InfoRow icon={Tag} label="Servername" value={serverName} />
                  <InfoRow icon={MapPin} label="Karte / Map" value={data?.map} />
                  <InfoRow icon={Tag} label="Version" value={data?.version} />
                  <InfoRow icon={Users} label="Spieler" value={`${playercount} / ${maxplayers}`} />
                  <InfoRow icon={Gamepad2} label="Spielmodus" value={gamemodeLabel} />
                  <InfoRow icon={Clock} label="Uptime" value={data?.uptime != null ? formatUptime(data.uptime) : undefined} />
                  <InfoRow icon={Monitor} label="Betriebssystem" value={data?.os} />
                  <InfoRow icon={Globe} label="IP / Port" value={data?.ip && data?.port ? `${data.ip}:${data.port}` : undefined} />
                  <InfoRow icon={Tag} label="SteamID" value={data?.steamid != null ? String(data.steamid) : undefined} />
                  <InfoRow icon={Tag} label="Kontakt" value={data?.contact} />
                  <InfoRow icon={Lock} label="Gesperrt" value={data?.locked} />
                  <InfoRow icon={Shield} label="Whitelist" value={data?.whitelist} />
                  <InfoRow icon={Lock} label="Passwortgeschützt" value={data?.locked} />
                  <InfoRow icon={Sword} label="PvP" value={data?.pvp} />
                  <InfoRow icon={Heart} label="PvE" value={data?.pve} />
                  <InfoRow icon={Star} label="Friedensmodus" value={data?.peaceful} />
                  <InfoRow icon={HardDrive} label="Mods aktiv" value={data?.mods} />
                  <InfoRow icon={Globe} label="Query-URL" value={server.queryUrl} />
                  {server.backendUrl && (
                    <InfoRow icon={HardDrive} label="Game-Backend-URL" value={server.backendUrl} />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players" className="mt-4">
          <PlayersTab server={server} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
