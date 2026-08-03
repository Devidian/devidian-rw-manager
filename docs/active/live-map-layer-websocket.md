# Live map layer WebSocket

The cross-repository objective, contract, migration, rollback, risks, and
validation checklist are maintained in `../../docs/active/live-player-position-sync.md`.

This repository owns one reconnecting subscription for the currently mounted
map/server and applies validated entity deltas directly to local map state.
REST supplies the initial state and polling remains the degraded fallback while
the subscription is unavailable.
