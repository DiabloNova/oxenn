# PR #138 authentication remediation report

## Status

Implementation plan approved and applied on the PR branch. The branch was refreshed against main before changes; at the implementation baseline it was 20 commits ahead and 0 behind, with GitHub reporting no merge conflict. The new implementation still requires CI, DeepSource and deployment-configuration verification on the resulting commit. Do not merge or deploy solely on the basis of static review.

## Security and delivery invariants

- Password-reset and verification resend responses do not disclose whether an address exists, is verified, is throttled, or encountered a queue/provider failure.
- The provider-dependent timing leak is removed because neither Server Action waits for Maileroo. Database work still differs for known and unknown accounts; no arbitrary delay or random jitter was added without a connected database and measured p95. Before claiming strict timing equalization, measure the production-like database p95 and add a calibrated minimum response floor if that measurement warrants it.
- Authentication email delivery is not awaited by the Server Action. The token and encrypted outbox record are committed atomically with the user/token state.
- Raw tokens and recipient addresses are encrypted in the outbox payload and are never included in Inngest event data or application log messages.
- Only the current, unexpired, unconsumed token for the current user email is eligible for delivery; the worker revalidates it inside every send attempt, including Inngest retries.
- The outbox is platform-owned infrastructure and is accessed through a dedicated, reviewed system purpose.

## Implementation

- Added the platform-owned `email_outbox` table with delivery status, attempt count, availability/lease timestamps, token hash, and AES-256-GCM encrypted payload fields.
- Added `src/services/email/outbox.ts` for authenticated encryption/decryption, token fingerprint verification, atomic insertion, claim/lease handling, stale-token cancellation, sent/failed transitions, and recovery selection.
- Bound AES-GCM ciphertext to its outbox row ID as additional authenticated data. The Inngest event contains only the opaque outbox ID; it never contains the recipient, raw token, or URL.
- Added the `EMAIL_OUTBOX_ENCRYPTION_KEY` runtime setting. It must be a stable 32-byte key encoded as 64 hexadecimal characters. Generate with `openssl rand -hex 32`; do not rotate it while pending outbox rows encrypted with the old key remain.
- Added an Inngest event worker with bounded retries and a minute-level recovery sweep. A 30-minute lease allows recovery after a worker stops; duplicate events are harmless because claiming is atomic.
- Delivery is at-least-once, not exactly-once. If the provider accepts a message and the worker crashes before its step checkpoint, the same still-valid token email can be sent again. The design does not claim provider-side idempotency.
- Registration now creates the user, credentials, workspace, membership, verification token, and encrypted outbox row in the same `runWithSystemContext` transaction. Redundant nested BEGIN/COMMIT statements were removed from registration, email verification, and password-reset confirmation; TenantContextManager owns the transaction boundary for all three flows.
- Verification resend and password reset both create token/outbox records transactionally and wake the Inngest worker after the response. The periodic sweep is the durable recovery path if the wake-up event is lost.
- Password reset now applies requester/IP throttling before account lookup and the per-account quota only after a real account is found. Email and IP bucket identifiers are HMAC-derived using `SESSION_SECRET`.
- Verification resend uses the same generic response shape for unknown, verified, throttled, and queue-failure cases. The account-specific quota is also HMAC-derived.
- Registration result naming now reports `verificationEmailQueued`, not `verificationEmailSent`, so the UI does not claim provider delivery before the worker succeeds.
- Development email logging masks recipient addresses and redacts action-token query parameters.
- Added the narrow `sys-email-outbox` privileged path and classified the table as `PLATFORM_OWNED`; it is not added to the organization-scoped runtime table inventory. The privileged-path registry is audit metadata, not a SQL-level table allow-list or an RLS substitute.
- Added migration `0016_email_outbox.sql`, Drizzle snapshot `0016_snapshot.json`, and the migration journal entry. The migration is checked in but has not been applied to any production database.

## Runtime configuration and deployment

Configure `EMAIL_OUTBOX_ENCRYPTION_KEY` in the actual application runtime before enabling registration, verification resend, or password-reset delivery on the new code. The key is independent of the Maileroo Sending Key. Keep the existing Maileroo configuration (`EMAIL_PROVIDER=maileroo`, `MAILEROO_SENDING_KEY`, `EMAIL_FROM_ADDRESS`, and `EMAIL_FROM_NAME`) unchanged.

The existing Inngest integration must be connected to the deployed environment with its event/signing keys. No provider credentials or encryption key are committed to the repository. No production database connection or production migration was used during this change.

## Verification still required

- Run unit tests for auth actions, encrypted outbox persistence, Maileroo adapter logging, Inngest registration, and privileged-path ownership.
- Run the database migration validation against a disposable PostgreSQL database; do not point the test at production.
- Run TypeScript, lint, build, unit, isolation, and generated-file drift checks on the final PR head.
- Inspect the DeepSource Secrets finding directly. A lack of GitHub Secret Scanning alerts does not prove the external DeepSource failure is harmless; do not suppress the analyzer or alter its thresholds without its exact finding.
- Verify the new environment key and Inngest configuration in the deployment environment, then perform a controlled end-to-end delivery test before production rollout.
