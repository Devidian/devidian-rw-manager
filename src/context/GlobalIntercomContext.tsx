import {
  createContext,
  FormEvent,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  createGlobalIntercomMessage,
  getGlobalIntercomWebSocketUrl,
  GlobalIntercomChatMessage,
  GlobalIntercomChannel,
  GlobalIntercomEnvelope,
  GlobalIntercomServerPresence,
  GlobalIntercomServerPresenceUpdate,
  GLOBAL_INTERCOM_CHANNEL,
  GLOBAL_INTERCOM_CHANNELS,
  isGlobalIntercomChatMessage,
  isGlobalIntercomServerPresenceUpdate,
} from '@/lib/globalIntercom';

export type GlobalIntercomConnectionState = 'unconfigured' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface GlobalIntercomChatEntry extends GlobalIntercomChatMessage {
  id: string;
  direction: 'incoming' | 'outgoing';
}

interface GlobalIntercomContextValue {
  canSend: boolean;
  connectionState: GlobalIntercomConnectionState;
  messages: GlobalIntercomChatEntry[];
  activeChannel: GlobalIntercomChannel;
  servers: GlobalIntercomServerPresence[];
  unreadCount: number;
  unreadCounts: Record<GlobalIntercomChannel, number>;
  sendMessage: (content: string) => void;
  selectChannel: (channel: GlobalIntercomChannel) => void;
  markRead: () => void;
}

const MAX_STORED_MESSAGES = 100;
const RECONNECT_DELAY_MS = 3000;
const GlobalIntercomContext = createContext<GlobalIntercomContextValue | null>(null);

export function GlobalIntercomProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const guestIdRef = useRef(`web-${Math.random().toString(36).slice(2)}`);
  const pendingEchoKeysRef = useRef(new Set<string>());
  const [connectionState, setConnectionState] = useState<GlobalIntercomConnectionState>('connecting');
  const [messagesByChannel, setMessagesByChannel] = useState<Record<GlobalIntercomChannel, GlobalIntercomChatEntry[]>>({ global: [], web: [] });
  const [activeChannel, setActiveChannel] = useState<GlobalIntercomChannel>(GLOBAL_INTERCOM_CHANNEL);
  const [servers, setServers] = useState<GlobalIntercomServerPresence[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<GlobalIntercomChannel, number>>({ global: 0, web: 0 });
  const wsUrl = useMemo(() => getGlobalIntercomWebSocketUrl(), []);
  const displayName = user?.username || user?.email || user?.steamId || t('globalIntercomWebUser');
  const playerUID = user?.steamId || user?.id || guestIdRef.current;
  const isChatOpenRef = useRef(location.pathname === '/global-intercom');
  const activeChannelRef = useRef(activeChannel);
  const messages = messagesByChannel[activeChannel];
  const unreadCount = unreadCounts.global + unreadCounts.web;

  useEffect(() => {
    activeChannelRef.current = activeChannel;
  }, [activeChannel]);

  useEffect(() => {
    isChatOpenRef.current = location.pathname === '/global-intercom';
    if (isChatOpenRef.current) setUnreadCounts(current => ({ ...current, [activeChannelRef.current]: 0 }));
  }, [location.pathname]);

  useEffect(() => {
    if (!wsUrl) {
      setConnectionState('unconfigured');
      return;
    }

    let active = true;

    const clearReconnectTimeout = () => {
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (!active || reconnectTimeoutRef.current) return;
      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectTimeoutRef.current = null;
        connect();
      }, RECONNECT_DELAY_MS);
    };

    const connect = () => {
      if (!active) return;
      setConnectionState('connecting');
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.addEventListener('open', () => {
        if (!active || socketRef.current !== socket) return;
        setConnectionState('connected');
        sendPlayerState(socket, displayName, playerUID);
      });
      socket.addEventListener('close', () => {
        if (!active || socketRef.current !== socket) return;
        socketRef.current = null;
        setServers([]);
        setConnectionState('disconnected');
        scheduleReconnect();
      });
      socket.addEventListener('error', () => {
        if (!active || socketRef.current !== socket) return;
        setConnectionState('error');
        scheduleReconnect();
      });
      socket.addEventListener('message', (event) => {
        if (!active || socketRef.current !== socket) return;
        const presence = parseServerPresence(event.data);
        if (presence?.channel === GLOBAL_INTERCOM_CHANNEL) {
          setServers(presence.servers);
          return;
        }
        const entry = parseChatEntry(event.data, 'incoming');
        if (!entry || !isIntercomChannel(entry.chatChannel)) return;
        const echoKey = messageEchoKey(entry);
        if (entry.playerUID === playerUID && pendingEchoKeysRef.current.delete(echoKey)) return;
        setMessagesByChannel(current => ({
          ...current,
          [entry.chatChannel]: appendStoredMessage(current[entry.chatChannel], entry),
        }));
        if (!isChatOpenRef.current || activeChannelRef.current !== entry.chatChannel) {
          setUnreadCounts(current => ({ ...current, [entry.chatChannel]: current[entry.chatChannel] + 1 }));
        }
      });
    };

    connect();

    return () => {
      active = false;
      clearReconnectTimeout();
      const socket = socketRef.current;
      socketRef.current = null;
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          event: 'playerOffline',
          payload: { playerName: displayName, playerUID },
        }));
      }
      socket?.close();
    };
  }, [displayName, playerUID, wsUrl]);

  const sendMessage = useCallback((content: string) => {
    const trimmed = content.trim();
    const socket = socketRef.current;
    if (!isAuthenticated || connectionState !== 'connected' || !socket || !trimmed) return;

    const message = createGlobalIntercomMessage({
      content: trimmed,
      playerName: displayName,
      playerUID,
      channel: activeChannel,
    });
    const envelope: GlobalIntercomEnvelope<GlobalIntercomChatMessage> = {
      event: 'broadcastMessage',
      payload: message,
    };

    socket.send(JSON.stringify(envelope));
    pendingEchoKeysRef.current.add(messageEchoKey(message));
    setMessagesByChannel(current => ({
      ...current,
      [activeChannel]: appendStoredMessage(current[activeChannel], toChatEntry(message, 'outgoing')),
    }));
  }, [activeChannel, connectionState, displayName, isAuthenticated, playerUID]);

  const markRead = useCallback(() => setUnreadCounts(current => ({ ...current, [activeChannelRef.current]: 0 })), []);
  const selectChannel = useCallback((channel: GlobalIntercomChannel) => {
    setActiveChannel(channel);
    setUnreadCounts(current => ({ ...current, [channel]: 0 }));
  }, []);

  const value: GlobalIntercomContextValue = {
    canSend: isAuthenticated && connectionState === 'connected',
    connectionState,
    messages,
    activeChannel,
    servers,
    unreadCount,
    unreadCounts,
    sendMessage,
    selectChannel,
    markRead,
  };

  return (
    <GlobalIntercomContext.Provider value={value}>
      {children}
    </GlobalIntercomContext.Provider>
  );
}

export function useGlobalIntercom() {
  const context = useContext(GlobalIntercomContext);
  if (!context) throw new Error('useGlobalIntercom must be used within GlobalIntercomProvider');
  return context;
}

export function submitGlobalIntercomDraft(
  event: FormEvent,
  params: { canSend: boolean; draft: string; sendMessage: (content: string) => void; clearDraft: () => void },
) {
  event.preventDefault();
  const content = params.draft.trim();
  if (!params.canSend || !content) return;
  params.sendMessage(content);
  params.clearDraft();
}

function parseChatEntry(data: unknown, direction: GlobalIntercomChatEntry['direction']): GlobalIntercomChatEntry | null {
  if (typeof data !== 'string') return null;
  try {
    const envelope = JSON.parse(data) as GlobalIntercomEnvelope;
    if (envelope.event !== 'broadcastMessage' || !isGlobalIntercomChatMessage(envelope.payload)) return null;
    return toChatEntry(envelope.payload, direction);
  } catch {
    return null;
  }
}

function appendStoredMessage(current: GlobalIntercomChatEntry[], entry: GlobalIntercomChatEntry): GlobalIntercomChatEntry[] {
  return [...current, entry].slice(-MAX_STORED_MESSAGES);
}

function toChatEntry(message: GlobalIntercomChatMessage, direction: GlobalIntercomChatEntry['direction']): GlobalIntercomChatEntry {
  return {
    ...message,
    id: `${direction}-${message.createdOn}-${message.playerUID}-${Math.random().toString(36).slice(2)}`,
    direction,
  };
}

function messageEchoKey(message: Pick<GlobalIntercomChatMessage, 'createdOn' | 'chatChannel' | 'chatContent' | 'playerUID'>): string {
  return `${message.createdOn}|${message.chatChannel}|${message.playerUID}|${message.chatContent}`;
}

function sendPlayerState(socket: WebSocket, playerName: string, playerUID: string): void {
  const payload = { playerName, playerUID };
  socket.send(JSON.stringify({ event: 'clientRegister', payload: { type: 'web', userName: playerName } }));
  socket.send(JSON.stringify({ event: 'playerOnline', payload }));
  for (const channel of GLOBAL_INTERCOM_CHANNELS) {
    socket.send(JSON.stringify({ event: 'playerJoinChannel', payload: { ...payload, channel } }));
  }
  socket.send(JSON.stringify({ event: 'serverPresenceSubscribe', payload: { channel: GLOBAL_INTERCOM_CHANNEL } }));
}

function isIntercomChannel(channel: string): channel is GlobalIntercomChannel {
  return GLOBAL_INTERCOM_CHANNELS.includes(channel as GlobalIntercomChannel);
}

function parseServerPresence(data: unknown): GlobalIntercomServerPresenceUpdate | null {
  if (typeof data !== 'string') return null;
  try {
    const envelope = JSON.parse(data) as GlobalIntercomEnvelope;
    return envelope.event === 'serverPresence' && isGlobalIntercomServerPresenceUpdate(envelope.payload)
      ? envelope.payload
      : null;
  } catch {
    return null;
  }
}
