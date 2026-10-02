export type PrivilegedPurposeTag =
  | "sys-login"
  | "sys-register"
  | "sys-auth-check"
  | "sys-auth-role-check"
  | "sys-auth-api-check"
  | "sys-create-workspace"
  | "sys-list-workspaces"
  | "sys-accept-invitation"
  | "sys-switch-workspace"
  | "sys-api-key-auth"
  | "sys-admin-run"
  | "test-req";

export interface PrivilegedPathInfo {
  allowedTables: string[];
  callerModule: string;
  justification: string;
}

export const PRIVILEGED_PATHS_REGISTRY: Record<PrivilegedPurposeTag, PrivilegedPathInfo> = {
  "sys-login": {
    allowedTables: ["users", "tenants", "tenant_users", "email_verification_tokens", "password_reset_tokens"],
    callerModule: "src/app/actions/auth.ts",
    justification: "Requires user lookup across all tenants during authentication."
  },
  "sys-register": {
    allowedTables: ["users", "tenants", "tenant_users", "email_verification_tokens"],
    callerModule: "src/app/actions/auth.ts",
    justification: "Creates the initial user and tenant."
  },
  "sys-auth-check": {
    allowedTables: ["users"],
    callerModule: "src/services/auth/authorization.ts",
    justification: "Verifies user existence/status globally."
  },
  "sys-auth-role-check": {
    allowedTables: ["tenant_users", "roles"],
    callerModule: "src/services/auth/authorization.ts",
    justification: "Checks cross-tenant roles without a specific tenant lease."
  },
  "sys-auth-api-check": {
    allowedTables: ["users"],
    callerModule: "src/services/auth/authorization.ts",
    justification: "Verifies API user existence globally."
  },
  "sys-create-workspace": {
    allowedTables: ["tenants", "tenant_users"],
    callerModule: "src/app/actions/workspace.ts",
    justification: "Creates a new tenant and assigns the user."
  },
  "sys-list-workspaces": {
    allowedTables: ["tenants", "tenant_users"],
    callerModule: "src/app/actions/workspace.ts",
    justification: "Fetches all tenants a user belongs to."
  },
  "sys-accept-invitation": {
    allowedTables: ["tenant_invitations", "tenant_users"],
    callerModule: "src/app/actions/workspace.ts",
    justification: "Resolves a cross-tenant invitation."
  },
  "sys-switch-workspace": {
    allowedTables: ["tenant_users", "roles"],
    callerModule: "src/app/actions/workspace.ts",
    justification: "Fetches user roles for target workspace before leasing."
  },
  "sys-api-key-auth": {
    allowedTables: ["api_keys", "tenants"],
    callerModule: "src/features/public-api/services/api-service.ts",
    justification: "Looks up API key across tenants to establish identity."
  },
  "sys-admin-run": {
    allowedTables: ["*"],
    callerModule: "tests/**",
    justification: "System administrator/test runner privilege context for executing test suites."
  },
  "test-req": {
    allowedTables: ["*"],
    callerModule: "verification/**",
    justification: "System context test tag for verification probe."
  }
};
