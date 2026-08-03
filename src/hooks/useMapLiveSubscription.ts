import { useEffect, useRef } from 'react';
import { TOKEN_KEY } from '@/lib/authApi';
import {
  getMapLiveWebSocketUrl,
  parseMapLayersChangedMessage,
  type MapLiveLayer,
} from '@/lib/mapLive';

const INITIAL_RECONNECT_MS = 1000;
const MAX_RECONNECT_MS = 30000;

export function useMapLiveSubscription(
  backendUrl: string,
  serverId: string,
  onLayersChanged: (layers: MapLiveLayer[]) => void,
): void {
  const callbackRef = useRef(onLayersChanged);
  callbackRef.current = onLayersChanged;

  useEffect(() => {
    if (!backendUrl || !serverId || typeof WebSocket === 'undefined') return;
    let active = true;
    let socket: WebSocket | undefined;
    let reconnectTimer: number | undefined;
    let reconnectDelay = INITIAL_RECONNECT_MS;

    const connect = () => {
      if (!active) return;
      socket = new WebSocket(getMapLiveWebSocketUrl(backendUrl));
      socket.addEventListener('open', () => {
        reconnectDelay = INITIAL_RECONNECT_MS;
        socket?.send(JSON.stringify({
          type: 'subscribe',
          schemaVersion: 1,
          serverId,
          token: localStorage.getItem(TOKEN_KEY) ?? undefined,
        }));
      });
      socket.addEventListener('message', (event) => {
        let value: unknown;
        try {
          value = JSON.parse(String(event.data));
        } catch {
          return;
        }
        const message = parseMapLayersChangedMessage(value, serverId);
        if (message) callbackRef.current(message.layers);
      });
      socket.addEventListener('close', () => {
        socket = undefined;
        if (!active) return;
        reconnectTimer = window.setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_MS);
      });
    };

    connect();
    return () => {
      active = false;
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
      socket?.close(1000, 'map_unmounted');
    };
  }, [backendUrl, serverId]);
}
