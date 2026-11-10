# DOC-008 — Platform Admin Boundary (Stage 2) Report

**Status:** Implementation committed to the existing Stage 2 branch; runtime activation and PR approval remain pending.

## Scope and sequencing

Stage 1 was merged through PR #127. The existing `feat/022-doc-008-platform-admin-identity` branch was updated from `main` before Stage 2 work resumed. No additional branch or pull request was created. All Stage 2 changes are intended for the existing PR #128.

## Implemented

- Added a provider-agnostic OpenID Connect Authorization Code flow using `openid-client` 6.8.9, PKCE S256, fresh state and nonce, exact issuer/audience checks, a constrained RS256/ES256 ID-token signing algorithm, and default MFA AMR enforcement with optional ACR policy.
- Added a browser-bound, ten-minute, one-use OIDC transaction. The database stores a state hash, browser-binding hash, nonce, redirect URI, and AES-256-GCM-encrypted PKCE verifier.
- Added server-only Platform Admin session resolution. The application stores only a hash of a random opaque session token and checks account status and current explicit permission grants on each authorization lookup.
- Added login, callback, and logout route handlers. Cookies are HttpOnly, Secure, host-only, and use SameSite=Lax for the OIDC binding cookie and SameSite=Strict for the authenticated session cookie. Login and callback attempts have database-backed per-IP rate limits using hashed keys and a trusted `x-real-ip` proxy header.
- Added a separate Platform Admin PostgreSQL persistence model for accounts, `(issuer, subject)` identities, explicit permission grants, opaque sessions, OIDC transactions, audit events, and migration history.
- Added a dedicated migration runner and one-time first-admin bootstrap command. Both use the migration-only connection variable and refuse Workspace database reuse. Runtime and migration URLs must target the same dedicated database and use different PostgreSQL roles when both are configured.
- Added configuration guidance and documented the production activation boundary.

## Verification performed locally

- 35 targeted unit tests passed across the Stage 1 authorization boundary, OIDC flow, persistence, rate limiting, and database isolation suites.
- Targeted TypeScript checking passed for the Stage 2 source files, route handlers, scripts, and tests.
- The OIDC tests use mocked discovery, token exchange, and persistence. They verify state/nonce/PKCE construction, browser binding, issuer/audience rejection, endpoint HTTPS enforcement, no JIT provisioning, and default-deny behavior.

A full repository install, full test suite, lint, production build, and GitHub CI have not yet been verified for the final Stage 2 commit. Those checks must be rerun on the exact PR #128 head before requesting approval.

## Explicit non-actions and limitations

- No OIDC vendor or issuer has been selected or configured in the repository.
- No dedicated Platform Admin database was provisioned or connected.
- The Platform Admin migration was not executed against any database.
- The first Platform Admin account was not bootstrapped.
- No Workspace authentication, role, legacy `admin_users` table, or Workspace database is used as Platform Admin authority.
- The existing `AdminAPIClient` and CQRS handlers are not wired to the new identity boundary. No Platform Admin business route is being exposed by this Stage 2 change.
- No deployment, live database, or production secret changes were made.

## Completion gate

Stage 2 code review is not complete until the final PR #128 head passes the full required CI checks and independent security review. Runtime activation remains a separate operational step requiring the dedicated database, OIDC registration, deployment secrets, migration, and controlled first-admin bootstrap. PR #128 must not be merged until the user explicitly authorizes merge after reviewing the final evidence.
