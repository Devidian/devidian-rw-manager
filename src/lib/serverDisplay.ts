import { ServerInfoResponse, ServerWithStatus } from '@/types/server';

function getInfo(server: ServerWithStatus): Partial<ServerInfoResponse> | undefined {
  if (server.infoData) return server.infoData;
  return server.info && typeof server.info === 'object' ? server.info as Partial<ServerInfoResponse> : undefined;
}

export function getServerDisplayName(server: ServerWithStatus): string {
  const info = getInfo(server);
  return info?.name || server.queryData?.name || server.name || server.label || server.id;
}

export function getServerSecondaryName(server: ServerWithStatus): string | undefined {
  const shortname = getInfo(server)?.shortname;
  return shortname && shortname !== getServerDisplayName(server) ? shortname : undefined;
}

export function getServerPlayerCount(server: ServerWithStatus): number {
  if (server.status === 'offline') return 0;
  return server.publicPlayerCount ?? server.queryData?.playercount ?? server.onlinePlayers?.length ?? 0;
}

export function getServerPlayerCountDisplay(server: ServerWithStatus): number | string {
  if (server.masterOnly && server.status !== 'offline' && server.queryData?.playercount === undefined) return '—';
  return getServerPlayerCount(server);
}

export function getServerCapacity(server: ServerWithStatus): { current: number; maximum: number | string } {
  return {
    current: getServerPlayerCount(server),
    maximum: server.queryData?.maxplayers ?? '?',
  };
}
