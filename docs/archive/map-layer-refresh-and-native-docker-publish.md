# Map Layer Refresh and Native Docker Publish

## Objective

Refresh claim data whenever the claims layer is enabled and replace the
unreliable QEMU-based ARM64 Docker build with native AMD64 and ARM64 builds.

## Ownership

- Frontend and workflow: `devidian-rw-manager`
- Backend API: unchanged

## Dependencies

- Existing map layer endpoint and visibility controls
- GitHub-hosted `ubuntu-24.04-arm` runner

## Affected repositories/apps

- `devidian-rw-manager` only

## Risks and rollback

- Claim refreshes add one request per enable action; requests remain scoped to
  the selected server.
- ARM runner availability is a GitHub Actions dependency; rollback restores
  the prior single Buildx/QEMU job.

## Validation strategy

- Add a focused map-toggle regression test.
- Run lint, tests, build, and YAML review.
- Validate the next Docker Publish workflow run for both manifests.

## Checklist

- [x] Diagnose QEMU ARM64 failure and claim-toggle stale-data cause.
- [x] Add claim refresh on enable with regression coverage.
- [x] Replace QEMU build with native platform builds and manifest assembly.
- [x] Run local validation.
