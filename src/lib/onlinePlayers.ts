import type { ServerPlayerListPlayer, ServerWithStatus } from '@/types/server';

export interface OnlinePlayerEntry {
  server: ServerWithStatus;
  player: ServerPlayerListPlayer;
}

function lastSeenAt(server: ServerWithStatus): number {
  const timestamp = Date.parse(server.lastSeen ?? '');
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function uniqueOnlinePlayers(servers: ServerWithStatus[]): OnlinePlayerEntry[] {
  const entries = new Map<string, OnlinePlayerEntry>();

  for (const server of servers) {
    for (const player of server.onlinePlayers ?? []) {
      const uid = player.uid?.trim();
      const key = uid
        ? `uid:${player.platform}:${uid}:${uid.includes('*') ? player.name?.trim().toLowerCase() ?? '' : ''}`
        : `server:${server.id}:${player.id}`;
      const previous = entries.get(key);
      if (!previous || lastSeenAt(server) > lastSeenAt(previous.server)) {
        entries.set(key, { server, player });
      }
    }
  }

  return [...entries.values()];
}
