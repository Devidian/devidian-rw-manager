import { Gamepad2, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminMapTab } from '@/components/AdminMapTab';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useStorageMode } from '@/context/StorageModeContext';
import { parseMapResponse } from '@/hooks/useAdminMapping';
import { useMapLayers } from '@/hooks/useMapLayers';
import type { ServerMapResponse } from '@/types/adminMapping';

const DATA_API_PATH = '/api/data';

export default function EmbeddedMapPage() {
  const { t } = useTranslation();
  const { fixedBackendUrl } = useStorageMode();
  const { hasAuthService, isAdmin, isAuthenticated, loginWithSteam } = useAuth();
  const [map, setMap] = useState<ServerMapResponse>({ available: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fixedBackendUrl) {
      setMap({ available: false });
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    fetch(`${fixedBackendUrl.replace(/\/$/, '')}${DATA_API_PATH}/server/map`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Map request failed');
        return parseMapResponse(await response.json());
      })
      .then((response) => setMap(response))
      .catch((error: unknown) => {
        if ((error as Error).name !== 'AbortError') setMap({ available: false });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [fixedBackendUrl]);

  const metadata = map.available ? map.metadata : undefined;
  const mapLayers = useMapLayers(
    fixedBackendUrl ?? '',
    metadata?.serverId,
    metadata?.worldKey ?? '',
    [],
    [],
    DATA_API_PATH,
    false,
  );

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!fixedBackendUrl || !metadata) {
    return <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center text-muted-foreground">{t('embeddedMapUnavailable')}</div>;
  }

  return (
    <main className="min-h-screen bg-background p-3 sm:p-4">
      <AdminMapTab
        apiBaseUrl={fixedBackendUrl}
        apiPath={DATA_API_PATH}
        serverId={metadata.serverId}
        metadata={metadata}
        mapLayers={mapLayers}
        isAdmin={isAdmin}
        isAuthenticated={isAuthenticated}
        mapControls={!isAuthenticated && hasAuthService ? (
          <Button
            type="button"
            className="pointer-events-auto gap-2 bg-[hsl(215_60%_35%)] text-white shadow-lg hover:bg-[hsl(215_60%_40%)]"
            onClick={() => loginWithSteam('/embedded-map/auth/steam/callback')}
          >
            <Gamepad2 className="h-4 w-4" />
            {t('loginWithSteam')}
          </Button>
        ) : undefined}
      />
    </main>
  );
}
