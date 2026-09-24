# Server Access and Capability Presentation

## Objective

Present backend-provided server capabilities and native-route access state without inferring security state in the browser or exposing any game-server credential.

## Ownership

This app owns presentation, localized labels/tooltips and visibility rules. Backend remains authoritative for `pluginlist` availability, compatible OZ Tools, `noAccess`, websocket connection/features, map availability and the authenticated administrator list.

## Dependencies

This app consumes the stable Manager-backend DTO after the native security and WebSocket contract is implemented.

## Checklist

- [x] Extend frontend DTOs and API mocks after the backend contract was versioned; gracefully render servers from older backend versions.
- [x] Show the Configuration tab only when the current authenticated user's linked SteamID is in that server's backend-provided administrator UID list. Hide it for guests, unlinked accounts, missing admin data and access failure.
- [x] Show the Plugins tab only when the backend reports native `/pluginlist` availability; do not infer it from a non-empty plugin list.
- [x] Add an Omega badge when native plugin list is exposed and it contains OZ Tools.
- [x] Add distinct localized `No access` presentation when the backend reports the secure pairing failure state.
- [x] Render Linux with a recognizable penguin icon and Windows with the Windows logo as local SVGs, avoiding an additional icon dependency.
- [ ] Render two green online indicators only for a fresh active game-server WebSocket connection, otherwise one.
- [x] Render the Map-column value bold when the existing backend `mapUrl` marks an online map.
- [ ] Add responsive/accessible labels, tooltips and tests for all visibility combinations, stale state and unauthenticated users.

## Risks, Rollback and Validation

Do not use client-side SteamID comparisons against untrusted plugin payloads; use the authenticated account and backend-normalized list. Badge absence must mean unknown/unsupported, not secure failure. Preserve the former rendering for older response shapes. Run the configured lint, tests and production build, then validate guest, authenticated admin/non-admin, pluginless, Tools-enabled, no-access, socket-active and map-active servers against Development data.

## Affected Repositories/Apps

- `devidian-rw-manager`
- `rw-manager-backend`

## Rollback Considerations

Keep rendering compatible with the prior backend shape and hide new badges/tabs when capability fields are absent. No client-side secret or persistence migration exists to roll back.

## Validation Strategy

Run the configured lint, tests and production build, followed by the Development combinations named above.

## Current evidence (2026-09-24)

The additive nativeAccess contract is parsed with legacy-response fallback, and
noAccess renders a localized Plugins-tab error. The current frontend suite
passed 98 tests and the production build before deployment of 1.7.1-rc.3.
Remaining checklist items are separate capability-indicator and accessibility
work; they are intentionally still active.
