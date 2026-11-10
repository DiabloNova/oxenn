# Security Documentation

This section documents Oxenn's security boundaries, authorization models, and implementation status. It distinguishes repository-level code from capabilities that are only defined or scaffolded. Static source declarations do not prove deployed runtime state.

## Status dictionary

- **Implemented**: the repository contains an enforcement path for the described boundary. This does not, by itself, prove deployed configuration or database state.
- **Defined-only**: types, schema declarations, permission names, or policy intent exist, but a complete enforcement path is not demonstrated.
- **Scaffolded**: helper classes or partial application components exist, but they are not wired into a complete authenticated runtime boundary.
- **Not exposed**: no production route or public entrypoint for the capability was found in the inspected route tree.
- **Unknown**: evidence is insufficient to establish runtime or deployment state.

## Authorization domains

Oxenn contains two distinct authorization contexts. They must not be conflated.

### Workspace RBAC

Workspace roles are `super_admin`, `workspace_admin`, and `viewer`. Their persisted authority is `organization_members.role`. The server-side helpers in `src/services/auth/authorization.ts` resolve the authenticated session and query membership roles.

The Workspace `super_admin` role is an operator-only cross-workspace override. Repository policy restricts assignment to `scripts/auth/grant-super-admin.ts`; normal application flows must not grant it. It is not the Platform Admin `Super Admin` role.

*Status: Implemented as repository-level server-side authorization logic. Deployed database state is not verified.*

### Platform Admin RBAC

The separate Platform Admin domain defines seven internal roles and a permission map in `src/features/admin/domain/types.ts` and `src/features/admin/security/index.ts`. Helper classes can evaluate supplied role and user objects, but they do not establish a trusted administrator identity. The application handlers accept actor fields as command inputs, and the inspected Admin API client is a mock client over an in-memory store. No Platform Admin production route was found under `src/app/api`.

The schema declares `admin_users.role_id` and normalized `roles`/`permissions` relationships, while the current admin repository reads returned records from an in-memory map and writes columns that do not match the declared schema. The schema also labels `roles` and `permissions` as frozen legacy structures not used for authorization decisions.

*Status: Role definitions are defined-only; evaluator and application pieces are scaffolded; a production-exposed, server-authenticated Platform Admin enforcement path is not demonstrated (not exposed in the inspected route tree).*

### Cross-context rule

A Workspace role never implies a Platform Admin role or permission. A Platform Admin role never implies customer Workspace membership. Do not accept a caller-supplied role or permission list as proof of identity. Any future mapping requires a deliberate, audited design.

## Other security mechanisms

### Server-side identity boundary

Workspace API identity is resolved from the server-validated session by `authorizeApiRequest`; caller-supplied identity headers are not authoritative.

*Status: Implemented in the inspected Workspace authorization helper; coverage must still be verified at each route boundary.*

### Multi-tenant isolation and row-level security

The repository contains tenant-scoped schema and migration verification tooling, including the canonical transaction-local setting `app.current_tenant_id`. Static schema and migration checks do not establish deployed database state. No database is connected to this repository, and this documentation task does not inspect or change one.

*Status: Repository checks and code are present; deployed database enforcement is unknown.*

### Cache security and server actions

The repository contains tenant/session checks for cache access and server-side identity resolution in authentication actions.

*Status: Implemented in repository code as described by the relevant source; not a claim about deployed runtime state.*

## Detailed specifications

- [Security Model Overview](./SECURITY_MODEL.md)
- [RBAC Model Specification](./RBAC_MODEL.md)
- [Privileged Paths](./privileged-paths.md)
- [Database Reference Matrix](../database/reference-matrix.md)
- [Canonical Data Contract](../database/canonical-data-contract.md)

## Verification boundary

This documentation update is limited to source inspection. No database was connected or queried, no migration was applied or modified, and no tests or deployment checks were run. Platform Admin runtime enforcement remains a separate technical remediation requiring its own approved scope.
