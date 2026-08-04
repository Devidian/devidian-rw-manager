import { useEffect, useRef, useState } from 'react';
import { TOKEN_KEY } from '@/lib/authApi';
import {
  getServerLiveWebSocketUrl,
  parseServerLiveSubscribedMessage,
  parseServerStatusChangedMessage,
  parseServerStatusSnapshotMessage,
  type ServerLiveConnectionState,
  type ServerStatusChangedMessage,
  type ServerStatusSnapshotMessage,
} from '@/lib/serverLive';

const INITIAL_RECONNECT_MS = 1000;
const MAX_RECONNECT_MS = 30000;

export function useServerLiveSubscription(
  backendUrl: string | null,
  serverIds: string[],
  onSnapshot: (message: ServerStatusSnapshotMessage) => void,
  onChanged: (message: ServerStatusChangedMessage) => void,
): ServerLiveConnectionState {
  const callbacksRef = useRef({ onSnapshot, onChanged });
  const idsRef = useRef(serverIds);
  const socketRef = useRef<WebSocket>();
  const subscribedRef = useRef(false);
  const [state, setState] = useState<ServerLiveConnectionState>(() =>
    backendUrl && typeof WebSocket !== 'undefined' ? 'connecting' : 'disabled');
  callbacksRef.current = { onSnapshot, onChanged };
  idsRef.current = serverIds;

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || !subscribedRef.current) return;
    socket.send(JSON.stringify({ type: 'server.status.set-servers', schemaVersion: 1, serverIds }));
  }, [serverIds]);

  useEffect(() => {
    if (!backendUrl || typeof WebSocket === 'undefined') {
      setState('disabled');
      return;
    }
    let active = true;
    let reconnectTimer: number | undefined;
    let reconnectDelay = INITIAL_RECONNECT_MS;

    const connect = () => {
      if (!active) return;
      subscribedRef.current = false;
      setState('connecting');
      const socket = new WebSocket(getServerLiveWebSocketUrl(backendUrl));
      socketRef.current = socket;
      socket.addEventListener('open', () => socket.send(JSON.stringify({
        type: 'server.status.subscribe',
        schemaVersion: 1,
        serverIds: idsRef.current,
        token: localStorage.getItem(TOKEN_KEY) ?? undefined,
      })));
      socket.addEventListener('message', (event) => {
        let value: unknown;
        try { value = JSON.parse(String(event.data)); } catch { return; }
        const subscribed = parseServerLiveSubscribedMessage(value);
        if (subscribed) {
          subscribedRef.current = true;
          reconnectDelay = INITIAL_RECONNECT_MS;
          setState('subscribed');
          if (!sameIds(subscribed.serverIds, idsRef.current)) {
            socket.send(JSON.stringify({
              type: 'server.status.set-servers', schemaVersion: 1, serverIds: idsRef.current,
            }));
          }
          return;
        }
        const selectedIds = new Set(idsRef.current);
        const snapshot = parseServerStatusSnapshotMessage(value, selectedIds);
        if (snapshot) callbacksRef.current.onSnapshot(snapshot);
        const changed = parseServerStatusChangedMessage(value, selectedIds);
        if (changed) callbacksRef.current.onChanged(changed);
      });
      socket.addEventListener('close', (event) => {
        if (socketRef.current === socket) socketRef.current = undefined;
        subscribedRef.current = false;
        if (!active) return;
        setState('disconnected');
        if (event.code === 1008 || event.code === 1003) return;
        reconnectTimer = window.setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_MS);
      });
    };

    connect();
    return () => {
      active = false;
      subscribedRef.current = false;
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
      socketRef.current?.close(1000, 'server_status_unmounted');
      socketRef.current = undefined;
    };
  }, [backendUrl]);
  return state;
}

function sameIds(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((value, index) => value === sortedRight[index]);
}
