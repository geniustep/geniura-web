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
  python tests/integration/seed-local-users.py --count 16
```

Global setup performs the same seed when `pnpm test:integration` runs on Windows with WSL + the API worktree. Set `GENIURA_SKIP_SEED=1` to skip seeding (not recommended for a full pass). The seed script requires `GENIURA_INTEGRATION_SEED=allow`, Django `config.settings.local` with `DEBUG=True`, a locally hosted database, and a safe synthetic-account prefix.

Login throttling on the API is **10/min per IP** (`THROTTLE_LOGIN`). The suite reuses Playwright storage state between selected serial tests and seeds users up front to reduce authentication requests. **The seed script never resets Django cache or throttle keys.** If throttled (429), use a dedicated test-only cache and isolated local backend, wait for the rate window, or configure a test-only login rate **before launching the local Django process**. Never flush a shared Redis/cache or modify production rate limits to make tests pass.

## Known precision limitation

The backend maps some `YYYY-MM-01` inputs to **month** precision. The UI blocks new exact-day claims for the first day of a month (`partialDate.firstDayUnsupported`) until a writable precision field is available server-side.

## Before merge to `dev`

- `pnpm check` and `pnpm build` green on the PR branch.
- All **13** CV integration tests pass in **one** `pnpm test:integration` run (0 failed, 0 skipped).
- Backend PR for partial dates merged or deployed to the target API before enabling the web forms in shared environments.
- No real applicant CVs in fixtures or logs.

**Status:** Windows agent previously recorded 13/13 live integration PASS with local cache resets. Since the security review removed blanket cache resets, that exact full-stack test run must be repeated on a dedicated local test stack before considering the modified test harness revalidated. GitHub quality/e2e CI may still pass, but it does not execute these full-stack tests. Do not merge until security review and the local repeat are complete.
