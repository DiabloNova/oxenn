# PR #138 authentication remediation report

## Status
INCOMPLETE — the auth code, unit tests, isolation suite, and Vercel preview now pass on the current head; the remaining CI failure is generated tracked-file drift, which is being corrected. Production email delivery remains a separate release blocker because the repository's `ProductionEmailSender` is intentionally unimplemented.

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
- Current head `dc8e1ce630925d2c1fdc888f99b7a6e87f523e3e`: Unit Tests passed (including UI tests) and Isolation Suite passed in CI run `43436952088`.
- The Vercel preview for the same head reached `READY` and its alias was assigned; the Next.js compile, TypeScript, and production build completed successfully.
- `Build and Test` reached the final tracked-generated-files check, then failed because the report adds one `src/lib/docsIndex.ts` entry and `auth.ts` adds a consumer to `docs/database/reference-matrix.md`. Those generated outputs are now being synchronized; CI must rerun after they are committed.

## Negative-path checks added
- An unverified database-backed session is revoked and returns `null`.
- Unknown email addresses consume only the requester bucket, not the address delivery bucket.
- Legacy verification tokens without the recipient fingerprint are rejected before database access.
- Verification delivery exceptions after account commit are converted to `verificationEmailSent: false`.

## Known limitations
- `src/services/email/adapters.ts` currently throws from `ProductionEmailSender.send()` even when `EMAIL_PROVIDER` is configured. Production users cannot receive verification messages until a real provider adapter and its deployment configuration are supplied. This task does not invent a provider or credentials; the deployment owner must choose and configure one before enforcing verification in production.
- The first Vercel deployment after the initial remediation commit failed TypeScript checks in `registerAction` and the lifecycle test. Those type errors were corrected; the current PR #138 head deployment is `READY` with its preview alias assigned.
