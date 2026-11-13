# PR #138 authentication remediation report

## Status
INCOMPLETE — PR #138 enforces verified-email access immediately. At reviewed head `05ad7fe`, Unit Tests and Isolation Suite passed, but Build and Test failed Typecheck because an obsolete `result.error` access remained after per-address quota exhaustion was changed to a generic success response. That redundant branch is being removed. Production email delivery remains a hard deployment blocker because the production sender is unimplemented.

## Invariant
Only users who have verified control of their email address may establish or retain an authenticated workspace session. Verification recovery must not expose email addresses in URLs, allow unknown-address requests to exhaust a victim's delivery quota, or make a committed registration appear to have failed. Resend responses must not reveal whether an address belongs to an unverified account.

## Implementation
- Return `EMAIL_NOT_VERIFIED` as serializable data from the login Server Action and reconstruct the coded error in `AuthProvider` on the client.
- Revoke sessions for unverified users and cover authenticated, unverified, revoked, and replaced-session paths in tests.
- Apply requester-based verification throttling before lookup using an HMAC of the requester IP keyed by `SESSION_SECRET`; apply the per-address delivery quota only after finding an existing unverified account, while keeping quota-exhaustion responses enumeration-safe.
- Treat post-commit verification-request exceptions as delivery failure while preserving the created account result.
- Remove email addresses from registration and resend query strings; users enter the address in the resend form.
- Bind verification tokens to the recipient email fingerprint and consume stale links when the account email has changed.
- Correct the verification success redirect copy and malformed registration object separator.
- Keep the generated docs index and database reference matrix synchronized with their source documents.

## Verification
- The earlier `Build and Test` syntax failure (`TS1005: ',' expected`) in `src/app/[locale]/register/page.tsx` was fixed in commit `4912128`.
- At head `36d282b`, CI run `43437871644` passed Unit Tests and Isolation Suite; Build and Test failed at the generated tracked-file check because the PR report's `src/lib/docsIndex.ts` snippet was stale by one character. The index was regenerated in commit `05ad7fe`.
- At head `05ad7fe`, CI run `43458597028` passed Unit Tests and Isolation Suite. Build and Test failed at Typecheck with TS2339 on the obsolete `result.error` access in `src/app/actions/auth.ts:352`; the branch is removed in this follow-up.
- CI must rerun on the resulting head. No successful Build and Test result is claimed yet.

## Negative-path checks
- An unverified database-backed session is revoked and returns `null`.
- Unknown addresses and addresses whose delivery quota is exhausted receive the same success-shaped resend response.
- Requester IP rate-limit keys are derived with HMAC using the server-side `SESSION_SECRET`, not a reversible unkeyed hash.
- Legacy verification tokens without the recipient fingerprint are rejected before database access.
- A token bound to a previous email address is consumed without verifying the changed address.
- Verification delivery exceptions after account commit are converted to `verificationEmailSent: false`.

## Known limitations and deployment gate
- **Do not deploy this enforcement until production email delivery is implemented and configured.** `ProductionEmailSender.send()` currently throws even when `EMAIL_PROVIDER` is set. Because this PR already blocks login for unverified users and revokes their existing sessions, new production registrations cannot receive verification links and existing unverified accounts cannot recover access. This is an active consequence of the PR, not a future enforcement step. This change does not choose an email provider, add provider credentials, or silently weaken the verified-email invariant; the deployment owner must approve and supply the provider integration and rollout plan before deployment.
