import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MarketplaceOffersTable } from '@/components/AdminMapTab';
import { fetchGlobalMarketplaceOffers } from '@/hooks/useMapLayers';
import type { MapMarketplaceOffer } from '@/types/adminMapping';

export function GlobalMarketplaceTab({
  apiBaseUrl,
  serverId,
}: {
  apiBaseUrl: string;
  serverId: string;
}) {
  const { t } = useTranslation();
  const [offers, setOffers] = useState<MapMarketplaceOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    void fetchGlobalMarketplaceOffers(apiBaseUrl, serverId, controller.signal)
      .then(setOffers)
      .catch((requestError) => {
        if (!(requestError instanceof Error) || requestError.name !== 'AbortError') {
          setOffers([]);
          setError(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [apiBaseUrl, serverId]);

  if (loading) return <MarketplaceMessage>{t('mapOffersLoading')}</MarketplaceMessage>;
  if (error) return <MarketplaceMessage destructive>{t('mapOffersError')}</MarketplaceMessage>;
  if (!offers.length) return <MarketplaceMessage>{t('mapNoOffers')}</MarketplaceMessage>;
  return <MarketplaceOffersTable offers={offers} />;
}

function MarketplaceMessage({ children, destructive = false }: { children: string; destructive?: boolean }) {
  return <div className={destructive
    ? 'rounded-md border border-destructive/40 bg-destructive/10 px-3 py-8 text-center text-sm text-destructive'
    : 'rounded-md border border-border px-3 py-8 text-center text-sm text-muted-foreground'}>{children}</div>;
}
