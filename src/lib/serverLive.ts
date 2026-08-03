import type { ServerLiveStatusPayload } from '@/types/server';

export type ServerLiveConnectionState = 'disabled' | 'connecting' | 'subscribed' | 'disconnected';
export type ServerLiveRemovedField = 'queryData' | 'infoData' | 'onlinePlayers' | 'errorMessage';

export interface ServerStatusSnapshotMessage {
  type: 'server.status.snapshot';
  schemaVersion: 1;
  items: Array<{ serverId: string; value: ServerLiveStatusPayload }>;
  generatedAt: string;
}

export interface ServerStatusChangedMessage {
  type: 'server.status.changed';
  schemaVersion: 1;
  serverId: string;
  sequence: number;
  changed: Partial<ServerLiveStatusPayload>;
  removedFields: ServerLiveRemovedField[];
  generatedAt: string;
}

export interface ServerStatusSubscribedMessage {
  type: 'server.status.subscribed';
  schemaVersion: 1;
  serverIds: string[];
}

export function getServerLiveWebSocketUrl(backendUrl: string): string {
  const url = new URL(`${backendUrl.replace(/\/$/, '')}/api/storage/server-live`, window.location.href);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

export function parseServerLiveSubscribedMessage(value: unknown): ServerStatusSubscribedMessage | null {
  if (!record(value) || value.type !== 'server.status.subscribed' || value.schemaVersion !== 1 ||
    !Array.isArray(value.serverIds) || !value.serverIds.every((id) => typeof id === 'string')) return null;
  return value as unknown as ServerStatusSubscribedMessage;
}

export function parseServerStatusSnapshotMessage(
  value: unknown,
  selectedServerIds: ReadonlySet<string>,
): ServerStatusSnapshotMessage | null {
  if (!record(value) || value.type !== 'server.status.snapshot' || value.schemaVersion !== 1 ||
    !validDate(value.generatedAt) || !Array.isArray(value.items) ||
    !value.items.every((item) => record(item) && typeof item.serverId === 'string' &&
      selectedServerIds.has(item.serverId) && validStatusPayload(item.value))) return null;
  return value as unknown as ServerStatusSnapshotMessage;
}

export function parseServerStatusChangedMessage(
  value: unknown,
  selectedServerIds: ReadonlySet<string>,
): ServerStatusChangedMessage | null {
  if (!record(value) || value.type !== 'server.status.changed' || value.schemaVersion !== 1 ||
    typeof value.serverId !== 'string' || !selectedServerIds.has(value.serverId) ||
    !Number.isSafeInteger(value.sequence) || (value.sequence as number) <= 0 ||
    !validDate(value.generatedAt) || !record(value.changed) || !validPartialStatus(value.changed) ||
    !Array.isArray(value.removedFields) || !value.removedFields.every(isRemovedField)) return null;
  return value as unknown as ServerStatusChangedMessage;
}

function validStatusPayload(value: unknown): value is ServerLiveStatusPayload {
  return record(value) && (value.status === 'online' || value.status === 'offline') &&
    validDate(value.lastChecked) && validPartialStatus(value);
}

function validPartialStatus(value: Record<string, unknown>): boolean {
  const allowed = new Set(['status', 'queryData', 'infoData', 'onlinePlayers', 'lastChecked', 'errorMessage']);
  return Object.keys(value).every((key) => allowed.has(key)) &&
    (value.status === undefined || value.status === 'online' || value.status === 'offline') &&
    (value.lastChecked === undefined || validDate(value.lastChecked)) &&
    (value.errorMessage === undefined || typeof value.errorMessage === 'string') &&
    (value.onlinePlayers === undefined || Array.isArray(value.onlinePlayers));
}

function isRemovedField(value: unknown): value is ServerLiveRemovedField {
  return value === 'queryData' || value === 'infoData' || value === 'onlinePlayers' || value === 'errorMessage';
}

function validDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
