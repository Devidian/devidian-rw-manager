# Frontend channels, statistics, and player profiles

## Objective and ownership

- `devidian-rw-manager`: channel controls, calendar grouping, stable statistics rendering, and player profile UI.
- `rw-manager-backend`: persisted channel preferences on the authenticated user.
- `rw-girs`: existing join/leave protocol; no relay change expected.

## Constraints and dependencies

- Keep the existing `global` and `web` subscriptions for legacy users and guests.
- Use the existing authenticated user API and server player endpoints.
- Do not change production systems or release versions.

## Checklist

- [x] Persist additional Intercom channels and restore them at sign-in.
- [x] Fix local calendar day, ISO week, and month grouping.
- [x] Avoid replacing statistics state when the rendered data is unchanged.
- [x] Link player names to a profile with active servers and available playtime.
- [x] Add focused regression tests, build, lint, and inspect deployment feasibility.

## Risks, validation, and rollback

Old user records have no channel preference; map them to the two existing defaults. Player playtime may be unavailable when a server does not expose plugin data. Verify frontend and backend tests/builds and the relay frame contract. Rollback consists of reverting the frontend and backend changes; persisted channel arrays are additive and may remain unused safely.

## Validation and deployment

Frontend TypeScript, tests, build, and lint passed. Backend build and tests passed. The relay protocol was verified against `rw-girs` source without changing it. `dev-upload.sh` handles Rising World plugins and is not applicable to these Manager applications. No release or deployment was requested; production remains unchanged.
