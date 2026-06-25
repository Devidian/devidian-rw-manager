import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LogIn, MessageSquare, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import {
  createGlobalIntercomMessage,
  getGlobalIntercomWebSocketUrl,
  GlobalIntercomEnvelope,
  GlobalIntercomChatMessage,
  GLOBAL_INTERCOM_CHANNEL,
  isGlobalIntercomChatMessage,
} from '@/lib/globalIntercom';
import { cn } from '@/lib/utils';

type ConnectionState = 'unconfigured' | 'connecting' | 'connected' | 'disconnected' | 'error';

interface ChatEntry extends GlobalIntercomChatMessage {
  id: string;
  direction: 'incoming' | 'outgoing';
}

const MAX_MESSAGE_LENGTH = 500;

export default function GlobalIntercomChatPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const guestIdRef = useRef(`web-${Math.random().toString(36).slice(2)}`);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [draft, setDraft] = useState('');
  const wsUrl = useMemo(() => getGlobalIntercomWebSocketUrl(), []);
  const displayName = user?.username || user?.email || user?.steamId || t('globalIntercomWebUser');
  const playerUID = user?.steamId || user?.id || guestIdRef.current;

  useEffect(() => {
    if (!wsUrl) {
      setConnectionState('unconfigured');
      return;
    }

    setConnectionState('connecting');
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      setConnectionState('connected');
      sendPlayerState(socket, displayName, playerUID);
    });
    socket.addEventListener('close', () => setConnectionState('disconnected'));
    socket.addEventListener('error', () => setConnectionState('error'));
    socket.addEventListener('message', (event) => {
      const entry = parseChatEntry(event.data, 'incoming');
      if (!entry || entry.chatChannel !== GLOBAL_INTERCOM_CHANNEL) return;
      setMessages(current => [...current, entry]);
    });

    return () => {
      socketRef.current = null;
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          event: 'playerOffline',
          payload: { playerName: displayName, playerUID },
        }));
      }
      socket.close();
    };
  }, [displayName, playerUID, wsUrl]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages]);

  const canSend = isAuthenticated && connectionState === 'connected' && draft.trim().length > 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!canSend || !socketRef.current || !content) return;

    const message = createGlobalIntercomMessage({
      content,
      playerName: displayName,
      playerUID,
    });
    const envelope: GlobalIntercomEnvelope<GlobalIntercomChatMessage> = {
      event: 'broadcastMessage',
      payload: message,
    };

    socketRef.current.send(JSON.stringify(envelope));
    setMessages(current => [...current, toChatEntry(message, 'outgoing')]);
    setDraft('');
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-5xl flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('globalIntercomChat')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('globalIntercomDesc')}</p>
        </div>
        <Badge variant="outline" className={cn('gap-1.5', connectionState === 'connected' && 'border-primary/40 text-primary')}>
          <span className={cn(
            'h-1.5 w-1.5 rounded-full',
            connectionState === 'connected' ? 'status-dot-online' : 'status-dot-unknown',
          )} />
          {t(`globalIntercomStatus.${connectionState}`)}
        </Badge>
      </div>

      {connectionState === 'unconfigured' && (
        <Alert>
          <MessageSquare className="h-4 w-4" />
          <AlertTitle>{t('globalIntercomUnconfiguredTitle')}</AlertTitle>
          <AlertDescription>{t('globalIntercomUnconfiguredDesc')}</AlertDescription>
        </Alert>
      )}

      {!isAuthenticated && (
        <Alert>
          <LogIn className="h-4 w-4" />
          <AlertTitle>{t('globalIntercomReadOnlyTitle')}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>{t('globalIntercomReadOnlyDesc')}</span>
            <Button asChild size="sm" variant="outline" className="h-8">
              <Link to="/auth/login">{t('loginSubmit')}</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border bg-card">
        <div className="border-b border-border px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground">
          #{GLOBAL_INTERCOM_CHANNEL}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
              {t('globalIntercomEmpty')}
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map(message => (
                <div key={message.id} className={cn('flex', message.direction === 'outgoing' && 'justify-end')}>
                  <div className={cn(
                    'max-w-[min(42rem,85%)] rounded-md border px-3 py-2',
                    message.direction === 'outgoing'
                      ? 'border-primary/30 bg-primary/10'
                      : 'border-border bg-background/60',
                  )}>
                    <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{message.playerName}</span>
                      <span>{formatTime(message.createdOn)}</span>
                      <span>{message.sourceName}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm text-foreground">{message.chatContent}</p>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          )}
        </div>

        <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            disabled={!isAuthenticated || connectionState !== 'connected'}
            placeholder={isAuthenticated ? t('globalIntercomMessagePlaceholder') : t('globalIntercomLoginPlaceholder')}
            aria-label={t('globalIntercomMessage')}
          />
          <Button type="submit" disabled={!canSend} className="gap-2">
            <Send className="h-4 w-4" />
            {t('send')}
          </Button>
        </form>
      </div>
    </div>
  );
}

function parseChatEntry(data: unknown, direction: ChatEntry['direction']): ChatEntry | null {
  if (typeof data !== 'string') return null;
  try {
    const envelope = JSON.parse(data) as GlobalIntercomEnvelope;
    if (envelope.event !== 'broadcastMessage' || !isGlobalIntercomChatMessage(envelope.payload)) return null;
    return toChatEntry(envelope.payload, direction);
  } catch {
    return null;
  }
}

function toChatEntry(message: GlobalIntercomChatMessage, direction: ChatEntry['direction']): ChatEntry {
  return {
    ...message,
    id: `${direction}-${message.createdOn}-${message.playerUID}-${Math.random().toString(36).slice(2)}`,
    direction,
  };
}

function sendPlayerState(socket: WebSocket, playerName: string, playerUID: string): void {
  const payload = { playerName, playerUID };
  socket.send(JSON.stringify({ event: 'playerOnline', payload }));
  socket.send(JSON.stringify({ event: 'playerJoinChannel', payload: { ...payload, channel: GLOBAL_INTERCOM_CHANNEL } }));
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date);
}
