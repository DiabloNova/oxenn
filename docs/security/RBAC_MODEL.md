# Role-Based Access Control (RBAC) Model

This document describes Workspace RBAC and the separately defined Platform Admin RBAC. They have different principals, role authorities, scopes, and enforcement status. There is no implicit mapping between them.

## 1. Workspace RBAC

### Roles

The Workspace role union in `src/types/auth.ts` defines:

| Role | Intended scope | Current authority |
|---|---|---|
| `viewer` | Read-oriented access in a workspace | `organization_members.role` |
| `workspace_admin` | Administrative access in a workspace | `organization_members.role` |
| `super_admin` | Operator-only cross-workspace override | `organization_members.role` on the authenticated user's active workspace |

The Workspace `super_admin` role is not the Platform Admin `Super Admin` role. Per `AGENTS.md`, only the dedicated `scripts/auth/grant-super-admin.ts` operator tool may assign it; normal application flows must not grant it. The authorization code treats an active-workspace membership with this role as an override for workspace membership checks. This is a broad operator capability, not an ordinary customer workspace role.

### Identity, persistence, and enforcement

- **Identity:** the server-validated session returned by the auth session layer.
- **Role source:** the membership row in `organization_members`; the server helpers query the role instead of trusting a session snapshot.
- **Scope:** the requested organization/workspace, with the explicit operator override described above.
- **Evaluator:** `requireWorkspaceMembership` and `requireRole` in `src/services/auth/authorization.ts`.
- **Enforcement boundary:** server routes/actions must call the relevant helpers before accessing or mutating workspace resources. The existence of the helpers alone is not evidence that every boundary is covered.
- **Status:** implemented as repository-level server-side authorization logic; not independently verified against a deployed database in this work.

## 2. Platform Admin RBAC

### Defined roles versus effective grants

The Platform Admin domain in `src/features/admin/domain/types.ts` retains seven legacy internal role names. The older numeric role hierarchy and role-permission map in `src/features/admin/security/index.ts` are not used by the new server-side Platform Admin boundary. Stage 2 stores direct, explicit permission grants against a canonical Platform Admin account. The guard accepts only exact known permission keys; it does not derive permissions from role names, hierarchy, wildcard values, Workspace roles, or caller-supplied actor fields.

### Identity and enforcement boundary

Stage 1 added `src/features/admin/security/platform-admin.server.ts`, a server-only default-deny resolver and exact-permission guard. The exported resolver accepts no provider parameter. Stage 2 adds a provider-agnostic OIDC Authorization Code flow with PKCE S256, state, nonce, issuer/audience/signature/expiry validation, browser-bound one-time transactions, and opaque database-backed sessions. External identity is keyed by `(issuer, subject)`, not email. Unknown or inactive identities are denied; login does not create accounts or grants.

The OIDC login, callback, and logout endpoints are under `src/app/api/platform-admin/auth/`. The legacy `AdminAPIClient` still accepts actor data as method arguments and has not been wired to the new principal or guard. No Platform Admin business-operation route is exposed by this change. Authentication endpoints must not be treated as evidence that the older admin CQRS handlers are protected.

### Persistence isolation

The new tables live in a dedicated Platform Admin PostgreSQL database and are created by `database/platform-admin/migrations/0001_platform_admin_control_plane.sql`. Runtime access uses `PLATFORM_ADMIN_DATABASE_URL`; migration and first-admin bootstrap use `PLATFORM_ADMIN_MIGRATION_DATABASE_URL` with a different PostgreSQL role. The database URL guard rejects reuse of the Workspace, migration, or authenticator database. No fallback to Workspace connection variables exists.

The schema stores accounts, `(issuer, subject)` external identities, explicit permission grants, hashed sessions, OIDC transactions, audit events, and its own migration ledger. The legacy `admin_users`, `roles`, and `permissions` tables remain frozen and are not used as the new authority source. No dedicated database has been provisioned or connected, no migration has been applied, and no first administrator has been bootstrapped. The runtime therefore remains fail-closed until the required deployment configuration and provisioning steps are completed.

## 3. Status matrix

| Dimension | Workspace RBAC | Platform Admin RBAC |
|---|---|---|
| Role definitions | Implemented in `src/types/auth.ts` | Seven legacy names remain defined; not used as the new grant authority |
| Authoritative identity | Server-validated Workspace session | Validated OIDC identity keyed by `(issuer, subject)` and an active dedicated account |
| Permission authority | `organization_members.role` | Explicit `platform_admin_permission_grants` rows in the isolated Platform Admin database |
| Persistence | Workspace membership schema | Dedicated Platform Admin schema and migration artifact; deployed database not verified |
| Evaluator | Server-side `requireRole` and `requireWorkspaceMembership` | Server-only default-deny principal resolver and exact-permission guard |
| Authentication entrypoint | Workspace session layer | OIDC login/callback/logout endpoints; disabled until deployment configuration is complete |
| Business-operation enforcement | Workspace server helpers; route coverage must be assessed per boundary | Existing admin CQRS handlers are not yet wired to the new guard; no business-operation route is exposed by this change |
| Current status | Implemented in repository code; deployed DB not verified | Authentication/persistence code implemented; runtime activation and business-route integration pending |
| Test evidence | Workspace auth tests cover server-side identity and membership cases | Unit tests cover guard, OIDC checks, unprovisioned identities, and database separation; no live provider/database integration |

## 4. Required separation rules

1. A Workspace `workspace_admin` or `viewer` must never gain Platform Admin permissions through role-name mapping, rank comparison, or caller-supplied fields.
2. A Platform Admin role must never create customer workspace membership or bypass Workspace membership checks.
3. Workspace `super_admin` must remain an operator-only override and must not be conflated with Platform Admin `Super Admin`.
4. Every Platform Admin route and handler must eventually authenticate its principal on the server, load authoritative role/permission data, enforce resource scope, and deny requests that supply their own actor role.
5. Keep the seven-role list as a description of the currently defined internal model, not as evidence that all roles are operational. Revisit whether Finance, Support, Operations, and Auditor permissions need a non-linear permission matrix before implementing the model; this documentation change does not alter that code.

## 5. Test coverage and limitations

The Stage 2 unit tests cover the default-deny principal boundary, caller-provider injection resistance, OIDC state/nonce/PKCE construction, browser binding, issuer and audience mismatch rejection, HTTPS endpoint enforcement, unprovisioned identity denial, and dedicated database URL separation. Targeted TypeScript checking covers the Stage 2 routes, persistence layer, migration/bootstrap scripts, and tests.

The following integration work remains necessary before Platform Admin can be described as operational in production:

- configure and register the actual OIDC issuer/client and verify the provider's MFA policy;
- provision the dedicated Platform Admin database and separate migration/runtime roles;
- apply the isolated migration and explicitly bootstrap the first immutable `(issuer, subject)` identity;
- verify real OIDC login, callback, session revocation, and grant changes against the provider and database;
- wire every intended Platform Admin business route/handler to the server-only guard and verify resource scope;
- add end-to-end negative tests proving Workspace roles and caller-supplied actor fields cannot authorize Platform Admin actions;
- pass the full repository CI and independent security review on the final PR head.

No live provider, database, migration, bootstrap, or deployment action has been performed. The OIDC and persistence tests use mocks and do not prove production configuration or deployed state.
