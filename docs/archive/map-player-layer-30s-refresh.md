# Map Player Layer 30-Second Refresh

## Objective

Refresh the map player layer and its server-specific plugin-data cache every
30 seconds, while leaving the cache behavior of claims and other plugin data
unchanged.

## Ownership

- Frontend polling: `devidian-rw-manager`
- Cache freshness: `rw-manager-backend`

## Risks and rollback

- Adds one player-list snapshot request per viewed map and 30 seconds.
- Player.db remains a persisted, rather than live, position source.
- Roll back by restoring the previous 60-second poll and generic cache age.

## Validation

- Unit coverage for the route-specific cache age.
- Frontend tests, backend tests, builds, and runtime observation after deploy.

## Checklist

- [x] Set frontend polling to 30 seconds.
- [x] Apply a player-layer-specific backend cache maximum age.
- [x] Validate both repositories.
