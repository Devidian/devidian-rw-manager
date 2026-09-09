# Embedded Map RC

## Objective

Provide a standalone, embeddable Manager route for the configured server map.
The route must offer Steam sign-in directly on the map so signed-in players can
enable their private "Where have I been?" layer.

## Ownership, dependencies, and compatibility

- Owner: `devidian-rw-manager` frontend.
- The existing public `/api/data/server/map` and map-layer endpoints provide
  anonymous map data. The authenticated player-history endpoint remains
  unchanged and private.
- The existing Steam OpenID callback and map component are reused; no backend
  API, renderer, or plugin change is required.

## Risks and rollback

- The embedded route must never be wrapped in the Manager's auth guard.
- Steam must return to the embedded route after OpenID completion.
- Roll back by recreating the Dev frontend with the preceding RC/stable image.

## Validation

- [x] Add the public route, embedded map data loading, and Steam return route.
- [x] Make the reusable map use the public data endpoint only for the embedded
  view while retaining its current storage endpoint in the Manager.
- [ ] Run lint, tests, build, Docker build, publish an RC image, and activate it
  on Dev.
