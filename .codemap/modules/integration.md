# Backend and live integrations
<!-- codemap-id: devidian-rw-manager/integration -->

## Responsibility

Client storage, API and live-event integration. Backend owns the corresponding server-side API. Read both implementations when changing a contract.

## Source and tests

- [Storage adapters](../../src/lib/storage.ts), [authentication API](../../src/lib/authApi.ts), and [server live client](../../src/lib/serverLive.ts) provide client entry points.
- [Map live subscription](../../src/hooks/useMapLiveSubscription.ts) and [map live client](../../src/lib/mapLive.ts) consume live map updates.
- [Map live tests](../../src/test/map-live.test.ts) and [admin mapping contract tests](../../src/test/admin-mapping-contract.test.ts) exercise client behavior.

## Dependencies

- `rw-manager-backend/api` — REST data and storage modes. [Storage adapter](../../src/lib/storage.ts)
- `rw-manager-backend/live` — live WebSocket subscription. [Map subscription](../../src/hooks/useMapLiveSubscription.ts)
