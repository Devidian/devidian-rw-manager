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
- [ ] Accept the flow with real Development data and both match strengths.

## Validation and rollback

Run TypeScript, lint, tests, and the production build. The frontend can be
rolled back independently; database merges require the backend backup described
by its API deployment procedure.
