# Live map layer WebSocket

The cross-repository objective, contract, migration, rollback, risks, and
validation checklist are maintained in `../../docs/active/live-player-position-sync.md`.

This repository owns one reconnecting subscription for the currently opened
server detail and applies validated entity deltas directly to local map state.
The subscription and the initial `/map/layers/players` plus `/player` snapshots
stay mounted across detail-tab changes and close only when leaving or changing
the server detail. REST supplies the initial state and polling remains the
degraded fallback while the subscription is unavailable. A late REST response
must not replace player deltas already received over the socket.
