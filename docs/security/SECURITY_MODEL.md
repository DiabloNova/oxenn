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

## 3. Platform Admin authorization

### Separate intended context

The Platform Admin domain in `src/features/admin/domain/types.ts` defines seven internal roles:

- `Super Admin`
- `Platform Admin`
- `Security Auditor`
- `Operations`
- `Finance`
- `Support`
- `Read-Only Observer`

It also defines a separate permission vocabulary and role-to-permission map in `src/features/admin/security/index.ts`. These definitions describe the intended internal administration model; they do not create Workspace membership and are not derived from `organization_members.role`.

### Current implementation boundary

The repository currently contains authorization helper classes such as `PermissionChecker` and `AdminAuthorizationGuard`. They evaluate a supplied role or `AdminUser` object. They do not independently authenticate an administrator or resolve a trusted actor from a server session. The application handlers accept actor fields, including `actorRole`, in command inputs; the inspected handlers do not establish a server-authenticated Platform Admin principal before acting.

The `AdminAPIClient` in `src/features/admin/api/v1/admin/index.ts` describes itself as a mock API client over an in-memory store, but its constructor wires PostgreSQL-backed CQRS handlers and repository adapters. `PostgresAdminUserRepository` issues SQL read queries but ignores their returned rows and obtains returned administrator records from a static in-memory `Map`; its write paths issue SQL through `PostgresClient`. The client methods accept actor data as arguments; it is not a Next.js route handler. No corresponding Platform Admin route was found under `src/app/api` in the inspected tree. Therefore the current repository does not demonstrate a production-exposed, server-authenticated Platform Admin authorization boundary.

### Persistence status

The schema source declares `admin_users` with a `role_id` foreign key to `roles`, and `permissions` with a `role_id` relationship. The schema also explicitly labels `roles` and `permissions` as frozen legacy structures that are no longer used for authorization decisions, and identifies `organization_members.role` as the Workspace authorization source.

The current `PostgresAdminUserRepository` does not provide a reliable database-backed Platform Admin role authority:

- Read queries are issued, but their returned rows are not used to construct the returned administrator records; the repository reads from a static in-memory map.
- Write queries refer to `admin_users.role`, `permissions`, and `sso_identities` columns that do not match the declared `admin_users.role_id` schema and normalized role/permission relationships.
- SSO-related domain fields do not, by themselves, establish a working identity federation or authentication flow.

The schema declarations are source-code definitions only. No database is connected to this repository, and no deployed database state or migration execution has been inspected as part of this documentation work.

## 4. Cross-context security rules

1. Workspace roles never imply Platform Admin roles or permissions.
2. Platform Admin role definitions never create or imply customer workspace membership.
3. Do not accept `actorRole`, a role name, or a permission list from an untrusted request as proof of administrator identity.
4. Platform Admin actions require a separately authenticated server-side administrative principal, explicit scope checks, and permission evaluation at the actual route/handler boundary before that context can be described as enforced.
5. Keep the Workspace `super_admin` operator override distinct from the Platform Admin `Super Admin` role. Any future mapping would require a deliberate, audited design and separate approval.

## 5. Related specifications

- [Security Documentation](./README.md)
- [RBAC Model](./RBAC_MODEL.md)
- [Privileged Paths](./privileged-paths.md)
