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

The older seven-role hierarchy and helper classes in `src/features/admin/security/index.ts` remain defined/scaffolded and are not the authority source for the new boundary. Stage 1 added a server-only, default-deny principal resolver and exact-permission guard. Stage 2 adds provider-agnostic OIDC login/callback/logout endpoints, browser-bound state/nonce/PKCE S256 transactions, opaque hashed sessions, and a separate Platform Admin persistence model. Accounts are keyed by the exact `(issuer, subject)` pair and receive only explicit permission grants; login never auto-provisions an account.

The `AdminAPIClient` and its CQRS handlers remain separate legacy scaffolding. The client accepts actor data as method arguments, and the handlers have not yet been wired to the new guard. The OIDC endpoints authenticate identities but do not expose Platform Admin business operations.

*Status: Authentication and persistence code are implemented in the repository; production activation is pending a dedicated database, OIDC provider registration, secrets, migration, and controlled first-admin bootstrap. No live database or provider has been configured or accessed.*

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
- [Platform Admin Authentication](./PLATFORM_ADMIN_AUTHENTICATION.md)
- [Privileged Paths](./privileged-paths.md)
- [Database Reference Matrix](../database/reference-matrix.md)
- [Canonical Data Contract](../database/canonical-data-contract.md)

## Verification boundary

Stage 2 unit tests cover the server-only authorization boundary, OIDC transaction construction and validation, unprovisioned identity denial, and dedicated database URL separation. Targeted TypeScript checking has also been run. Full repository CI and independent review remain required for the final PR head. No live OIDC provider or database was connected, no migration was executed, and no first administrator was provisioned. Production activation and wiring of Platform Admin business operations remain separate steps.
