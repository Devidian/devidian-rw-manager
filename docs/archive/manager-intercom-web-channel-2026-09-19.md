# Manager Intercom web channel

## Objective

Add separate Global Intercom tabs for the relay's `global` and `web` channels,
including per-channel and navigation unread badges. Show the backend-provided
last account presence in user management.

## Ownership and affected applications

- `devidian-rw-manager`: channel state, chat UI, navigation badges, user table,
  translations, and frontend tests.
- `rw-manager-backend`: last-presence persistence and public-user contract.
- `rw-plugin-oz-global-intercom`: no change; the existing relay protocol already
  supports arbitrary channel names.

## Dependencies

The frontend consumes the backend's additive optional `lastSeenAt` DTO field.
The relay WebSocket remains the existing `VITE_GLOBAL_INTERCOM_WS_URL` endpoint.

## Risks and rollback

Legacy accounts have no `lastSeenAt` and render an em dash. The optional field is
backward compatible. Revert the frontend image and backend image independently;
the old frontend ignores the additive field.

## Validation

- [x] Add focused frontend coverage for channel routing and unread aggregation.
- [x] Add backend coverage for presence and favorite removal persistence.
- [x] Run frontend lint, tests, and production build.
- [x] Run backend build and tests.
- [x] Publish and deploy the compatible Manager RCs. Frontend runtime acceptance
      completed with 1.7.1-rc.3 and backend 0.7.1-rc.2 on 2026-09-24.
