# Privileged Database Paths

This document outlines all permitted explicit system-context leases (`runWithSystemContext`) that allow querying the database without a bound `tenant_id`.

| Purpose Tag | Allowed Tables | Caller Module | Justification |
| :--- | :--- | :--- | :--- |
| **sys-login** | `users`, `tenants`, `tenant_users` | `src/app/actions/auth.ts` | Requires user lookup across all tenants during authentication. |
| **sys-register** | `users`, `tenants`, `tenant_users` | `src/app/actions/auth.ts` | Creates the initial user and tenant. |
| **sys-auth-check** | `users` | `src/services/auth/authorization.ts` | Verifies user existence/status globally. |
| **sys-auth-role-check** | `tenant_users`, `roles` | `src/services/auth/authorization.ts` | Checks cross-tenant roles without a specific tenant lease. |
| **sys-auth-api-check** | `users` | `src/services/auth/authorization.ts` | Verifies API user existence globally. |
| **sys-create-workspace** | `tenants`, `tenant_users` | `src/app/actions/workspace.ts` | Creates a new tenant and assigns the user. |
| **sys-list-workspaces** | `tenants`, `tenant_users` | `src/app/actions/workspace.ts` | Fetches all tenants a user belongs to. |
| **sys-accept-invitation** | `tenant_invitations`, `tenant_users` | `src/app/actions/workspace.ts` | Resolves a cross-tenant invitation. |
| **sys-switch-workspace** | `tenant_users`, `roles` | `src/app/actions/workspace.ts` | Fetches user roles for target workspace before leasing. |
| **sys-api-key-auth** | `api_keys`, `tenants` | `src/features/public-api/services/api-service.ts` | Looks up API key across tenants to establish identity. |
| **sys-admin-run** | `*` | `tests/**` | System administrator/test runner privilege context for executing test suites. |
| **test-req** | `*` | `verification/**` | System context test tag for verification probe. |
