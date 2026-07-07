---
name: "repository-workflow"
description: "Use for repository-local workflows, validation, migrations, runtime debugging, and release checks in devidian-rw-manager."
---
# Repository Skills

## frontend-api-validation
- Verify backend API usage at call sites and type boundaries.
- Treat request/response shape changes as cross-repository contract changes.

## ui-regression-review
- Review responsive behavior, text overflow, route behavior, loading states, and error states.
- Keep components aligned with the existing design system.

## runtime-debugging
- Reproduce with local dev/build scripts first.
- Record commands, browser route, and observed behavior in the active task.

## release-validation
- Preserve Vite build behavior and deployment assumptions.
- Never require workspace-root files for frontend release or deployment.
