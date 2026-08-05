# City and Leasehold Map Colors RC

## Objective

Deliver the Manager map presentation for Land Claim city cores and leaseholds
as a release-candidate image on Dev.

## Ownership and dependencies

- Frontend: renders the map-layer colors returned by the backend.
- Backend: recognizes the city and leasehold permissions and resolves their
  configured colors.
- Dependency: Land Claim `0.15.0` provides the permissions and settings.

## Risks and rollback

- The map must retain existing sale, renewal, and owner color precedence.
- Roll back by recreating the Dev services with their previous image tags.

## Validation

- [ ] Verify color mapping for city cores and available/occupied leaseholds.
- [ ] Run frontend and backend test/build checks.
- [ ] Publish RC images and recreate only the Dev Manager services.
- [x] Keep RC publication isolated from stable Docker tags.
