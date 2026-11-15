# Contributing

This is a final-year project, but it is run like a team repository.

## Workflow

1. Branch from `dev`: `feat/...`, `fix/...`, `chore/...`, `docs/...`.
2. Make small commits with conventional messages (`fix(eta): ...`, `feat(admin): ...`).
3. Run the checks locally: `npm run check` (lint, backend, admin and app tests).
4. Open a pull request into `dev`. CI must be green: backend tests (with MongoDB and Redis), admin tests and build, app tests, both phone apps bundled for web and Android, lint, and the generated-copy check.
5. After it merges, `dev` is merged into `main` through a pull request. Builds and releases come from `main`.

Never push directly to `dev` or `main`.

## Shared code

Everything under `shared/` is the source of truth for the design system and the contract (event names, statuses, ids, timing windows). The copies in `apps/*/src/shared`, `apps/admin-dashboard/src/design` and `backend/lib/contract.js` are generated: change the source and run `npm run sync`. CI fails when a copy is stale or was edited by hand.

## Where things are

See [docs/STRUCTURE.md](docs/STRUCTURE.md) for a map of the repository and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the parts fit together.
