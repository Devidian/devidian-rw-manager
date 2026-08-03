import type {
  MapClaim,
  MapGpsMarker,
  MapMarketplaceOffer,
  MapPlayer,
} from '@/types/adminMapping';

export function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

export function positiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

export function integers(value: Record<string, unknown>, keys: string[]): boolean {
  return keys.every((key) => Number.isSafeInteger(value[key]));
}

export function booleans(value: Record<string, unknown>, keys: string[]): boolean {
  return keys.every((key) => typeof value[key] === 'boolean');
}

export function color(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9A-F]{8}$/i.test(value);
}

export function dateString(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

export function isMapClaim(value: unknown): value is MapClaim {
  return record(value) &&
    positiveInteger(value.areaId) &&
    typeof value.name === 'string' &&
    typeof value.permission === 'string' &&
    integers(value, ['minX', 'minZ', 'width', 'depth']) &&
    (value.width as number) > 0 &&
    (value.depth as number) > 0 &&
    (value.ownerName === undefined || typeof value.ownerName === 'string') &&
    (value.createdAt === undefined || dateString(value.createdAt)) &&
    color(value.borderColor) &&
    color(value.fillColor) &&
    typeof value.forSale === 'boolean' &&
    (value.salePrice === undefined || positiveInteger(value.salePrice)) &&
    typeof value.renewZone === 'boolean' &&
    (value.nextRenewalAt === undefined || dateString(value.nextRenewalAt)) &&
    typeof value.marketplace === 'boolean' &&
    typeof value.shop === 'boolean';
}

export function isMapPlayer(value: unknown): value is MapPlayer {
  return record(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.x === 'number' && Number.isFinite(value.x) &&
    typeof value.z === 'number' && Number.isFinite(value.z) &&
    ['online', 'recent-offline', 'long-term-offline'].includes(String(value.state)) &&
    dateString(value.lastSeen);
}

export function isMapGpsMarker(value: unknown): value is MapGpsMarker {
  return record(value) &&
    positiveInteger(value.id) &&
    typeof value.name === 'string' &&
    typeof value.x === 'number' && Number.isFinite(value.x) &&
    typeof value.y === 'number' && Number.isFinite(value.y) &&
    typeof value.z === 'number' && Number.isFinite(value.z) &&
    typeof value.icon === 'string' &&
    color(value.color) &&
    dateString(value.createdAt);
}

export function isMapMarketplaceOffer(value: unknown): value is MapMarketplaceOffer {
  return record(value) &&
    positiveInteger(value.id) &&
    typeof value.itemName === 'string' &&
    Number.isInteger(value.itemVariant) &&
    positiveInteger(value.amount) &&
    positiveInteger(value.price) &&
    typeof value.currency === 'string' &&
    typeof value.sellerName === 'string' &&
    dateString(value.createdAt);
}
