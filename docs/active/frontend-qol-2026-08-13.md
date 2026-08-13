# Frontend QOL – 13.08.2026

## Objective

Improve the server list and statistics workflows, then publish a frontend-only RC Docker image.

## Ownership and affected applications

- `devidian-rw-manager`: server-list presentation, statistics ranges and player pagination.
- No backend API change: the current server-status and statistics contracts already carry the required state and data.

## Constraints and dependencies

- Offline servers remain available to super admins through an explicit local UI switch; non-admin users do not receive an admin control.
- Use the existing Lucide, shadcn and i18n patterns; do not add dependencies.
- Keep the existing REST API contract unchanged.

## Risks and rollback

- ISO calendar weeks must be converted to their Monday/Sunday boundaries consistently in browser-local time.
- The per-page preference must tolerate invalid local-storage values. Rollback is the preceding frontend Docker RC/stable image.

## Validation strategy

- Add regression coverage for status presentation/filtering, complete month/ISO-week ranges, global weekday maxima, and pagination persistence.
- Run lint, tests, production build, Docker build, then dispatch and verify the RC Docker workflow.

## Checklist

- [x] Establish repository ownership and refresh upstream state.
- [x] Implement server list QOL.
- [x] Implement statistics range and pagination QOL.
- [x] Add regression tests and validate the frontend.
- [x] Align the Docker build Node baseline and validate the local RC image.
- [ ] Commit, push and publish the frontend RC Docker image.
