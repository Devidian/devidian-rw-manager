import { useTranslation } from 'react-i18next';
import { useServerContext } from '@/context/ServerContext';
import { ServerCard } from '@/components/ServerCard';
import { Button } from '@/components/ui/button';
import { Server, RefreshCw } from 'lucide-react';
import { PinnedServerLimitAlert } from '@/components/PinnedServerLimitAlert';

export default function Index() {
  const { t } = useTranslation();
  const {
    refreshAll,
    refreshOne,
    dashboardServerList,
    pinServer,
    unpinServer,
    isPinned,
    canPinServer,
    pinLimitReached,
    maxPinnedServers,
  } = useServerContext();

  const onlineCount = dashboardServerList.filter(s => s.status === 'online').length;
  const plural = dashboardServerList.length !== 1 ? (t('server') === 'Server' ? 'n' : 's') : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('dashboard')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {dashboardServerList.length === 0
              ? t('addFirstPrompt')
              : t('serversOnline', { online: onlineCount, total: dashboardServerList.length, plural })}
          </p>
        </div>
        <div className="flex gap-2">
          {dashboardServerList.length > 0 && (
            <Button size="sm" variant="outline" className="gap-2" onClick={refreshAll}>
              <RefreshCw className="h-4 w-4" />
              {t('refreshAll')}
            </Button>
          )}
        </div>
      </div>

      {pinLimitReached && <PinnedServerLimitAlert max={maxPinnedServers} />}

      {dashboardServerList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/30 border border-border mb-6">
            <Server className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">{t('noServersYet')}</h2>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">{t('noServersDesc')}</p>
        </div>
      )}

      {dashboardServerList.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dashboardServerList.map(server => (
            <ServerCard
              key={server.id}
              server={server}
              onRefresh={() => refreshOne(server.id)}
              isPinned={isPinned(server.id)}
              onTogglePin={() => void (isPinned(server.id) ? unpinServer(server.id) : pinServer(server.id))}
              pinDisabled={!canPinServer(server.id)}
              pinDisabledReason={t('pinnedServerLimitAction', { max: maxPinnedServers })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
