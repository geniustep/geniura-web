# Geniura CV partial dates — integration release gate

This branch adds precision-aware editing and review for professional experience and education dates on the web app, wired to the backend OpenAPI contract pinned at commit `d626e1012e164d8ff71249d25ecdd875d12a6256` (see `contracts/` and PR #6).

## Behaviour

- `YYYY` remains a year. No month or day is invented.
- `YYYY-MM` is sent exactly as `YYYY-MM` (no fabricated day). The backend accepts partial dates under its parser contract.
- `YYYY-MM-DD` may represent an exact day when day precision is selected and supported; legacy/unknown ISO strings display without claiming unverified precision.
- Invalid dates and impossible intervals are rejected before save. Candidates confirm CV suggestions; no profile fact is accepted automatically.
- Certifications use their existing full-date input unchanged.

## Live integration tests (local only)

Synthetic data only — never production:

1. Run **geniura-api** locally (`127.0.0.1:8000`) with migration `0004` applied and a **Celery worker** for the CV pipeline.
2. Copy `.env.example` to `.env.local` with `API_BASE_URL=http://127.0.0.1:8000`.
3. `pnpm build`
4. `pnpm test:integration` — runs 13 Playwright scenarios in `tests/integration/cv-partial-dates.spec.ts`.

User seeding (WSL, local Django settings only):

```bash
GENIURA_INTEGRATION_SEED=allow GENIURA_USER_PREFIX=cv-int-run \
  python tests/integration/seed-local-users.py --clear-throttle --count 16
```

Global setup performs the same seed when `pnpm test:integration` runs on a machine with WSL + the API worktree. Set `GENIURA_SKIP_SEED=1` to skip seeding (not recommended for a full pass).

Login throttling on the API is **10/min per IP** (`THROTTLE_LOGIN`). The suite reuses Playwright storage state between selected serial tests and seeds users up front so UI login stays under that limit without changing production throttle settings. Optional `--clear-throttle` in the seed script clears Django cache when Redis is shared with the running API process.

## Known precision limitation

The backend maps some `YYYY-MM-01` inputs to **month** precision. The UI blocks new exact-day claims for the first day of a month (`partialDate.firstDayUnsupported`) until a writable precision field is available server-side.

## Before merge to `dev`

- `pnpm check` and `pnpm build` green on the PR branch.
- All **13** CV integration tests pass in **one** `pnpm test:integration` run (0 failed, 0 skipped).
- Backend PR for partial dates merged or deployed to the target API before enabling the web forms in shared environments.
- No real applicant CVs in fixtures or logs.

**Status:** integration gate defined; merge when CI and local full-stack pass on the PR branch.
