# PR #138 authentication remediation report

## Status
INCOMPLETE — code and test fixes are prepared for CI validation; production email delivery remains an existing operational blocker because the repository's `ProductionEmailSender` is intentionally unimplemented.

## Invariant
Only users who have verified control of their email address may establish or retain an authenticated workspace session. Verification recovery must not expose email addresses in URLs, allow unknown-address requests to exhaust a victim's delivery quota, or make a committed registration appear to have failed.

## Implementation
- Return `EMAIL_NOT_VERIFIED` as serializable data from the login Server Action and reconstruct the coded error in `AuthProvider` on the client.
- Revoke sessions for unverified users and cover both the authenticated and revocation paths in unit tests.
- Apply requester-based verification throttling before lookup, and apply the per-address delivery quota only after finding an existing unverified account.
- Treat post-commit verification-request exceptions as delivery failure while preserving the created account result.
- Remove email addresses from registration and resend query strings; users enter the address in the resend form.
- Correct the verification success redirect copy and malformed registration object separator.
- Update fixtures for verified users and fingerprint-bound verification tokens; add legacy-token rejection coverage.

## Verification
- The prior `Build and Test` CI log reported `TS1005: ',' expected` in `src/app/[locale]/register/page.tsx:62`.
- The prior `Unit Tests` log reported failures in `tests/unit/authorization-lifecycle.test.ts`, `tests/unit/services/auth/session.test.ts`, and `tests/unit/app/actions/auth.test.ts` (unknown-address resend fixture and legacy token fixture among them).
- Targeted tests and the full build must be rerun by the PR CI after this commit. No passing result is claimed here.

## Negative-path checks added
- An unverified database-backed session is revoked and returns `null`.
- Unknown email addresses consume only the requester bucket, not the address delivery bucket.
- Legacy verification tokens without the recipient fingerprint are rejected before database access.
- Verification delivery exceptions after account commit are converted to `verificationEmailSent: false`.

## Known limitations
- `src/services/email/adapters.ts` currently throws from `ProductionEmailSender.send()` even when `EMAIL_PROVIDER` is configured. Production users cannot receive verification messages until a real provider adapter and its deployment configuration are supplied. This task does not invent a provider or credentials; the deployment owner must choose and configure one before enforcing verification in production.
- Vercel deployment queries for the PR #138 head SHA/branch returned no deployment. The recent `oxenn` project deployments in `ERROR` were associated with PR #136 (`review/063-src-017-20261113`), not this PR, so they are not attributed to PR #138.
