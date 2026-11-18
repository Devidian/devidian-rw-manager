# PLANS.md

- [x] Add a bilingual participation page, contact-server approval on the dashboard and a DBID column in database players.
- [ ] Confirm signed-in contact and database-player views on V30.

Planning is stored in repository-local docs.
The satellite base-layer toggle and cached player-server history are implemented. Admin Utils now receives images on Development; tile alignment remains to be accepted before relying on the satellite layer in production.
Server duplicate review and Development acceptance are tracked in [docs/active/server-duplicate-review.md](docs/active/server-duplicate-review.md).
Player ObjectId navigation and Development acceptance are tracked in [docs/active/player-identity-steam-privacy.md](docs/active/player-identity-steam-privacy.md).
Guest catalog, detail, and map access and Steam-only dashboard access are tracked in the root DSGVO implementation plan; visual acceptance remains open.

- [x] Update the bilingual privacy policy draft for consent-filtered player exports, server storage and revocation behavior.
- [ ] Review legal wording and actual retention periods with the operator before publication; validate rendered DE/EN pages on Development.

- Active implementation tasks: [docs/active/](docs/active/)
- Roadmaps and larger plans: [docs/roadmaps/](docs/roadmaps/)
- Completed phase summaries: [docs/phase-archive.md](docs/phase-archive.md)
- Planning and documentation standards: [docs/policies/repository-policy.md](docs/policies/repository-policy.md)

Every implementation plan must include objective, ownership, dependencies, risks, validation strategy, affected repositories/apps, rollback considerations, and a markdown checkbox checklist.
