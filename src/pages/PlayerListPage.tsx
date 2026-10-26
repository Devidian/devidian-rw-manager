import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useServerContext } from '@/context/ServerContext';
import { PlayerUid } from '@/components/PlayerUid';
import { PlayerNameLink } from '@/components/PlayerNameLink';
import { RichText } from '@/components/RichText';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getServerCapacity, getServerDisplayName, getServerSecondaryName } from '@/lib/serverDisplay';
import { uniqueOnlinePlayers } from '@/lib/onlinePlayers';

interface OnlinePlayerRow {
  serverId: string;
  serverName: string;
  serverSecondaryName?: string;
  playerName: string;
  uid: string;
  platform: string;
  capacity: ReturnType<typeof getServerCapacity>;
}

export default function PlayerListPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { serverList } = useServerContext();

  const players = useMemo(() => uniqueOnlinePlayers(serverList).map(({ server, player }) => {
    const capacity = getServerCapacity(server);
    return {
      serverId: server.id,
      serverName: getServerDisplayName(server),
      serverSecondaryName: getServerSecondaryName(server),
      playerName: player.name || '-',
      uid: player.uid,
      platform: player.platform,
      capacity,
    };
  }).sort((left, right) => {
    const capacity = right.capacity.current - left.capacity.current;
    if (capacity !== 0) return capacity;
    const server = left.serverName.localeCompare(right.serverName, undefined, { numeric: true, sensitivity: 'base' });
    if (server !== 0) return server;
    return left.playerName.localeCompare(right.playerName, undefined, { numeric: true, sensitivity: 'base' });
  }), [serverList]);

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
                <TableHead>{t('uid')}</TableHead>
                <TableHead>{t('server')}</TableHead>
                <TableHead>{t('serverCapacity')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map(player => (
                <TableRow key={`${player.serverId}:${player.uid}`}>
                  <TableCell className="font-medium"><PlayerNameLink uid={player.uid} name={player.playerName} /></TableCell>
                  <TableCell><PlayerUid uid={player.uid} platform={player.platform} authenticated={isAuthenticated} /></TableCell>
                  <TableCell className="min-w-[16rem]">
                    <Link to={`/server/${player.serverId}`} className="font-medium text-foreground hover:text-primary">
                      <RichText text={player.serverName} />
                    </Link>
                    {player.serverSecondaryName && (
                      <div className="text-xs text-muted-foreground truncate max-w-[20rem]">{player.serverSecondaryName}</div>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    <span className="font-medium text-foreground">{player.capacity.current}</span>
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
