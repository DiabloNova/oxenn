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

### Defined roles

The Platform Admin domain in `src/features/admin/domain/types.ts` defines these seven internal roles:

| Role | Defined responsibility |
|---|---|
| `Super Admin` | Highest-level platform administration and controlled overrides |
| `Platform Admin` | Platform and tenant lifecycle administration |
| `Security Auditor` | Security and audit inspection |
| `Operations` | Operational configuration and monitoring |
| `Finance` | Billing and financial administration |
| `Support` | Customer support operations |
| `Read-Only Observer` | Non-mutating platform observation |

The same domain defines permissions such as `tenant:create`, `tenant:write`, `tenant:read`, `admin:write`, `config:write`, `ai:manage`, `audit:read`, `billing:write`, `prompt:manage`, `crawler:manage`, and `system:monitor`.

### Defined evaluator versus effective authorization

`src/features/admin/security/index.ts` defines a numeric role hierarchy, a role-permission map, `PermissionChecker`, `SecurityPolicyEvaluator`, and `AdminAuthorizationGuard`. These are authorization helpers, not a complete identity boundary:

- The helpers evaluate a role string or an `AdminUser` object supplied by their caller.
- They do not authenticate the administrator or load a trusted Platform Admin principal from a server session.
- The application handlers accept actor fields such as `actorId`, `actorEmail`, and `actorRole` in command inputs. The inspected handler methods do not invoke these helpers to authenticate and authorize that actor at the handler boundary.
- The `AdminAPIClient` describes itself as a mock API client over an in-memory store, but its constructor wires PostgreSQL-backed CQRS handlers and repository adapters. `PostgresAdminUserRepository` issues SQL read queries but ignores their returned rows and obtains returned administrator records from a static in-memory `Map`; its write paths issue SQL through `PostgresClient`. The client methods accept actor data as arguments; this client is not a Next.js route handler and does not establish a server-authenticated Platform Admin principal.
- No Platform Admin route handler was found under `src/app/api` in the inspected repository tree.

Consequently, the seven roles and permission evaluator are defined/scaffolded, but the repository does not demonstrate an exposed, server-authenticated Platform Admin enforcement path. The numeric hierarchy and helper methods must not be represented as proof of effective production authorization.

### Persistence contract and mismatch

The schema source declares:

- `admin_users.role_id` referencing `roles.id`;
- `permissions.role_id` referencing `roles.id`;
- a separate `permissions.permission_key` field.

The schema comments explicitly mark `roles` and `permissions` as frozen legacy tables not used for authorization decisions, and identify `organization_members.role` as the current Workspace authorization source.

The current `PostgresAdminUserRepository` is not aligned with this schema contract:

- Read methods execute SQL but use a static in-memory `Map` as the source of returned `AdminUser` records.
- Write methods target `admin_users.role`, `admin_users.permissions`, and `admin_users.sso_identities`, whereas the declared schema uses `role_id` and normalized related tables and does not declare those columns on `admin_users`.
- The repository therefore cannot be described as a functioning database-backed source of Platform Admin roles or permissions.

No database is connected to this repository. The schema is only a code declaration here; deployed database state and applied migrations are unknown and were not accessed.

## 3. Status matrix

| Dimension | Workspace RBAC | Platform Admin RBAC |
|---|---|---|
| Role definitions | Implemented in `src/types/auth.ts` | Defined in domain types |
| Authoritative identity | Server-validated Workspace session | No complete trusted Platform Admin principal demonstrated |
| Role authority | `organization_members.role` | Intended admin model is not reliably persisted/read by current adapter |
| Persistence contract | Workspace membership schema | `admin_users.role_id` and legacy role/permission schema declarations; adapter contract mismatch |
| Evaluator | Server-side `requireRole` and `requireWorkspaceMembership` | Role/permission helper classes exist |
| Enforcement entrypoint | Workspace server helpers; route coverage must be assessed per boundary | Mock API client and handlers accept caller-provided actor fields; no production route found |
| Current status | Implemented in repository code; deployed DB not verified | Defined-only / scaffolded; production enforcement not demonstrated |
| Test evidence | Workspace auth tests cover server-side identity and membership cases | Helper-level tests exist; they do not establish an authenticated production route or DB-backed role enforcement |

## 4. Required separation rules

1. A Workspace `workspace_admin` or `viewer` must never gain Platform Admin permissions through role-name mapping, rank comparison, or caller-supplied fields.
2. A Platform Admin role must never create customer workspace membership or bypass Workspace membership checks.
3. Workspace `super_admin` must remain an operator-only override and must not be conflated with Platform Admin `Super Admin`.
4. Every Platform Admin route and handler must eventually authenticate its principal on the server, load authoritative role/permission data, enforce resource scope, and deny requests that supply their own actor role.
5. Keep the seven-role list as a description of the currently defined internal model, not as evidence that all roles are operational. Revisit whether Finance, Support, Operations, and Auditor permissions need a non-linear permission matrix before implementing the model; this documentation change does not alter that code.

## 5. Test coverage and limitations

Workspace authorization tests provide evidence for server-side session and membership behavior. Platform Admin helper tests exercise helper logic, but helper tests do not prove that an authenticated administrator reaches a production route or that permissions are read from persistent storage. The current admin security tests are not equivalent to end-to-end route/identity/persistence tests.

The following negative integration coverage remains necessary before Platform Admin enforcement can be called implemented:

- a forged or caller-supplied `actorRole` cannot authorize an administrative action;
- Workspace `super_admin` cannot obtain Platform Admin permissions;
- a Platform Admin principal cannot silently obtain Workspace membership;
- inactive, unknown, or revoked admin principals fail closed;
- role and permission changes are loaded from the authoritative persistence source;
- each exposed admin route enforces identity, permission, and resource scope server-side.

No tests were run for this documentation-only change.
