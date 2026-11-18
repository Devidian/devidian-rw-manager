import type { ServerPlayerListPlayer, ServerWithStatus } from '@/types/server';

export interface OnlinePlayerEntry {
  key: string;
  server: ServerWithStatus;
  player: ServerPlayerListPlayer;
}

export type ListedOnlinePlayer = Omit<OnlinePlayerEntry, 'player'> & {
  player: Pick<ServerPlayerListPlayer, 'name'> & Partial<ServerPlayerListPlayer>;
};

export function unexportedOnlineNames(names: string[], exported: Pick<ServerPlayerListPlayer, 'name'>[]): string[] {
  const remaining = new Map<string, number>();
  for (const player of exported) {
    const name = player.name?.trim();
    if (name) remaining.set(name, (remaining.get(name) ?? 0) + 1);
  }
  return names.filter(name => {
    const count = remaining.get(name) ?? 0;
    if (count === 0) return true;
    remaining.set(name, count - 1);
    return false;
  });
}

function lastSeenAt(server: ServerWithStatus): number {
  const timestamp = Date.parse(server.lastSeen ?? '');
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function uniqueOnlinePlayers(servers: ServerWithStatus[]): OnlinePlayerEntry[] {
  const entries = new Map<string, OnlinePlayerEntry>();

  for (const server of servers) {
    for (const [index, player] of (server.onlinePlayers ?? []).entries()) {
      const key = `server:${server.id}:${player.id ?? player.slotId ?? index}`;
      const previous = entries.get(key);
      if (!previous || lastSeenAt(server) > lastSeenAt(previous.server)) {
        entries.set(key, { key, server, player });
      }
    }
  }

  return [...entries.values()];
}

export function listOnlinePlayers(servers: ServerWithStatus[], publicNames: Record<string, string[]>): ListedOnlinePlayer[] {
  const participating = [...new Map(servers
    .filter(server => !server.masterOnly && !server.blocked && server.status !== 'offline')
    .map(server => [server.id, server])).values()];
  const exported = uniqueOnlinePlayers(participating.filter(server => server.publicPlayerCount === undefined));
  const exportedByServer = new Map<string, ServerPlayerListPlayer[]>();
  for (const { server, player } of exported) {
    const players = exportedByServer.get(server.id) ?? [];
    players.push(player);
    exportedByServer.set(server.id, players);
  }
  return [...exported, ...participating.flatMap(server =>
    unexportedOnlineNames(publicNames[server.id] ?? [], exportedByServer.get(server.id) ?? [])
      .map((name, index) => ({ key: `public:${server.id}:${index}`, server, player: { name } })),
  )];
}
