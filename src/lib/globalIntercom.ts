export const GLOBAL_INTERCOM_CHANNEL = 'global';

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

export function createGlobalIntercomMessage(params: {
  content: string;
  playerName: string;
  playerUID: string;
  sourceName?: string;
}): GlobalIntercomChatMessage {
  return {
    createdOn: new Date().toISOString(),
    chatVersion: 2,
    chatContent: params.content.trim(),
    chatChannel: GLOBAL_INTERCOM_CHANNEL,
    playerName: params.playerName,
    playerUID: params.playerUID,
    sourceName: params.sourceName || 'RW Manager',
    sourceIP: 'web',
    sourceVersion: 'frontend',
  };
}
