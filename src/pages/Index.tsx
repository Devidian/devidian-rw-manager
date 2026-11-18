import { useTranslation } from 'react-i18next';
import { useServerContext } from '@/context/ServerContext';
import { ServerCard } from '@/components/ServerCard';
import { Button } from '@/components/ui/button';
import { Server, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { getServerDisplayName } from '@/lib/serverDisplay';
import { ServerApprovalError } from '@/lib/storage';
import { RichText } from '@/components/RichText';

const approvalErrorKeys: Record<string, string> = {
  VERIFIED_STEAM_REQUIRED: 'serverApprovalLoginRequired',
  MASTER_SERVER_NO_LONGER_LISTED: 'serverApprovalNoLongerListed',
  SERVER_ALREADY_APPROVED: 'serverApprovalAlreadyApproved',
  SERVER_CONTACT_MISMATCH: 'serverApprovalContactMismatch',
  SERVER_INFO_UNAVAILABLE: 'serverApprovalInfoUnavailable',
  SERVER_SUPPRESSED: 'serverApprovalSuppressed',
};

export default function Index() {
  const { t } = useTranslation();
  const {
    refreshAll,
    refreshOne,
    dashboardServerList,
    serverList,
    approveServer,
  } = useServerContext();
  const [approving, setApproving] = useState<string | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const contactServers = serverList.filter(server => server.masterOnly && server.canApprove);

  const approve = async (id: string) => {
    setApproving(id);
    setApprovalError(null);
    try {
      await approveServer(id);
    } catch (error) {
      const key = error instanceof ServerApprovalError && Object.prototype.hasOwnProperty.call(approvalErrorKeys, error.code)
        ? approvalErrorKeys[error.code] : 'serverApprovalFailed';
      setApprovalError(key);
    } finally {
      setApproving(null);
    }
  };

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


      {approvalError && <p role="alert" className="text-sm text-destructive">{t(approvalError)}</p>}
      {contactServers.length > 0 && <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h2 className="font-semibold">{t('contactServers')}</h2>
        <p className="text-sm text-muted-foreground">{t('contactServersDesc')}</p>
        {contactServers.map(server => <div key={server.id} className="flex items-center justify-between gap-3">
          <span className="text-sm"><RichText text={getServerDisplayName(server)} /></span>
          <Button size="sm" variant="outline" disabled={approving !== null}
            onClick={() => void approve(server.id)}>{t('approveServer')}</Button>
        </div>)}
      </div>}

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
            />
          ))}
        </div>
      )}
    </div>
  );
}
