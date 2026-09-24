# Marketplace Map Offers Overlay

## Objective

Make Marketplace indicators in map claim popups actionable and open a dedicated
overlay with the selected area's local offers.

## Ownership

- Frontend: `devidian-rw-manager`
- Backend: no API change expected

## Checklist

- [x] Replace inline popup offer rendering with a dedicated overlay.
- [x] Load offers only after the Marketplace indicator is activated.
- [x] Render loading, empty, error, and populated states.
- [x] Cancel stale requests when closing or changing the selected area.
- [x] Add keyboard/close behavior through the existing dialog primitives.
- [x] Add focused component tests.
- [x] Run frontend tests and build.

## Validation

- `npm run test`
- `npm run build`
