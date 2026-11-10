# Platform Admin Authentication and Persistence Boundary

**Status:** Stage 2 implementation is present in the repository. Production authentication remains disabled until a dedicated database, OIDC provider registration, runtime secrets, and the first explicitly provisioned account are configured.

## 1. Trust boundary

Platform Admin authentication is independent from Workspace authentication. It does not read `oxenn_session`, `organization_members.role`, Workspace session snapshots, `admin_users`, `roles`, or `permissions`. The legacy role hierarchy in `src/features/admin/security/index.ts` is not an authority source for this boundary.

The authenticated external identity is the exact `(issuer, subject)` pair returned by a validated OpenID Connect ID token. Email, display name, role names, caller-supplied actor fields, and Workspace membership do not identify or authorize a Platform Admin.

An external identity receives access only when that exact issuer/subject pair is already linked to an active `platform_admin_accounts` record. Login does not create accounts or permission grants. The account's active `platform_admin_permission_grants` rows are the only permission source. The authorization guard accepts exact known permission keys and does not apply role inheritance or wildcard grants.

## 2. OIDC flow

The server uses `openid-client` 6.8.9 and the Authorization Code flow with PKCE S256.

1. `GET /api/platform-admin/auth/login` discovers the configured issuer and creates a fresh state, nonce, PKCE verifier, and browser-binding value.
2. The server stores a hash of state, the nonce, an AES-256-GCM-encrypted PKCE verifier, a hash of the browser-binding value, the exact redirect URI, and a ten-minute expiry in `platform_admin_oidc_transactions`.
3. The browser receives the binding value in an HttpOnly, Secure, SameSite=Lax `__Host-platform_admin_oidc` cookie and is redirected to the discovered authorization endpoint.
4. `GET /api/platform-admin/auth/callback` requires the matching browser cookie and consumes the transaction atomically. It rejects missing, expired, replayed, or browser-mismatched transactions.
5. The OIDC client enables `enableNonRepudiationChecks` on the discovered configuration before any token exchange. `openid-client` then validates the ID-token signature against the provider JWKS as well as state, nonce, PKCE, issuer, audience, and expiry. The application additionally parses the already-verified protected header and rejects any algorithm other than RS256; providers must advertise RS256. The authorization request uses `prompt=login`; by default, the validated ID token must contain `amr: ["mfa"]`. Deployments may configure accepted AMR values and exact ACR values; configured ACR values are requested and checked against the returned claim. The discovered authorization, token, and JWKS endpoints must use HTTPS outside local development.
6. The application resolves the exact issuer/subject pair in the isolated Platform Admin database. Unknown or inactive identities are denied; no just-in-time provisioning occurs. Successful and denied login audit events use the same versioned HMAC pseudonym derived from the issuer/subject pair, never the raw external subject, and the callback records only one denial event per attempt.
7. The server creates a random opaque session token, stores only its SHA-256 hash, and sets an HttpOnly, Secure, SameSite=Strict `__Host-platform_admin_session` cookie. The default absolute session lifetime is eight hours.
8. `POST /api/platform-admin/auth/logout` revokes the database session and expires the browser cookie.

Login initiation is limited to 10 requests per 15 minutes per trusted client IP; callback attempts are limited to 20 per 15 minutes. Only an HMAC-SHA-256 of the rate-limit key is stored; the raw IP address is not persisted. In production, the application must run behind a trusted reverse proxy that overwrites `x-real-ip`; requests without that trusted header fail closed. Do not pass through a client-supplied `x-real-ip` value.

ID tokens, access tokens, client secrets, raw session tokens, authorization codes, raw OIDC subjects, and PKCE verifiers are never written to audit records. Login audit subjects are versioned HMAC pseudonyms derived from the issuer/subject pair using `PLATFORM_ADMIN_AUDIT_SUBJECT_SECRET`, which is independent of the OIDC transaction-encryption secret. Rotating `PLATFORM_ADMIN_OIDC_TRANSACTION_SECRET` therefore does not change historical audit correlation. Keep the audit key stable; changing it requires a controlled migration that preserves historical pseudonym mapping. The temporary PKCE verifier is encrypted before persistence. The session table stores only a one-way token hash.

## 3. Isolated persistence

The Platform Admin Control Plane uses a dedicated PostgreSQL database. It does not share the Workspace database or its credentials. The Drizzle schema at `database/platform-admin/schema/index.ts` generates these control-plane tables:

- `platform_admin_accounts` — active or suspended internal accounts;
- `platform_admin_external_identities` — unique `(issuer, subject)` links;
- `platform_admin_permission_grants` — explicit, individually revocable permission keys;
- `platform_admin_sessions` — hashed opaque session tokens, the issuing audience, and revocation/expiry state;
- `platform_admin_oidc_transactions` — short-lived, one-use browser-bound OIDC transactions;
- `platform_admin_auth_rate_limits` — hashed client keys and bounded authentication attempt windows;
- `platform_admin_audit_events` — authentication, bootstrap, and logout evidence;
- `__platform_admin_drizzle_migrations` — Drizzle migration history for this database only; it is owned by the migration role and unavailable to the runtime role.

`PLATFORM_ADMIN_DATABASE_URL` is the least-privilege runtime connection. `PLATFORM_ADMIN_MIGRATION_DATABASE_URL` is the privileged migration/bootstrap connection. When both are present, the application checks that they target the same dedicated database but use different PostgreSQL roles. Both URLs are rejected if they point to the same host, port, and database as `DATABASE_URL`, `MIGRATION_DATABASE_URL`, or `AUTHENTICATOR_DATABASE_URL`.

There is no fallback from either Platform Admin URL to a Workspace URL. Do not use `db:push`, the Workspace Drizzle migration runner, or `AUTHENTICATOR_DATABASE_URL` for this database.

## 4. Provisioning and configuration

Configure these values through the deployment secret manager. Do not commit real values:

| Variable | Purpose |
|---|---|
| `PLATFORM_ADMIN_DATABASE_URL` | Dedicated database runtime role |
| `PLATFORM_ADMIN_MIGRATION_DATABASE_URL` | Dedicated database migration/bootstrap role |
| `PLATFORM_ADMIN_OIDC_ISSUER` | Exact OIDC issuer identifier |
| `PLATFORM_ADMIN_OIDC_CLIENT_ID` | Confidential OIDC client ID / expected audience |
| `PLATFORM_ADMIN_OIDC_CLIENT_SECRET` | Confidential OIDC client secret |
| `PLATFORM_ADMIN_OIDC_MFA_AMR_VALUES` | Accepted ID-token AMR values; defaults to `mfa` |
| `PLATFORM_ADMIN_OIDC_REQUIRED_ACR_VALUES` | Optional comma-separated ACR values requested and required in the ID token |
| `PLATFORM_ADMIN_OIDC_REDIRECT_URI` | Exact registered callback URI: `/api/platform-admin/auth/callback` |
| `PLATFORM_ADMIN_OIDC_TRANSACTION_SECRET` | At least 32 random characters used to encrypt PKCE verifiers and derive rate-limit keys |
| `PLATFORM_ADMIN_AUDIT_SUBJECT_SECRET` | Separate 32+ character key used only for stable audit-subject pseudonyms; keep it unchanged when rotating the OIDC transaction secret |
| `PLATFORM_ADMIN_AUDIT_SUBJECT_KEY_VERSION` | Version label stored with each audit pseudonym, e.g. `v1`; change only as part of a controlled audit-key migration |
| `PLATFORM_ADMIN_SESSION_TTL_SECONDS` | Absolute session lifetime; 300–86400 seconds, default 28800 |

Provision a dedicated database named, for example, `oxenn_platform_admin`. Create separate PostgreSQL roles for migration ownership and runtime access. The migration role must own the database/schema and tables. The runtime role must not own tables or receive DDL privileges. Grant `CONNECT` on the database and `USAGE` on the schema, then apply only the following table/column privileges after migration:

```sql
GRANT SELECT ON platform_admin_accounts,
  platform_admin_external_identities,
  platform_admin_permission_grants,
  platform_admin_sessions,
  platform_admin_oidc_transactions
TO platform_admin_runtime;
GRANT UPDATE (last_authenticated_at)
  ON platform_admin_external_identities TO platform_admin_runtime;
GRANT INSERT (account_id, external_identity_id, audience, token_hash, expires_at)
  ON platform_admin_sessions TO platform_admin_runtime;
GRANT UPDATE (last_seen_at, revoked_at)
  ON platform_admin_sessions TO platform_admin_runtime;
GRANT INSERT, DELETE ON platform_admin_oidc_transactions TO platform_admin_runtime;
GRANT INSERT ON platform_admin_audit_events TO platform_admin_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON platform_admin_auth_rate_limits TO platform_admin_runtime;
```

Do not grant the runtime role write access to accounts, external identities (other than `last_authenticated_at`), permission grants, or the migration ledger. Do not grant broad default DML privileges; each future migration must explicitly review and grant only the additional runtime permissions it needs. In production, both Platform Admin database URLs must include `sslmode=require`, `verify-ca`, or `verify-full`.

After provisioning the database and configuring both URLs, generate any new migration from the dedicated Drizzle schema with:

```bash
pnpm run platform-admin:generate
```

Review the generated SQL and snapshot, then apply it with:

```bash
pnpm run platform-admin:migrate
```

The Platform Admin uses the repository's Drizzle migration engine with a separate `drizzle.platform-admin.config.ts`, schema file, output directory, and migration-history table. Both `PLATFORM_ADMIN_DATABASE_URL` and `PLATFORM_ADMIN_MIGRATION_DATABASE_URL` are required; the guard verifies that they target the same dedicated database but use different PostgreSQL roles. The Platform Admin runner invokes Drizzle with `__platform_admin_drizzle_migrations`, holds a PostgreSQL advisory lock on the same dedicated connection across migration-history reads and application, and reads only `PLATFORM_ADMIN_MIGRATION_DATABASE_URL`. This reuses the existing migration framework without sharing the Workspace schema, migration directory, history table, or connection string. Do not use `pnpm db:migrate` for this control plane: the Workspace config and runner are bound to Workspace database settings and could otherwise apply DDL to the wrong database.

### First administrator bootstrap

The first account must be provisioned by an operator after the OIDC provider registration and database migration are complete. Supply the following temporary environment values for a single invocation:

```bash
PLATFORM_ADMIN_BOOTSTRAP_ISSUER=https://your-exact-issuer
PLATFORM_ADMIN_BOOTSTRAP_SUBJECT=the-immutable-oidc-subject
PLATFORM_ADMIN_BOOTSTRAP_DISPLAY_NAME=Platform Operator
PLATFORM_ADMIN_BOOTSTRAP_PERMISSIONS=admin:read,audit:read
pnpm run platform-admin:bootstrap
```

`PLATFORM_ADMIN_BOOTSTRAP_ISSUER` must exactly match `PLATFORM_ADMIN_OIDC_ISSUER`. Use the immutable subject from the provider's verified identity record, not an email address. The bootstrap command refuses to run if any Platform Admin account already exists, takes an advisory lock, and writes the account, identity, explicit grants, and audit event in one transaction. Remove the temporary bootstrap variables immediately after the command succeeds. Subsequent account and grant lifecycle operations require a separately reviewed administrative workflow; no public self-provisioning endpoint exists.

## 5. Current activation boundary

The repository contains the OIDC login, callback, and logout endpoints, the trusted server-only identity provider, the exact-permission authorization guard, the isolated schema, and separate migration/bootstrap commands. Unit tests use mocked OIDC and persistence boundaries.

No real OIDC provider is selected or configured in the repository. Before activation, verify that the chosen provider enforces MFA and emits the configured AMR/ACR claims in the ID token. No dedicated database has been provisioned or connected, no migration has been applied, and no first administrator has been bootstrapped. Therefore the runtime remains fail-closed until those deployment steps are completed. The existing `AdminAPIClient` and CQRS handlers are not yet wired to this identity boundary; adding or exposing Platform Admin business operations requires a separate route/handler authorization review.
