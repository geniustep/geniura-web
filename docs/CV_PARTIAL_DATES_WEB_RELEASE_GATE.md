# Geniura CV partial dates — integration release gate

This isolated web branch adds precision-aware editing and review for professional experience and education dates. It changes no production backend code and does not deploy.

## Behaviour

- `YYYY` remains a year. No month or day is invented.
- `YYYY-MM` is sent exactly as `YYYY-MM` (no fabricated day). The backend must accept this partial-date input under its documented parser contract. If the API rejects it, hold release and correct the API rather than manufacturing day 01.
- `YYYY-MM-DD` may represent an exact day when the backend preserves day precision.
- Existing `unknown` legacy dates are displayed as their original ISO string. Unchanged legacy dates are omitted from unrelated PATCHes to avoid silently reclassifying them.
- Invalid dates and impossible intervals are rejected before save. Candidates must confirm CV suggestions; no profile fact is accepted automatically.
- Certifications use their existing full-date input unchanged.

## Important release blockers

1. The authoritative backend source commit `d626e1012e164d8ff71249d25ecdd875d12a6256` remains local to the user's WSL worktree (not on the GitHub remote at the time of this change). The web repository's pinned contract and Orval-generated files **have not been regenerated** from that source. Do not hand-edit generated code or claim API contract parity. On a machine with both worktrees, run `pnpm api:contract ../geniura-api/docs/openapi/openapi.yaml d626e1012e164d8ff71249d25ecdd875d12a6256`, review staff/audit stripping and provenance, then `pnpm api:generate` and commit only reviewed diffs.
2. The reported backend maps `YYYY-MM-01` to **month** precision, making it impossible to write an exact *first day of a month* unambiguously through the current date string alone. The UI prevents new claims of exact first-day precision; an API with a **writable** precision parameter (validated server-side) is required to resolve this before full release.
3. This integration was authored through an isolated GitHub branch. The Windows WSL2 development runtime and local-only backend API were not available for executing `pnpm check`, `pnpm build`, Playwright or an end-to-end backend round trip. Tests were added but their execution is **unverified**.
4. The backend `dev` branch does not yet contain the parser and partial-date migrations. Merge and deploy the compatible backend before enabling web forms against it, with a rollback plan for schema/application contracts.

## Before PR approval

- Run `pnpm check`, `pnpm build` and affected Playwright tests locally.
- Generate and compare web OpenAPI/Orval output from the **actual** backend commit, then verify generated TypeScript and Zod types.
- Test round trips in `ar`, `fr`, `en`, including year-only, month-only, full dates, legacy/unknown, current employment, duplicates, 409/412, and first-day precision.
- Check external scanner functionality separately. No real applicant CVs should be added to logs or test fixtures.
- Review the generated schema and obtain approval before merging to `dev` or deploying.

**Status: implementation branch for review, not a green release gate.**
