import { useEffect, useRef, useState } from 'react';
import { TOKEN_KEY } from '@/lib/authApi';
import {
  getMapLiveWebSocketUrl,
  isMapLiveSubscribedMessage,
  parseMapLayersChangedMessage,
  type MapLayersChangedMessage,
} from '@/lib/mapLive';

const INITIAL_RECONNECT_MS = 1000;
const MAX_RECONNECT_MS = 30000;

export function useMapLiveSubscription(
  backendUrl: string,
  serverId: string,
  onLayersChanged: (message: MapLayersChangedMessage) => void,
): boolean {
  const callbackRef = useRef(onLayersChanged);
  const [subscribed, setSubscribed] = useState(false);
  callbackRef.current = onLayersChanged;

  useEffect(() => {
    if (!backendUrl || !serverId || typeof WebSocket === 'undefined') return;
    let active = true;
    let socket: WebSocket | undefined;
    let reconnectTimer: number | undefined;
    let reconnectDelay = INITIAL_RECONNECT_MS;

    const connect = () => {
      if (!active) return;
      setSubscribed(false);
      socket = new WebSocket(getMapLiveWebSocketUrl(backendUrl));
      socket.addEventListener('open', () => {
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
        if (isMapLiveSubscribedMessage(value, serverId)) {
          reconnectDelay = INITIAL_RECONNECT_MS;
          setSubscribed(true);
          return;
        }
        const message = parseMapLayersChangedMessage(value, serverId);
        if (message) callbackRef.current(message);
      });
      socket.addEventListener('close', (event) => {
        socket = undefined;
        setSubscribed(false);
        if (!active) return;
        if (event.code === 1008 || event.code === 1003) return;
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
  return subscribed;
}
