# Server description newline formatting

## Objective and ownership
Render native server description line-break notation in Manager details and card
previews. Frontend owns presentation; backend, native API and storage stay intact.
No dependencies or configuration migration are required.

## Evidence and contract (2026-09-07)
The Development server.properties description and parsed native /info value match:
both contain literal backslash-n. InfoRow already preserves real newlines.
Decode description notation exactly once at display time: \n and \r\n are line
breaks; doubled backslashes escape a literal backslash (\\n displays literal \n).
Other escape sequences remain untouched. This explicit convention cannot infer
whether an unescaped \n was intended as prose or a break; use \\n for literal text.
Server names, short names, contact fields, backend responses and stored values are
not decoded. Existing safe RichText rendering handles tags without HTML injection.

## Checklist
- [x] Compare source configuration and parsed native data.
- [x] Apply display conversion only to descriptions.
- [x] Add regression cases for real/escaped newlines, literal escapes and HTML safety.
- [x] Render safe `<align=left|center|right|justify>` and `<br>` description tags.
- [x] Run tests (84 passed), lint (0 errors, 32 warnings), build and diff checks.
- [ ] Verify published website after rollout.

## Validation and rollback
Use existing component tests for multiline whitespace and safe markup rendering.
Revert helper and its two call sites to restore prior display behavior. No server
configuration or persistent data changes are needed. No deployment is claimed.

## Final local evidence
19 test files / 84 tests passed. Component regression verifies preserved multiline
whitespace, bold formatting, supported alignment and line breaks, and text-only
rendering of unsupported HTML tags.
The captured Development description converts 14 escaped breaks into 14 newlines.
Lint and build succeeded with warnings (including bundle size/Browserslist).
Validation uses the checkout's npm scripts and package-lock.json, matching CI;
there is no Yarn lockfile in this checkout. No dependency files were changed.
