export const GLOBAL_INTERCOM_CHANNEL = 'global';
export const WEB_INTERCOM_CHANNEL = 'web';
export const GLOBAL_INTERCOM_CHANNELS = [GLOBAL_INTERCOM_CHANNEL, WEB_INTERCOM_CHANNEL] as const;
export type GlobalIntercomChannel = typeof GLOBAL_INTERCOM_CHANNELS[number];

export interface GlobalIntercomChatMessage {
  createdOn: string;
  chatVersion: number;
  chatContent: string;
  chatChannel: string;
  playerName: string;
  playerUID: string;
  sourceName: string;
  sourceIP: string;
  sourceVersion: string;
  attachment?: string;
}

export interface GlobalIntercomEnvelope<T = unknown> {
  event: string;
  payload?: T;
}

export interface GlobalIntercomServerPresence {
  name: string;
  playerCount: number;
  players: string[];
}

export interface GlobalIntercomServerPresenceUpdate {
  channel: string;
  servers: GlobalIntercomServerPresence[];
}

export function getGlobalIntercomWebSocketUrl(): string {
  return (import.meta.env.VITE_GLOBAL_INTERCOM_WS_URL as string | undefined)?.trim() ?? '';
}

export function isGlobalIntercomChatMessage(value: unknown): value is GlobalIntercomChatMessage {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<GlobalIntercomChatMessage>;
  return (
    typeof item.chatContent === 'string' &&
    typeof item.chatChannel === 'string' &&
    typeof item.playerName === 'string' &&
    typeof item.playerUID === 'string'
  );
}

export function isGlobalIntercomServerPresenceUpdate(value: unknown): value is GlobalIntercomServerPresenceUpdate {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<GlobalIntercomServerPresenceUpdate>;
  return typeof item.channel === 'string'
    && Array.isArray(item.servers)
    && item.servers.every((server) => Boolean(server)
      && typeof server.name === 'string'
      && typeof server.playerCount === 'number'
      && Number.isInteger(server.playerCount)
      && server.playerCount >= 0
      && Array.isArray(server.players)
      && server.players.every((player) => typeof player === 'string'));
}

export function createGlobalIntercomMessage(params: {
  content: string;
  playerName: string;
  playerUID: string;
  channel: GlobalIntercomChannel;
  sourceName?: string;
}): GlobalIntercomChatMessage {
  return {
    createdOn: new Date().toISOString(),
    chatVersion: 2,
    chatContent: params.content.trim(),
    chatChannel: params.channel,
    playerName: params.playerName,
    playerUID: params.playerUID,
    sourceName: params.sourceName || 'RW Manager',
    sourceIP: 'web',
    sourceVersion: 'frontend',
  };
}
