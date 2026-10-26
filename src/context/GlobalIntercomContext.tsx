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
  normalizeIntercomChannel,
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
  channels: GlobalIntercomChannel[];
  channelError: string | null;
  servers: GlobalIntercomServerPresence[];
  unreadCount: number;
  unreadCounts: Record<GlobalIntercomChannel, number>;
  sendMessage: (content: string) => void;
  selectChannel: (channel: GlobalIntercomChannel) => void;
  joinChannel: (channel: string) => Promise<void>;
  leaveChannel: (channel: string) => Promise<void>;
  markRead: () => void;
}

const MAX_STORED_MESSAGES = 100;
const RECONNECT_DELAY_MS = 3000;
const GlobalIntercomContext = createContext<GlobalIntercomContextValue | null>(null);

export function GlobalIntercomProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user, isAuthenticated, updateIntercomChannels } = useAuth();
  const location = useLocation();
  const socketRef = useRef<WebSocket | null>(null);
  const socketIdentityRef = useRef('');
  const reconnectTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const guestIdRef = useRef(`web-${Math.random().toString(36).slice(2)}`);
  const pendingEchoKeysRef = useRef(new Set<string>());
  const [connectionState, setConnectionState] = useState<GlobalIntercomConnectionState>('connecting');
  const [messagesByChannel, setMessagesByChannel] = useState<Record<GlobalIntercomChannel, GlobalIntercomChatEntry[]>>({ global: [], web: [] });
  const [activeChannel, setActiveChannel] = useState<GlobalIntercomChannel>(GLOBAL_INTERCOM_CHANNEL);
  const [servers, setServers] = useState<GlobalIntercomServerPresence[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<GlobalIntercomChannel, number>>({ global: 0, web: 0 });
  const [channelError, setChannelError] = useState<string | null>(null);
  const channels = useMemo(() => [...new Set([...GLOBAL_INTERCOM_CHANNELS, ...(user?.intercomChannels ?? []).filter((channel) => normalizeIntercomChannel(channel) === channel)])], [user?.intercomChannels]);
  const channelsRef = useRef(channels);
  const wsUrl = useMemo(() => getGlobalIntercomWebSocketUrl(), []);
  const displayName = user?.username || user?.email || user?.steamId || t('globalIntercomWebUser');
  const playerUID = user?.steamId || user?.id || guestIdRef.current;
  const identity = `${playerUID}\u0000${displayName}`;
  const isChatOpenRef = useRef(location.pathname === '/global-intercom');
  const activeChannelRef = useRef(activeChannel);
  const messages = messagesByChannel[activeChannel] ?? [];
  const unreadCount = channels.reduce((sum, channel) => sum + (unreadCounts[channel] ?? 0), 0);

  useEffect(() => {
    const previous = channelsRef.current;
    channelsRef.current = channels;
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN && socketIdentityRef.current === identity) {
      const payload = { playerName: displayName, playerUID };
      for (const channel of channels.filter((item) => !previous.includes(item))) {
        socket.send(JSON.stringify({ event: 'playerJoinChannel', payload: { ...payload, channel } }));
      }
      for (const channel of previous.filter((item) => !channels.includes(item))) {
        socket.send(JSON.stringify({ event: 'playerLeaveChannel', payload: { ...payload, channel } }));
      }
    }
    if (!channels.includes(activeChannelRef.current)) setActiveChannel(GLOBAL_INTERCOM_CHANNEL);
  }, [channels, displayName, identity, playerUID]);

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
        socketIdentityRef.current = identity;
        sendPlayerState(socket, displayName, playerUID, channelsRef.current);
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
        const response = parseChannelError(event.data);
        if (response) {
          setChannelError(response);
          return;
        }
        const entry = parseChatEntry(event.data, 'incoming');
        if (!entry || !channelsRef.current.includes(entry.chatChannel)) return;
        const echoKey = messageEchoKey(entry);
        if (entry.playerUID === playerUID && pendingEchoKeysRef.current.delete(echoKey)) return;
        setMessagesByChannel(current => ({
          ...current,
          [entry.chatChannel]: appendStoredMessage(current[entry.chatChannel] ?? [], entry),
        }));
        if (!isChatOpenRef.current || activeChannelRef.current !== entry.chatChannel) {
          setUnreadCounts(current => ({ ...current, [entry.chatChannel]: (current[entry.chatChannel] ?? 0) + 1 }));
        }
      });
    };

    connect();

    return () => {
      active = false;
      clearReconnectTimeout();
      const socket = socketRef.current;
      socketRef.current = null;
      socketIdentityRef.current = '';
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          event: 'playerOffline',
          payload: { playerName: displayName, playerUID },
        }));
      }
      socket?.close();
    };
  }, [displayName, identity, playerUID, wsUrl]);

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
      [activeChannel]: appendStoredMessage(current[activeChannel] ?? [], toChatEntry(message, 'outgoing')),
    }));
  }, [activeChannel, connectionState, displayName, isAuthenticated, playerUID]);

  const markRead = useCallback(() => setUnreadCounts(current => ({ ...current, [activeChannelRef.current]: 0 })), []);
  const selectChannel = useCallback((channel: GlobalIntercomChannel) => {
    setActiveChannel(channel);
    setUnreadCounts(current => ({ ...current, [channel]: 0 }));
  }, []);

  const joinChannel = useCallback(async (value: string) => {
    const channel = normalizeIntercomChannel(value);
    if (!channel) throw new Error('INVALID_CHANNEL');
    if (!isAuthenticated) throw new Error('UNAUTHORIZED');
    setChannelError(null);
    if (!channels.includes(channel)) await updateIntercomChannels([...channels, channel]);
    setActiveChannel(channel);
  }, [channels, isAuthenticated, updateIntercomChannels]);

  const leaveChannel = useCallback(async (channel: string) => {
    if (GLOBAL_INTERCOM_CHANNELS.includes(channel as typeof GLOBAL_INTERCOM_CHANNELS[number])) return;
    await updateIntercomChannels(channels.filter((item) => item !== channel));
  }, [channels, updateIntercomChannels]);

  const value: GlobalIntercomContextValue = {
    canSend: isAuthenticated && connectionState === 'connected',
    connectionState,
    messages,
    activeChannel,
    channels,
    channelError,
    servers,
    unreadCount,
    unreadCounts,
    sendMessage,
    selectChannel,
    joinChannel,
    leaveChannel,
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

function sendPlayerState(socket: WebSocket, playerName: string, playerUID: string, channels: string[]): void {
  const payload = { playerName, playerUID };
  socket.send(JSON.stringify({ event: 'clientRegister', payload: { type: 'web', userName: playerName } }));
  socket.send(JSON.stringify({ event: 'playerOnline', payload }));
  for (const channel of channels) {
    socket.send(JSON.stringify({ event: 'playerJoinChannel', payload: { ...payload, channel } }));
  }
  socket.send(JSON.stringify({ event: 'serverPresenceSubscribe', payload: { channel: GLOBAL_INTERCOM_CHANNEL } }));
}

function parseChannelError(data: unknown): string | null {
  if (typeof data !== 'string') return null;
  try {
    const envelope = JSON.parse(data) as GlobalIntercomEnvelope & { errorCode?: string; subject?: string };
    return envelope.event === 'playerResponseError' && envelope.errorCode
      ? `${envelope.subject ?? ''}: ${envelope.errorCode}`
      : null;
  } catch {
    return null;
  }
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
