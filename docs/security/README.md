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
The canonical Drizzle schema and active migration journal are checked by the tenant ownership and RLS migration verifiers. For the current per-table repository inventory—including ownership, declared policy objects, complete tenant-policy coverage, ENABLE/FORCE migration coverage, and the runtime-verification boundary—see the generated [Database Reference Matrix](../database/reference-matrix.md) and the [Canonical Data Contract](../database/canonical-data-contract.md). The canonical transaction-local setting is `app.current_tenant_id`. Static schema and migration checks do not establish the state of a deployed database; runtime enforcement is exercised by the PostgreSQL isolation suite against disposable CI PostgreSQL.
*Status: Implemented*

### Cache Security
The cache layer is secured against client-side tenantId spoofing by validating that any requested key's tenant ID strictly matches the server-verified active session user's workspace ID, throwing a security violation on mismatch.
*Status: Implemented*

### Server Actions Validation
The server-side authentication system prevents client-side identity fabrication or signing oracle vulnerabilities by resolving user objects, roles, and workspace IDs strictly on the server inside `loginAction` and `registerAction`, accepting only simple inputs from the client.
*Status: Implemented*

## Detailed Security Specifications
- [Security Model Overview](./SECURITY_MODEL.md)
- [RBAC Model Specification](./RBAC_MODEL.md)
