# Geniura Web — Foundation implementation status

**Scope:** Initial, non-production Next.js App Router implementation on `dev`.

## Implemented
- Next.js 16 + React 19 + TypeScript 6 + Tailwind 4 project structure.
- Provisional AR/FR routes, Arabic RTL and French LTR; four final languages remain undecided.
- Accessible public landing, server-rendered public jobs search/list/detail.
- No fake jobs; unavailable public API renders an explicit unavailable state.
- Anonymous public API adapter with `cache: "no-store"`, and lightweight runtime response checks.
- Conservative `robots.txt` and `noindex` because the product is not launched.
- GitHub Actions checks (no deployment).

## Deliberately not implemented
- Authentication, candidate CV upload, employer dashboards, organizations, applications.
- CSRF cookie/session integration (backend commit bc5e8dd... has not been pushed yet).
- Generated OpenAPI client / Orval: API schema currently incorrectly advertises `GET /jobs` as an array instead of the actual pagination object.
- Branding logo and final design system; current layout and wordmark are provisional.
- Final four locales, pricing, WhatsApp, payments, external AI, production integrations.

## Known release blockers
1. Publish and CI-test the pending Backend CSRF commit.
2. Fix paginated OpenAPI response schemas (all affected endpoints), standardized error response schema; regenerate schema and test.
3. Generate and commit a dependency lockfile in an npm-enabled environment, change CI to `npm ci`, verify lint, typecheck and build.
4. Approve UI direction, supported languages and product copy.
5. Test real browser session + CSRF on Vercel preview using approved API deployment.
6. Do not merge or deploy production without an explicit approval.
