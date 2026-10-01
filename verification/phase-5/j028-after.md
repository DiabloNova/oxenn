=== AUTH-03 SYSTEM CONTEXT DB CLIENT RUNTIME PROBE ===
DATABASE_URL set to: postgres://postgres:postgres@localhost:5432/oxenn_test

1. Direct TenantContextManager.runWithSystemContext & getDbClient():
[SystemContext] Leasing client for purpose: test-req
   TenantContextManager.getDbClient() returned: [object Object]

Testing registerAction('Probe', 'probe@example.com'):
[SystemContext] Leasing client for purpose: sys-register
   Result: WORKS -> { ... }

Testing loginAction('probe@example.com'):
[SystemContext] Leasing client for purpose: sys-login
   Result: WORKS -> { ... }

Testing requireWorkspaceMembership('usr-123', 'ws-123'):
[SystemContext] Leasing client for purpose: sys-auth-check
   Result: WORKS -> undefined

Testing requireRole('workspace_admin', 'ws-123'):
[SystemContext] Leasing client for purpose: sys-auth-role-check
   Result: WORKS -> undefined

Testing authorizeApiRequest(req with headers):
[SystemContext] Leasing client for purpose: sys-auth-api-check
   Result: WORKS -> undefined

Testing createWorkspaceAction('New Workspace'):
[SystemContext] Leasing client for purpose: sys-create-workspace
   Result: WORKS -> { ... }

Testing listWorkspacesAction():
[SystemContext] Leasing client for purpose: sys-list-workspaces
   Result: WORKS -> [ ... ]

Testing acceptInvitationAction('test-token'):
[SystemContext] Leasing client for purpose: sys-accept-invitation
   Result: WORKS -> { ... }

Testing switchWorkspaceAction('ws-456'):
[SystemContext] Leasing client for purpose: sys-switch-workspace
   Result: WORKS -> undefined

Testing inviteUserAction('ws-123', 'invited@example.com', 'viewer'):
[SystemContext] Leasing client for purpose: sys-auth-check
[SystemContext] Leasing client for purpose: sys-auth-role-check
   Result: WORKS -> undefined

Testing removeMemberAction('ws-123', 'usr-456'):
[SystemContext] Leasing client for purpose: sys-auth-check
[SystemContext] Leasing client for purpose: sys-auth-role-check
   Result: WORKS -> undefined

Testing updateMemberRoleAction('ws-123', 'usr-456', 'workspace_admin'):
[SystemContext] Leasing client for purpose: sys-auth-check
[SystemContext] Leasing client for purpose: sys-auth-role-check
   Result: WORKS -> undefined
