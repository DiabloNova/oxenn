# Security Documentation

This section describes the security model and critical mechanisms in Seorchable.

## Status Dictionary
- **Implemented**: Security mechanism is enforced in the current codebase.

## Core Security Mechanisms

### Server-Side Identity Boundary
The server-side identity boundary is fully hardened. Plain-text `user_id` and `tenant_id` cookies are strictly non-authoritative on the server. The comprehensive security suite validates resilience against user/tenant cookie tampering, spoofing, and session forgery.
*Status: Implemented*

### Authentication and Authorization
The `AuthProvider` stores user session credentials client-side for UI mocking purposes, but the client synchronizes this state from the server session (`getServerSessionAction`) on mount. Server-side Role-Based Access Control (RBAC) hierarchy and workspace membership validation rules are managed in `src/services/auth/authorization.ts` through `requireWorkspaceMembership(userId, workspaceId)` and `requireRole(requiredRole)`.
*Status: Implemented*

### Multi-Tenant Isolation & Row-Level Security (RLS)
The canonical Drizzle schema models 70 tables across the system. Of these, 51 tenant-scoped tables carry explicit `pgPolicy` Row-Level Security (RLS) definitions. The checked-in `database/drizzle/0005_force_rls.sql` migration enables and forces RLS for the same 51-table set, matching both the latest Drizzle snapshot and the generated runtime tenant-table list. Tenant scoping enforces transaction-local `SET LOCAL app.current_tenant_id = $1` inside active transactions, guaranteeing leased PostgreSQL clients are released securely. Fallbacks explicitly fail closed when database connections or queries fail.
*Status: Implemented*

### Environment and Database Credential Boundaries
Staging and production configuration rejects placeholder/weak session secrets, loopback PostgreSQL defaults, known superuser role names, missing authenticator/migration role URLs, and duplicate runtime/authenticator/migration role identities. Runtime and authenticator pool leases, and migration execution, verify that the connected database role is not a PostgreSQL superuser. Local PostgreSQL examples remain available only under an explicit development environment.
*Status: Implemented*

## Detailed Security Specifications
- [Security Model Overview](./SECURITY_MODEL.md)
- [RBAC Model Specification](./RBAC_MODEL.md)
- [Secure Environment Configuration](./environment-configuration.md)
