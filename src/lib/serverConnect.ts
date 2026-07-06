import type { ServerConfig } from '@/types/server';

function normalizeAddress(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.includes(':') ? trimmed : undefined;
}

export function serverConnectAddress(server: ServerConfig): string | undefined {
  return normalizeAddress(server.addr)
    ?? (server.ip && server.port ? `${server.ip}:${server.port}` : undefined)
    ?? (server.queryData?.ip && server.queryData?.port ? `${server.queryData.ip}:${server.queryData.port}` : undefined);
}

export function serverConnectUrl(server: ServerConfig): string | undefined {
  const address = serverConnectAddress(server);
  return address ? `steam://run/324080//+connect ${address}` : undefined;
}
