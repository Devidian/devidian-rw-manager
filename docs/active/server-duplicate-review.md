# Server duplicate review

## Objective and ownership

Show the backend's duplicate suggestions to the Steam super-admin and submit
only explicitly selected source IDs after a preview. This repository owns the
React review page; the Manager backend owns matching and persistence.

## Dependencies and risks

- Requires the backend duplicate, preview, merge, and ID-resolution endpoints.
- The browser must not decide whether a merge is valid; backend revalidation
  protects against stale suggestions.
- Former server URLs resolve through the backend and navigate to the canonical
  ID. A backend without that API cannot resolve old links.

## Checklist

- [x] Add sidebar navigation, expandable candidate table, checkboxes, and
  confirmation with affected favorites and statistic-hour count.
- [x] Refresh server list and signed-in user after a merge.
- [x] Resolve anonymous browser favorites that still reference former IDs.
- [x] Add German and English labels and old-link navigation.
- [x] Pass TypeScript, lint, 107 tests, build and GitHub CI; publish
  `v1.9.0-rc.1` and deploy it after the backend RC.
- [ ] Accept real candidate groups and the confirmation flow in an admin
  browser session on the public RC instance.
- [x] Color online/offline status and compact the subtable by combining
  game mode with OS and first/last seen timestamps.
- [x] Add per-group select all and render server name formatting tags while
  constraining their visible table width.

## Validation and rollback

Run TypeScript, lint, tests, and the production build. The frontend can be
rolled back independently; database merges require the backend backup described
by its API deployment procedure.

## RC deployment evidence (2026-11-10)

- Commit `8fc6341ccc2505e0dcac3313e6d14256ea4e2635`; CI run `42784989396`
  and Docker Publish run `42785598551` succeeded.
- Public Manager frontend image `devidian/rw-manager-frontend:1.9.0-rc.1`
  resolved to `sha256:d3f83ac8a9ccc3effcf16ef9570c002f774f6b6d9bb48e6e5b6f0b981f414198`.
- `rw-manager-frontend-prod` on `strato.V80` is healthy with zero restarts.
  The public `/admin/server-duplicates` route returned 200 and the delivered
  bundle contains the duplicate-review labels. The unauthenticated API
  returned 401, as expected.
