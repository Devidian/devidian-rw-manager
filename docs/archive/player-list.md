# Player List

## Objective

Add a player-list page directly after the server list. It shows all currently
online players across configured servers, their UID, the linked server, and
that server's current/max capacity. The default order prioritizes players on
the most populated servers.

## Ownership

- Frontend: `devidian-rw-manager`
- Backend: no change; the existing live-status response already supplies
  `onlinePlayers` and server capacity.

## Dependencies

- Existing `ServerContext` live-status state
- Existing server-detail Steam-link and UID masking rules

## Affected repositories/apps

- `devidian-rw-manager` only

## Risks and rollback

- Live player data can be absent while a server is unavailable; render an empty
  state rather than inferring players from the query count.
- UID visibility must remain consistent with current guest/authenticated rules.
- Roll back by removing the route, navigation item, page, and reusable display
  helper; no persisted data or API contract changes are involved.

## Validation strategy

- Focused page tests cover aggregation, capacity sorting, server navigation,
  and guest/authenticated UID presentation.
- Run lint, the complete test suite, and the production build.

## Checklist

- [x] Confirm frontend ownership and existing live-status contract.
- [x] Add reusable server/UID presentation helpers without changing visibility rules.
- [x] Add player-list page, route, navigation item, and translations.
- [x] Add focused tests for data presentation and sorting.
- [x] Run lint, tests, and build.
