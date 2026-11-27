import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { applyEntityDelta, fetchMarketplaceOffers } from '@/hooks/useMapLayers';
import type { MapMarketplaceAreaDelta } from '@/lib/mapLive';
import type { MapClaim, MapMarketplaceOffer } from '@/types/adminMapping';

export function MarketplaceOffersDialog({
  apiBaseUrl,
  apiPath,
  serverId,
  claim,
  liveDelta,
  portalContainer,
  onOpenChange,
}: {
  apiBaseUrl: string;
  apiPath: string;
  serverId?: string;
  claim: MapClaim | null;
  liveDelta: { sequence: number; areas: MapMarketplaceAreaDelta[] } | null;
  portalContainer?: HTMLElement | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const [offers, setOffers] = useState<MapMarketplaceOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!claim) {
      setOffers([]);
      setLoading(false);
      setError(false);
      return;
    }
    const controller = new AbortController();
    setOffers([]);
    setLoading(true);
    setError(false);
    (apiPath === '/api/storage'
      ? fetchMarketplaceOffers(apiBaseUrl, serverId, claim.areaId, controller.signal)
      : fetchMarketplaceOffers(apiBaseUrl, serverId, claim.areaId, controller.signal, apiPath))
      .then((items) => setOffers(items))
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
  }, [apiBaseUrl, apiPath, claim, serverId]);

  useEffect(() => {
    if (!claim || !liveDelta) return;
    const delta = liveDelta.areas.find((area) => area.areaId === claim.areaId);
    if (delta) setOffers((items) => applyEntityDelta(items, delta, (item) => item.id));
  }, [claim, liveDelta]);

  return (
    <Dialog open={!!claim} onOpenChange={onOpenChange}>
      <DialogContent
        portalContainer={portalContainer}
        className="max-h-[85vh] overflow-x-auto overflow-y-auto sm:max-w-5xl"
      >
        <DialogHeader>
          <DialogTitle>{t('mapOffersTitle')}</DialogTitle>
          <DialogDescription>
            {claim ? `${claim.name} · ${t('mapMarketplace')}` : t('mapMarketplace')}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="rounded-md border border-border px-3 py-8 text-center text-sm text-muted-foreground">
            {t('mapOffersLoading')}
          </div>
        ) : error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-8 text-center text-sm text-destructive">
            {t('mapOffersError')}
          </div>
        ) : offers.length === 0 ? (
          <div className="rounded-md border border-border px-3 py-8 text-center text-sm text-muted-foreground">
            {t('mapNoOffers')}
          </div>
        ) : (
          <MarketplaceOffersTable offers={offers} />
        )}
      </DialogContent>
    </Dialog>
  );
}

export function MarketplaceOffersTable({ offers }: { offers: MapMarketplaceOffer[] }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="hidden rounded-md border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('mapOfferItem')}</TableHead>
              <TableHead className="text-right">{t('mapOfferAmount')}</TableHead>
              <TableHead className="text-right">{t('mapOfferPrice')}</TableHead>
              <TableHead>{t('mapOfferSeller')}</TableHead>
              <TableHead>{t('mapOfferCreated')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((offer) => (
              <TableRow key={offer.id}>
                <TableCell className="max-w-[28rem] whitespace-normal break-words font-medium">{formatOfferName(offer)}</TableCell>
                <TableCell className="text-right">{offer.amount}</TableCell>
                <TableCell className="text-right">{offer.price} {offer.currency}</TableCell>
                <TableCell>{offer.sellerName}</TableCell>
                <TableCell>{new Date(offer.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="space-y-2 md:hidden">
        {offers.map((offer) => (
          <div key={offer.id} className="rounded-md border border-border p-3 text-sm">
            <div className="font-medium">{formatOfferName(offer)}</div>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-muted-foreground">
              <span>{t('mapOfferAmount')}</span>
              <span className="text-right text-foreground">{offer.amount}</span>
              <span>{t('mapOfferPrice')}</span>
              <span className="text-right text-foreground">{offer.price} {offer.currency}</span>
              <span>{t('mapOfferSeller')}</span>
              <span className="text-right text-foreground">{offer.sellerName}</span>
              <span>{t('mapOfferCreated')}</span>
              <span className="text-right text-foreground">{new Date(offer.createdAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function formatOfferName(offer: MapMarketplaceOffer): string {
  return offer.itemVariant > 0 ? `${offer.itemName} #${offer.itemVariant}` : offer.itemName;
}
