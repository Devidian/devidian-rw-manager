# UI and client state
<!-- codemap-id: devidian-rw-manager/ui -->

## Responsibility

Routes, server management, maps and player workflows. React context coordinates authentication and configured storage.

## Source and tests

- [`App`](../../src/App.tsx) assembles providers and routing. [Pages](../../src/pages/) and [components](../../src/components/) contain user workflows.
- [Contexts](../../src/context/) and [hooks](../../src/hooks/) hold state and subscriptions. [Translations](../../src/i18n/) provide labels.
- [UI tests](../../src/test/) cover screens, state and interaction. See [integration](integration.md) for backend calls.
