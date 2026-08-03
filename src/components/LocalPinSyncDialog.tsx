import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useStorageMode } from '@/context/StorageModeContext';
import { clearLocalPinnedServers } from '@/lib/storage';
import { useBackendInfo } from '@/context/BackendInfoContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function LocalPinSyncDialog() {
  const { t } = useTranslation();
  const { user, applyUserUpdate } = useAuth();
  const { adapter } = useStorageMode();
  const { maxPinnedServers } = useBackendInfo();
  const [localPins, setLocalPins] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setOpen(false);
      setLocalPins([]);
      return;
    }

    adapter.getPinnedServers()
      .then(ids => {
        if (cancelled) return;
        const uniqueIds = [...new Set(ids)];
        setLocalPins(uniqueIds);
        setOpen(uniqueIds.length > 0);
      })
      .catch(() => {
        if (!cancelled) {
          setLocalPins([]);
          setOpen(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [adapter, user]);

  const dismiss = () => {
    clearLocalPinnedServers();
    setLocalPins([]);
    setOpen(false);
  };

  const syncPins = async () => {
    let nextUser = user;
    const alreadyPinned = new Set(user?.pinnedServers ?? []);
    const remaining = Math.max(0, maxPinnedServers - alreadyPinned.size);
    const pinsToSync = localPins.filter((serverId) => !alreadyPinned.has(serverId)).slice(0, remaining);
    for (const serverId of pinsToSync) {
      const updatedUser = await adapter.pinServer(serverId);
      if (updatedUser) nextUser = updatedUser;
    }
    if (nextUser) applyUserUpdate(nextUser);
    dismiss();
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('syncLocalPinsTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('syncLocalPinsDesc', { count: localPins.length })}
            {localPins.filter((id) => !(user?.pinnedServers ?? []).includes(id)).length >
              Math.max(0, maxPinnedServers - (user?.pinnedServers?.length ?? 0)) && (
              <span className="mt-2 block text-destructive">
                {t('syncLocalPinsLimitDesc', { max: maxPinnedServers })}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={dismiss}>{t('syncLocalPinsSkip')}</AlertDialogCancel>
          <AlertDialogAction onClick={() => void syncPins()}>{t('syncLocalPinsConfirm')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
