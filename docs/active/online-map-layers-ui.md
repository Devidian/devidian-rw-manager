# Online Map Layers Frontend

## Objective

Render switchable sector, claim, Marketplace, Shop, and player overlays above
the existing terrain map and eliminate stale centering when switching servers
or worlds.

## Ownership

Owning application: `devidian-rw-manager`

The frontend owns:

- API parsing and request lifecycle
- map-instance reset on server/world changes
- Leaflet layer controls and vector/marker rendering
- localized details and unavailable/error states
- on-demand local Marketplace offer presentation

The backend owns source discovery, joins, authorization, and data filtering.

## Dependencies

- existing `AdminMapTab`, `useAdminMapping`, schema-5 map metadata, and
  `leafletYToBackendZ`
- finalized backend layer DTOs and coordinate contract
- existing authenticated user/role context for admin-only controls
- existing React, Leaflet, shadcn-ui, Tailwind, and i18n conventions

## Coordinate Contract

Create one tested conversion module for all overlays:

- Rising World block X/Z to Leaflet coordinates at native map scale
- half-open area block rectangles to Leaflet bounds
- player block positions to marker positions
- 1024-block sector coordinates to block-space bounds and upper-left labels
- signed world Z inversion consistent with terrain tile requests

The verified source contract is documented in
`docs/active/online-map-layers-savegame-analysis.md`. Player coordinates remain
fractional. Negative sector coordinates use floor division.

Do not duplicate conversion arithmetic in React components. Validate known
positive/negative landmarks against terrain tiles before enabling plugin
layers.

## Implementation Packages

### Package 1: Map Lifecycle And Layer Shell

- [x] Key/remount the Leaflet map by backend URL,
  `worldKey`, and geometry version so server switching cannot retain the
  previous center or internal tile state.
- [x] Fit initial generated bounds once per selected map without setting
  `maxBounds` or re-fitting after user movement.
- [x] Clear selected area, loaded layer data, and errors when the
  selected server/world changes.
- [x] Add a compact accessible layer control consistent with the application
  design system.
- [ ] Persist non-sensitive layer visibility per browser/server/world only if
  it does not reintroduce stale state.
- [x] Keep the terrain layer always present.

### Package 2: Sector Layer

- [x] Generate visible sector rectangles client-side from backend-provided
  sector geometry and current map bounds.
- [x] Draw semi-transparent silver borders at an effective 1-2 px width.
- [x] Render `x|z` on each sector.
- [x] Update generated sectors on pan/zoom without creating an unbounded
  full-world grid.
- [ ] Keep labels readable and suppress them below a tested zoom threshold if
  overlap becomes excessive.

### Package 3: Claim Layer

- [x] Extend API types/parsers/hooks for capability and claim responses.
- [x] Render claim rectangles with backend-normalized Land Claim colors.
- [x] Add creation time to the existing area name, owner, dimensions, and sale
  price popup.
- [x] Distinguish sale, Marketplace, and Shop status without obscuring area
  geometry.
- [x] Disable the claim control when capability is unavailable.
- [x] Fetch claims independently from terrain metadata so one failed optional
  endpoint does not hide the base map.

### Package 4: Marketplace And Shop

- [x] Add Marketplace and Shop indicators to matching claim areas.
- [x] On Marketplace area selection, request local offers on demand.
- [x] Render loading, empty, error, and offer-list states in the claim popup.
- [x] Cancel stale offer requests when server/world/area selection changes.
- [x] Do not fetch every area's offers during initial map load.

### Package 5: Player Layers

- [x] Add separate toggles for:
  - online players, green
  - recently offline players, yellow
  - long-term offline players, red and admin-only
- [x] Poll player layer data at a 60-second interval while the map tab is
  active; pause polling when hidden/unmounted.
- [x] Localize player state and last-seen labels in marker details.
- [x] Show the long-term toggle only when the authenticated user is an admin
  and the backend capability confirms support.
- [x] Treat frontend role checks as presentation only; rely on backend
  filtering for security.

## Hook And Component Structure

Prefer localized additions:

- shared layer API types and runtime parsers
- one map-layer data hook with independent endpoint state
- coordinate utilities
- focused Leaflet components for sectors, claims, and players
- one details component for selected claim/market offers

Avoid growing `AdminMapTab` or `ServerDetail` into monolithic data/rendering
components.

## Validation Strategy

- [x] Component tests verify that changing world identity recreates the Leaflet
  map and preserves unrestricted initial-fit behavior.
- [ ] Runtime switching server A → B → A produces the correct center, bounds, tiles,
  layer data, and no stale selected feature.
- [x] User panning remains unrestricted after initial fit.
- [x] Coordinate tests cover negative block positions and half-open bounds.
- [ ] Runtime sector labels/borders align with in-game origin and landmarks.
- [ ] Claims align with known in-game Areas at all supported zoom levels.
- [x] Layer toggles independently control their Leaflet layers.
- [x] Missing Land Claim/Marketplace/Shop capabilities leave the terrain and other
  layers functional.
- [x] Marketplace offers are fetched only after selecting a marked area.
- [x] Stale/aborted responses cannot overwrite the newly selected
  server/world/area state.
- [x] Online/recent/long-term markers use green/yellow/red colors and independent
  visibility.
- [x] Non-admin UI does not present the long-term offline control.
- [x] Malformed backend responses fail closed.
- [ ] Complete responsive and keyboard-accessibility runtime review.
- [x] Unit tests cover parsers and coordinate conversion.
- [ ] Extend component tests beyond remount/reset to direct toggle, offer,
  capability, and polling cleanup interaction coverage.
- [x] Repository build, lint, and tests pass.

## Risks

- React may reuse the Leaflet `MapContainer` across server changes. Use an
  explicit identity key and test map teardown, not only prop updates.
- Thousands of vector objects can degrade interaction. Generate sectors by
  viewport and consider canvas rendering or bounded claim queries only after
  measurement.
- Labels and badges can become unreadable at low zoom. Use tested zoom-aware
  visibility without changing data semantics.
- Multiple independent requests can race during server switching. Use abort
  controllers and identity checks for every layer request.
- Persisted visibility can leak admin-layer preferences between users on a
  shared browser. Do not persist the admin-only layer by default.

## Rollback

Hide the new controls/components and continue rendering the current terrain
tile layer. The existing map tab and schema-5 parsing remain the fallback.

## Current Implementation State

- Map identity now includes backend URL, world key, native zoom, and tile size;
  switching worlds remounts Leaflet instead of retaining stale center state.
- Sector cells are generated only for the current viewport, use 1024-block
  geometry, silver borders, and upper-left coordinate labels.
- Claims, configured colors, sale state, Marketplace/Shop indicators, and
  on-demand local offers render above terrain tiles.
- Player layers poll every 60 seconds and expose separate online, recent, and
  admin-only long-term toggles.
- Runtime parsers fail closed for incompatible schema-1 responses.
- Frontend tests, lint, and production build pass.
