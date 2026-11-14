# PR #138 authentication remediation report

## Status

PARTIALLY IMPLEMENTED — the production email sender is now implemented for Maileroo's Email API, using the approved sender identity `noreply@oxenn.ir`. Provider-specific tests and environment documentation have been added. CI has not yet reported results for this revision, and the PR still has merge conflicts with `main`; do not merge or deploy until those gates are cleared.

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
- Implement `ProductionEmailSender` using Maileroo's Email API with a domain sending key, configurable sender name/address, plain-text and HTML bodies, disabled open/click tracking for authentication messages, HTTP timeout, safe error handling, and HTTP(S)-only action links.
- Use `noreply@oxenn.ir` as the documented default sender address. No SMTP password or Sending Key is committed to the repository.
- Await password-reset delivery so the Server Action does not return before the provider request has settled.
- Add unit coverage for Maileroo configuration, payload construction, disabled tracking, HTML escaping, provider rejection, and invalid action URLs.

## Runtime configuration

Configure these server-side environment variables in the actual application runtime:

- `EMAIL_PROVIDER=maileroo`
- `MAILEROO_SENDING_KEY` — the Sending Key created for the `oxenn.ir` domain (not an API Management key and not the SMTP password)
- `EMAIL_FROM_ADDRESS=noreply@oxenn.ir`
- `EMAIL_FROM_NAME=Oxenn`

The SMTP username/password are not consumed by this implementation because it uses the HTTPS Email API rather than opening an SMTP socket. DNS records in Cloudflare prove domain ownership/authentication but do not inject application secrets into the runtime. Confirm the domain is verified and the Maileroo account is approved for production sending before enabling this in production.

## Verification

- Earlier CI at code head `122a500` passed Unit Tests, Isolation Suite, and Build and Test (run `43459001747`).
- The Maileroo implementation and new tests were committed after that successful run. No workflow runs or combined status checks were returned for the current code head at the time this report was updated. The new implementation and tests must therefore be treated as **not yet CI-verified**.
- The previous Vercel preview-comments result is not evidence that production email delivery is configured or that the new Maileroo integration works in the deployment runtime.

## Known limitations and deployment gate

- The PR remains behind and diverged from `main` and GitHub reports `mergeable: false`. This is a merge-conflict blocker; it has not been resolved by blindly updating or force-pushing the branch.
- The possible response-timing distinction in the verification resend flow has not yet been removed with a durable asynchronous outbox/queue. The current equal-shaped response is not sufficient proof of timing indistinguishability.
- Do not deploy until the merge conflict is resolved, CI passes on the final head, the Maileroo domain/account is cleared for production sending, and a real end-to-end delivery test succeeds without exposing credentials.
