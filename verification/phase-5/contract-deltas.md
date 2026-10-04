# Phase 5 Contract Deltas

## registerAction
- Server Action returns `User | { errorCode: "USER_EXISTS" | "TooManyRequests", error?: string }` (if handled correctly) or throws errors.
- Does NOT create session upon registration.

## loginAction
- Authenticates and creates session via `createSession`.
- Increments `failed_attempts` on failure, resets on success.

## oxenn_session
- Session implemented via DB-backed token stored in `sessions` table (hashed).
- Cookie `oxenn_session` holds raw 256-bit token string, expiry set to 24 hours.

## Invitation Token Response Behavior
- URL delivery uses `EmailSender` without altering acceptance cryptography.
- Token is verified against hashed version in `organization_invitations` table.

## AccountLocked
- Handled internally by throwing `Error("Account is temporarily locked. Please try again later.")`.

## TooManyRequests
- Returned as `errorCode: "TooManyRequests"` or thrown as `Error("TooManyRequests")`.

## retryAfterSeconds
- Not implemented in current source code. Rate limiting uses a simple boolean cutoff based on threshold rather than providing a structured `retryAfterSeconds` response payload.
