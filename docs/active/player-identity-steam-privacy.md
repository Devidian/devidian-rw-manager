# Player ObjectId navigation

## Objective and ownership

The Manager frontend joins player rows by backend mapping ObjectId and opens `/player/:id`. The backend owns mapping, privacy, authorization, and migration.

## Constraints and checklist

- [x] Use mapping IDs for live list deduplication, database row joins, global statistics keys, and player profile links.
- [x] Keep UID only as a display value when the backend permits it. The browser never decides private status.
- [x] Show direct local game queries as anonymous live rows because they have no backend mapping or Steam verification.
- [x] Build, typecheck, lint, and run local tests.
- [x] Deploy the matching backend/frontend RC to the explicitly authorized public V80 after backup and reference validation; verify guest HTTP responses and container health.
- [ ] Obtain signed-in player/admin and manual map/live UI acceptance.

## Risks, validation, rollback

Deploy the frontend after the additive backend because older backend payloads lack mapping IDs. Confirm two private players remain distinct in list, map and statistics; confirm profile history uses a 24 character ID. Rollback to the previous frontend is possible while the backend retains internal UID data, but old UID profile paths are intentionally rejected by the new backend.

The V80 RC uses the locally built frontend image `devidian/rw-manager-frontend:1.9.2-identity-rc.local` (`sha256:805cae6560e5bf7b4b011203aaccd01f7895c90ed6e1851c6dfb50631b229763`). The matching backend image and migration audit are recorded in the backend active plan. Browser automation was unavailable because the Playwright CLI was not cached in the restricted local environment; the guest REST checks passed, while authenticated and visual acceptance remain open.
