import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, LogIn, MessageSquare, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichText } from '@/components/RichText';
import { useAuth } from '@/context/AuthContext';
import { submitGlobalIntercomDraft, useGlobalIntercom } from '@/context/GlobalIntercomContext';
import { GLOBAL_INTERCOM_CHANNEL } from '@/lib/globalIntercom';
import { cn } from '@/lib/utils';

const MAX_MESSAGE_LENGTH = 500;

export default function GlobalIntercomChatPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState('');
  const { canSend: canSendMessage, connectionState, markRead, messages, sendMessage } = useGlobalIntercom();

  useEffect(() => {
    markRead();
  }, [markRead]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages]);

  const canSend = canSendMessage && draft.trim().length > 0;

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

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Global chat visibility</AlertTitle>
        <AlertDescription>
          Global chat messages may be visible on the website, Discord, and connected Rising World servers. Do not post
          private or sensitive information.{' '}
          <Link to="/community-rules" className="text-primary underline underline-offset-4 hover:text-primary/80">
            Community Rules
          </Link>
        </AlertDescription>
      </Alert>

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
                      <RichText text={message.sourceName} />
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm text-foreground">{message.chatContent}</p>
                    {message.attachment && (
                      <img
                        src={`data:image/jpeg;base64,${message.attachment}`}
                        alt=""
                        className="mt-2 max-h-80 rounded border border-border object-contain"
                      />
                    )}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          )}
        </div>

        <form
          onSubmit={(event) => submitGlobalIntercomDraft(event, {
            canSend,
            draft,
            sendMessage,
            clearDraft: () => setDraft(''),
          })}
          className="flex gap-2 border-t border-border p-3"
        >
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

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date);
}
