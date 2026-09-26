# AUTH-03 System-Context DB Client Runtime Probe

## Headline Verdict
**AUTH-03 CONFIRMED-BROKEN**

Every probed server action and authorization check attempting database access within `runWithSystemContext` fails unconditionally at runtime with `Error: Failed to get DB client in system context`.

---

## Executive Summary
Static analysis identified a fundamental runtime contradiction in the database execution context design:
1. `TenantContextManager.runWithSystemContext()` explicitly constructs a context where `dbClient` is undefined (`tenantId: null`, `userId`, `requestId`, `executionMode: "system"`).
2. `TenantContextManager.getDbClient()` returns `ctx.dbClient || null`. Because `dbClient` is never populated by `runWithSystemContext()`, `getDbClient()` returns `null` inside any `runWithSystemContext()` callback.
3. Key critical authentication and authorization paths in the application—including authentication actions (`loginAction`, `registerAction`), authorization helpers (`requireWorkspaceMembership`, `requireRole`, `authorizeApiRequest`), and workspace server actions (`createWorkspaceAction`, `listWorkspacesAction`, `acceptInvitationAction`, `switchWorkspaceAction`)—call `TenantContextManager.getDbClient()` while inside `runWithSystemContext()` and throw `Error: Failed to get DB client in system context` when `null` is returned.

This probe script (`verification/phase-0/probe-system-context.ts`) executed every target path directly at runtime and proved that **100% of these calls throw**.

---

## Per-Function Verdicts

| # | Function | Context / Call Site | Status | Exact Observed Error / Output | Throw Site |
|---|---|---|---|---|---|
| 1 | `TenantContextManager.getDbClient()` | `TenantContextManager.runWithSystemContext()` | WORKS (returns null) | `TenantContextManager.getDbClient() returned: null` | N/A |
| 2 | `registerAction('Probe', 'probe@example.com')` | `src/app/actions/auth.ts:61` | **THROWS** | `Error: Failed to get DB client in system context` | `src/app/actions/auth.ts:61:15` |
| 3 | `loginAction('probe@example.com')` | `src/app/actions/auth.ts:18` | **THROWS** | `Error: Failed to get DB client in system context` | `src/app/actions/auth.ts:18:15` |
| 4 | `requireWorkspaceMembership('usr-123', 'ws-123')` | `src/services/auth/authorization.ts:39` | **THROWS** | `Error: Failed to get DB client in system context` | `src/services/auth/authorization.ts:39:17` |
| 5 | `requireRole('workspace_admin', 'ws-123')` | `src/services/auth/authorization.ts:73` | **THROWS** | `Error: Failed to get DB client in system context` | `src/services/auth/authorization.ts:73:21` |
| 6 | `authorizeApiRequest(req)` | `src/services/auth/authorization.ts:129` | **THROWS** | `Error: Failed to get DB client in system context` | `src/services/auth/authorization.ts:129:17` |
| 7 | `createWorkspaceAction('New Workspace')` | `src/app/actions/workspace.ts:21` | **THROWS** | `Error: Failed to get DB client in system context` | `src/app/actions/workspace.ts:21:24` |
| 8 | `listWorkspacesAction()` | `src/app/actions/workspace.ts:46` | **THROWS** | `Error: Failed to get DB client in system context` | `src/app/actions/workspace.ts:46:24` |
| 9 | `acceptInvitationAction('test-token')` | `src/app/actions/workspace.ts:112` | **THROWS** | `Error: Failed to get DB client in system context` | `src/app/actions/workspace.ts:112:24` |
| 10 | `switchWorkspaceAction('ws-456')` | `src/services/auth/authorization.ts:39` | **THROWS** | `Error: Failed to get DB client in system context` | `src/services/auth/authorization.ts:39:17` (via `requireWorkspaceMembership`) |
| 11 | `inviteUserAction('ws-123', 'invited@example.com', 'viewer')` | `src/services/auth/authorization.ts:39` | **THROWS** | `Error: Failed to get DB client in system context` | `src/services/auth/authorization.ts:39:17` (via `requireWorkspaceMembership`) |
| 12 | `removeMemberAction('ws-123', 'usr-456')` | `src/services/auth/authorization.ts:39` | **THROWS** | `Error: Failed to get DB client in system context` | `src/services/auth/authorization.ts:39:17` (via `requireWorkspaceMembership`) |
| 13 | `updateMemberRoleAction('ws-123', 'usr-456', 'workspace_admin')` | `src/services/auth/authorization.ts:39` | **THROWS** | `Error: Failed to get DB client in system context` | `src/services/auth/authorization.ts:39:17` (via `requireWorkspaceMembership`) |

---

## Raw Execution Transcript

Command executed: `npx tsx verification/phase-0/probe-system-context.ts`

```text
=== AUTH-03 SYSTEM CONTEXT DB CLIENT RUNTIME PROBE ===
DATABASE_URL set to: postgres://postgres:postgres@localhost:5432/oxenn_test

1. Direct TenantContextManager.runWithSystemContext & getDbClient():
   TenantContextManager.getDbClient() returned: null

Testing registerAction('Probe', 'probe@example.com'):
   Result: THROWS -> "Failed to get DB client in system context"
   Throw site: at <anonymous> (/app/src/app/actions/auth.ts:61:15)

Testing loginAction('probe@example.com'):
   Result: THROWS -> "Failed to get DB client in system context"
   Throw site: at <anonymous> (/app/src/app/actions/auth.ts:18:15)

Testing requireWorkspaceMembership('usr-123', 'ws-123'):
   Result: THROWS -> "Failed to get DB client in system context"
   Throw site: at <anonymous> (/app/src/services/auth/authorization.ts:39:17)

Testing requireRole('workspace_admin', 'ws-123'):
   Result: THROWS -> "Failed to get DB client in system context"
   Throw site: at <anonymous> (/app/src/services/auth/authorization.ts:73:21)

Testing authorizeApiRequest(req with headers):
   Result: THROWS -> "Failed to get DB client in system context"
   Throw site: at <anonymous> (/app/src/services/auth/authorization.ts:129:17)

Testing createWorkspaceAction('New Workspace'):
   Result: THROWS -> "Failed to get DB client in system context"
   Throw site: at <anonymous> (/app/src/app/actions/workspace.ts:21:24)

Testing listWorkspacesAction():
   Result: THROWS -> "Failed to get DB client in system context"
   Throw site: at <anonymous> (/app/src/app/actions/workspace.ts:46:24)

Testing acceptInvitationAction('test-token'):
   Result: THROWS -> "Failed to get DB client in system context"
   Throw site: at <anonymous> (/app/src/app/actions/workspace.ts:112:24)

Testing switchWorkspaceAction('ws-456'):
   Result: THROWS -> "Failed to get DB client in system context"
   Throw site: at <anonymous> (/app/src/services/auth/authorization.ts:39:17)

Testing inviteUserAction('ws-123', 'invited@example.com', 'viewer'):
   Result: THROWS -> "Failed to get DB client in system context"
   Throw site: at <anonymous> (/app/src/services/auth/authorization.ts:39:17)

Testing removeMemberAction('ws-123', 'usr-456'):
   Result: THROWS -> "Failed to get DB client in system context"
   Throw site: at <anonymous> (/app/src/services/auth/authorization.ts:39:17)

Testing updateMemberRoleAction('ws-123', 'usr-456', 'workspace_admin'):
   Result: THROWS -> "Failed to get DB client in system context"
   Throw site: at <anonymous> (/app/src/services/auth/authorization.ts:39:17)
```

---

## Conclusion
The bug AUTH-03 is **100% CONFIRMED-BROKEN**. Any user attempting to log in, register, create/list/switch workspaces, verify membership, or authenticate developer API requests will trigger `Error: Failed to get DB client in system context` because system context does not lease or provide a database client. No application source code under `src/` was modified during this probe task per task instructions.
