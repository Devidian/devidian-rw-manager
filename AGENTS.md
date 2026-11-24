# AGENTS.md

## Repository Purpose
This repository owns the Rising World manager frontend.

It is a standalone Vite/React/TypeScript application and must not depend on workspace-root orchestration files for development, validation, release, or deployment.

## Ownership
Owns:
- frontend UI workflows and client-side state
- React components, routes, styling, i18n, and frontend tests
- integration with the manager backend API from the browser/client side

Does not own:
- backend API implementation
- in-game Rising World plugin behavior
- workspace-root orchestration rules

## Mandatory Workflow Rules
- Preserve the existing Vite, React, TypeScript, shadcn-ui, Tailwind, and test setup.
- Use the package manager already configured by the repository.
- Keep UI changes consistent with the existing application design system.
- Follow `.codex/agents/*.toml` for local agent roles, task classes, context loading, and escalation.
- Follow `docs/policies/repository-policy.md` for reusable governance rules.
- Keep `README.md` and `PLANS.md` aligned with setup, workflow, or deployment changes.

## Validation
- Run the repository build script for build-impacting changes.
- Run lint/tests when behavior, UI logic, or API integration changes.
- Review backend contract impact when changing API usage.
