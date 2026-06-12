# Repository Policy

## Runtime Policy
- Preserve the repository's Vite, React, TypeScript, Tailwind, and test setup.
- Runtime or package-manager changes must update package files, CI/deployment docs when present, and README.

## Architecture Policy
- Keep backend API implementation out of the frontend.
- Keep reusable UI helpers and components local unless a separate shared package is explicitly introduced.
- Keep route, state, component, and API-client responsibilities separated.

## Dependency Policy
- Add frontend dependencies only when necessary and compatible with the current build stack.
- Avoid introducing alternate package-manager lock files.

## API Verification Policy
- Treat backend API usage as a contract.
- Validate request/response shape changes with the backend repository before relying on them.

## Release Policy
- Preserve Vite build behavior and deployment assumptions.
- Setup or deployment changes require README updates.

## Documentation Policy
- `PLANS.md` stays intentionally minimal and links to `docs/active/`, `docs/roadmaps/`, and `docs/phase-archive.md`.
- Active tasks belong in `docs/active/`.
- Large plans and roadmaps belong in `docs/roadmaps/`.
- Completed work is summarized in `docs/phase-archive.md`.
- Planning documents must include objective, ownership, dependencies, risks, validation strategy, affected repositories/apps, rollback considerations, and checkbox progress.
