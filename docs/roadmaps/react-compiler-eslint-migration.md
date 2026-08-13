# React Compiler ESLint Migration

## Objective

Resolve the React-Compiler diagnostics introduced by `eslint-plugin-react-hooks` 7.1.1 without delaying current feature and release work.

## Ownership and affected applications

- Owner: `devidian-rw-manager` frontend.
- Affected source: React components currently reported by `react-hooks/refs`, `react-hooks/purity`, `react-hooks/set-state-in-effect`, and `react-hooks/static-components`.
- Generated `supabase/functions/mcp/index.ts` remains excluded from `no-var`; it is overwritten by `@lovable.dev/mcp-js`.

## Dependencies and constraints

- Keep the upgraded hooks plugin for ESLint 10 compatibility.
- Migrate behaviorally, with focused component tests for every changed workflow.
- Do not hand-edit generated MCP output.

## Risks and rollback

- Effect refactors can affect loading, pagination, dialog, and live-map timing.
- The temporary warning severity preserves CI signal. Rollback is to retain warning severity until each group has tests.

## Validation strategy

- Migrate by component group, run its focused tests, then `npm run lint`, `npm test`, and `npm run build`.
- Restore error severity only when all four React-Compiler rules produce zero diagnostics.

## Checklist

- [x] Upgrade `eslint-plugin-react-hooks` for ESLint 10 compatibility.
- [x] Keep new React-Compiler diagnostics visible as warnings while CI remains enforcing for established rules.
- [x] Move the server-list sort header outside render.
- [ ] Refactor stateful effects in `AdminMapTab`, `ServerDetail`, `StatisticsPage`, `LocalPinSyncDialog`, `UserManagementPage`, contexts, hooks, and UI primitives.
- [ ] Replace render-time ref access in `AdminMapTab`.
- [ ] Replace render-time non-determinism in `GlobalIntercomContext` and `components/ui/sidebar`.
- [ ] Remove all remaining compiler warnings and restore error severity.
