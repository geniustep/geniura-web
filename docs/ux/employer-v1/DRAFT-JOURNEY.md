# Employer offer draft journey

Entry: homepage employer CTA → /employers → /employers/new. The homepage employer block also links directly to the editor.

1. Anonymous visitors write title, contract, work mode, location, description/requirements and optional responsibilities. Taxonomy loads independently; an outage must not block writing.
2. Drafts autosave in localStorage with a versioned schema, 7-day restoration window, visible saving/saved/failure states, refresh restoration and cross-tab change detection. Copy explicitly says “on this device”. This is not server-side guest persistence or cross-device synchronization. Passwords are never stored.
3. A private preview precedes the account gateway. Login/register/forgot-password retain a safe return path. Employer registration has explicit employer intent; responses remain non-enumerating. Email confirmation is required before organization creation under the existing API.
4. Verified users select an active permitted organization or explicitly create one with its name. Roles are advisory in the UI; the API enforces authorization.
5. Final confirmation names the organization and requires an explicit authorization checkbox and submit button. Only this action creates/updates the server job draft and calls the existing `submit` lifecycle endpoint. It never calls `publish`.
6. Success requires the API to return submitted/published status. Request IDs are persisted as owner-scoped checkpoints to retry against the same server draft. Reload requires fetching current server state before showing success again.

Scope limitations: organization verification, moderation and actual publication remain governed by the backend. No free-publication claim, auto-account lookup, automatic publication, or fake companies/jobs is introduced. If the creation response itself is lost in transit, the API does not currently expose an idempotency key contract; cross-network exactly-once creation requires backend support. Browser double submission and retries after known checkpoints are guarded.

Validation: schema/payload unit tests and synthetic API browser coverage for four locales, desktop/mobile, persistence, login continuity, employer signup intent, explicit submission, backend failure and unverified email. No real accounts, emails or job submissions are used by these tests.

## Employer destination after submission

`/account/employer` is a private, authenticated destination. It lists only organizations returned by the current user's memberships API, and fetches each selected organization's jobs from its authorized endpoint. Job status and review status are separate and come from the API. Submitted requests are not represented as public jobs. The confirmation screen links here, and all authenticated users can access it from the account menu, including candidates who also recruit. Ordinary employer login defaults here.

Opening job details and refreshing the list are read-only. Job listing survives removal of the browser draft. Loading and API errors never masquerade as empty job lists. Pagination uses only the selected organization's path, retaining its cursor query without following an arbitrary external URL. No publish or resubmit action is triggered by visiting this page.
