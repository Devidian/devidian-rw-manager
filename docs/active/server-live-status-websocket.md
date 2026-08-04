# Server Live Status WebSocket

## Objective

Use one mutable backend WebSocket subscription for the current dashboard server
set and stop periodic per-server `/live` polling while it is confirmed.

## Ownership and dependencies

- This repository owns subscription lifecycle, payload validation, status-map
  delta application, reconnect behavior, REST fallback, and favorite-limit UI.
- `rw-manager-backend` owns the protocol and publishes `maxPinnedServers` through
  backend discovery. No new frontend dependency is introduced.

## Risks and rollback

- Tokens stay in the first WebSocket frame and never enter the URL.
- Fatal protocol/auth closes stop reconnect loops; transient failures back off.
- Manual refresh and direct/local operation retain REST behavior, so an older
  backend or failed socket falls back without a data migration.

## Validation

- Contract parsing, mutable subscriptions, reconnect/fallback, delta application,
  pin-limit UI, local sync, full tests, TypeScript, lint, and production build.

## Checklist

- [x] Add one multi-server subscription and strict payload parsing.
- [x] Apply snapshots and field deltas without full list reloads.
- [x] Poll REST only when WebSocket support is unavailable.
- [x] Enforce and explain the backend-configured favorite limit.
- [x] Pass tests, type checking, lint, and build.
- [ ] Publish RC and perform runtime browser acceptance.
