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

export function getServerCapacity(server: ServerWithStatus): { current: number; maximum: number | string } {
  return {
    current: server.queryData?.playercount ?? server.onlinePlayers?.length ?? 0,
    maximum: server.queryData?.maxplayers ?? '?',
  };
}
