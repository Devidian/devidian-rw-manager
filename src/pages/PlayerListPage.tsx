import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PlayerUid } from '@/components/PlayerUid';
import { PlayerNameLink } from '@/components/PlayerNameLink';
import { RichText } from '@/components/RichText';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getServerCapacity, getServerPlayerCountDisplay, getServerDisplayName, getServerSecondaryName } from '@/lib/serverDisplay';
import type { ListedOnlinePlayer } from '@/lib/onlinePlayers';

interface OnlinePlayerRow {
  key: string;
  masterOnly: boolean;
  playerCount: number | string;
  playerId?: string | number;
  serverId: string;
  serverName: string;
  serverSecondaryName?: string;
  playerName: string;
  uid?: string;
  platform?: string;
  capacity: ReturnType<typeof getServerCapacity>;
}

export default function PlayerListPage({ onlinePlayers }: { onlinePlayers: ListedOnlinePlayer[] }) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const players = useMemo(() => {
    const rows: OnlinePlayerRow[] = onlinePlayers.map(({ key, server, player }) => ({
      key,
      masterOnly: server.masterOnly === true,
      playerCount: getServerPlayerCountDisplay(server),
      serverId: server.id,
      serverName: getServerDisplayName(server),
      serverSecondaryName: getServerSecondaryName(server),
      capacity: getServerCapacity(server),
      playerName: player.name || '-',
      playerId: player.id,
      uid: player.uid,
      platform: player.platform,
    }));

    return rows.sort((left, right) => {
      if (left.masterOnly !== right.masterOnly) return left.masterOnly ? 1 : -1;
      const capacity = right.capacity.current - left.capacity.current;
      if (capacity !== 0) return capacity;
      const server = left.serverName.localeCompare(right.serverName, undefined, { numeric: true, sensitivity: 'base' });
      if (server !== 0) return server;
      return left.playerName.localeCompare(right.playerName, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [onlinePlayers]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('playerList')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('playerListSummary', { count: players.length })}</p>
      </div>

      {players.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/30 border border-border mb-6">
            <Users className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">{t('noPlayersOnline')}</h2>
          <p className="text-muted-foreground text-sm max-w-sm">{t('playerListEmptyDesc')}</p>
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>{t('name')}</TableHead>
                {isAuthenticated && <TableHead>{t('uid')}</TableHead>}
                <TableHead>{t('server')}</TableHead>
                <TableHead>{t('serverCapacity')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map(player => (
                <TableRow key={player.key} className={player.masterOnly ? 'bg-muted/60 text-muted-foreground hover:bg-muted/70' : undefined}>
                  <TableCell className="font-medium">{player.masterOnly || player.playerId === undefined ? player.playerName
                    : <PlayerNameLink id={player.playerId} uid={player.uid} name={player.playerName} />}</TableCell>
                  {isAuthenticated && <TableCell><PlayerUid uid={player.masterOnly ? undefined : player.uid} platform={player.platform} authenticated={isAuthenticated} /></TableCell>}
                  <TableCell className="min-w-[16rem]">
                    {player.masterOnly
                      ? <span className="font-medium"><RichText text={player.serverName} /></span>
                      : <Link to={`/server/${player.serverId}`} className="font-medium text-foreground hover:text-primary">
                        <RichText text={player.serverName} />
                      </Link>}
                    {player.serverSecondaryName && (
                      <div className="text-xs text-muted-foreground truncate max-w-[20rem]">{player.serverSecondaryName}</div>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    <span className={player.masterOnly ? "font-medium" : "font-medium text-foreground"}>{player.playerCount}</span>
                    <span className="text-muted-foreground"> / {player.capacity.maximum}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
