# Security Architecture Model

This document distinguishes the two authorization contexts in Oxenn and describes what the repository currently implements. A role name in one context does not grant a role or permission in the other context.

## 1. Authorization boundaries

Oxenn has two distinct authorization models:

1. **Workspace authorization** governs customer/user access within an organization workspace. Its current role authority is `organization_members.role`.
2. **Platform Admin authorization** is intended for internal platform operations. It has separate domain role and permission definitions, but the current repository does not establish a complete, database-backed administrative identity and enforcement path.

There is no implicit role mapping between these contexts. In particular, Workspace `super_admin` is not the Platform Admin `Super Admin` role. A workspace role must never be interpreted as a platform-administrator principal.

## 2. Workspace authorization

### Roles and scope

The Workspace role type in `src/types/auth.ts` contains:

- `super_admin`
- `workspace_admin`
- `viewer`

The persisted membership role is `organization_members.role`, not a role supplied by a request or trusted solely from a client-side session snapshot.

- **`viewer`**: read-oriented access within a workspace membership.
- **`workspace_admin`**: administrative access within a workspace membership.
- **`super_admin`**: an operator-only override. Repository policy in `AGENTS.md` restricts assignment to `scripts/auth/grant-super-admin.ts`; normal application flows must not mint or assign it. The current authorization implementation checks this role on the authenticated user's active-workspace membership and grants cross-workspace access. It is not a customer-facing workspace administration tier and is not the Platform Admin `Super Admin`.

### Identity and enforcement

The server-side authorization helpers in `src/services/auth/authorization.ts` require a server-validated session and query membership roles through the system database context:

- `requireWorkspaceMembership(userId, workspaceId)` verifies the session user and checks membership; an active-workspace `super_admin` membership is treated as the cross-workspace operator override.
- `requireRole(requiredRole, targetWorkspaceId?)` reads the role from `organization_members` rather than trusting the session role snapshot, then applies the Workspace role hierarchy.
- `authorizeApiRequest` resolves user and tenant identity from the server session. Caller-supplied identity headers are not authoritative.

These helpers provide repository-level server-side enforcement primitives. Their presence does not prove that every route or every operation uses them correctly, nor does static inspection establish the state of a deployed database.

## 3. Product-wide free-service access policy

All Oxenn services, including free Fred Audit / Free Audit, require a registered account and a server-authenticated session. Free-tier access is available only after registration and sign-in; anonymous service execution is not permitted. This is the owner-approved product access rule and applies across product areas, not only to Workspace authorization roles.

**Current repository enforcement:** `src/app/api/v1/audit/free/route.ts` calls `authorizeApiRequest` before parsing the request body, so the endpoint requires a valid server session. It meters 3 attempts per user per UTC month, 10 attempts per trusted Vercel ingress IP per UTC hour, and 500 attempts globally per UTC day. User, IP, and idempotency bucket identifiers are SHA-256 hashes; idempotency reservations are retained only after a successful audit, while rejected and failed requests release the key and failed crawls refund the monthly reservation. A bounded scheduled job removes expired `free-audit-*` counters.

The endpoint uses the internal `HttpCrawlProvider`, not Firecrawl or Gemini. Its crawl policy is limited to one page, 1 MiB response and total-byte budgets, a 20-second duration budget, at most three redirects, and robots-policy enforcement; the shared crawler transport applies SSRF protections. The homepage `FreeAuditPanel` is a separate local synthetic demo and does not call this live endpoint or external providers.

These are repository-level implementation facts, not proof of deployed database state, ingress-header provenance, or production behavior. Those still require authorized staging/production verification.

## 4. Platform Admin authorization

### Separate intended context

The Platform Admin domain in `src/features/admin/domain/types.ts` still defines seven legacy internal role names and the older role-permission map in `src/features/admin/security/index.ts`. Those definitions do not establish a trusted identity and are not used as the authority source by the Stage 1/Stage 2 server-side boundary. Stage 2 uses explicit permission grants attached to a separately provisioned Platform Admin account; it does not infer grants from a role name or numeric hierarchy.

### Trusted identity and session boundary

`src/features/admin/security/platform-admin.server.ts` resolves an opaque principal through a private server-only composition root. The resolver accepts no caller-supplied provider or actor fields and denies access when configuration, identity, account state, or permission data is missing or invalid.

Stage 2 adds a provider-agnostic OpenID Connect Authorization Code flow using `openid-client`, PKCE S256, state, nonce, exact issuer/audience validation, explicit `enableNonRepudiationChecks` signature verification against provider JWKS, an RS256-only protected-header check, and default MFA AMR enforcement with optional ACR policy. The login, callback, and logout handlers live under `src/app/api/platform-admin/auth/`. The callback consumes a short-lived browser-bound transaction and creates an opaque server session only after the verified `(issuer, subject)` pair matches an active, pre-provisioned Platform Admin account. Email and Workspace identity are not used as the account key. Login audit subjects are versioned HMAC pseudonyms of the issuer/subject pair using a dedicated key that is independent of the OIDC transaction-encryption secret; raw external subjects are not stored, transaction-secret rotation does not change historical audit correlation, and each denied callback produces one audit event. No just-in-time account provisioning occurs.

The existing `AdminAPIClient` in `src/features/admin/api/v1/admin/index.ts` still accepts actor data as method arguments. Its constructor wires PostgreSQL-backed CQRS handlers and repository adapters, while `PostgresAdminUserRepository` ignores returned SQL read rows and obtains administrator records from a static in-memory `Map`; its write paths issue SQL through `PostgresClient`. It is not a Next.js route handler and has not been wired to the new Platform Admin principal or guard. The Stage 2 authentication endpoints therefore do not imply that existing admin business operations are exposed or protected.

### Isolated persistence

Stage 2 adds a separate Platform Admin Drizzle schema in `database/platform-admin/schema/index.ts` and generated migrations in `database/platform-admin/drizzle/`. A dedicated `drizzle.platform-admin.config.ts` and `scripts/platform-admin/migrate.ts` use the existing Drizzle migration framework with a separate `__platform_admin_drizzle_migrations` history table and a PostgreSQL advisory lock held across the full migration operation. Runtime access uses `PLATFORM_ADMIN_DATABASE_URL`; migration and bootstrap operations use `PLATFORM_ADMIN_MIGRATION_DATABASE_URL`. Both must target the same dedicated database, distinct from Workspace and authenticator databases, and use different PostgreSQL roles. The runtime has no fallback to `DATABASE_URL`, `MIGRATION_DATABASE_URL`, or `AUTHENTICATOR_DATABASE_URL`.

No real OIDC provider is configured, no dedicated database has been provisioned or connected, and no migration or first-admin bootstrap has been run. The code remains fail-closed until deployment configuration and controlled provisioning are complete. The older `admin_users`, `roles`, and `permissions` schema remains frozen legacy data and is not used by the new boundary.

## 5. Cross-context security rules

1. Workspace roles never imply Platform Admin roles or permissions.
2. Platform Admin role definitions never create or imply customer workspace membership.
3. Do not accept `actorRole`, a role name, or a permission list from an untrusted request as proof of administrator identity.
4. Platform Admin actions require a separately authenticated server-side administrative principal, explicit scope checks, and permission evaluation at the actual route/handler boundary before that context can be described as enforced.
5. Keep the Workspace `super_admin` operator override distinct from the Platform Admin `Super Admin` role. Any future mapping would require a deliberate, audited design and separate approval.

## 6. Related specifications

- [Security Documentation](./README.md)
- [RBAC Model](./RBAC_MODEL.md)
- [Privileged Paths](./privileged-paths.md)
