# Rising World Manager frontend
<!-- codemap-id: devidian-rw-manager -->

## Purpose

React/Vite application for server management, maps, statistics and player workflows. [Application](../src/App.tsx) assembles providers and routes; [bootstrap](../src/main.tsx) mounts it. Browser integrations consume the Manager backend REST and live APIs.

## Modules

- [UI and client state](modules/ui.md)
- [Backend and live integrations](modules/integration.md)

## Build and tests

[Package scripts](../package.json) define `yarn build`, `yarn lint`, and `yarn test`; [tests](../src/test/) exercise UI and integration behavior.
