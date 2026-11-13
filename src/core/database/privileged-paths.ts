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
  | "api-key-issue"
  | "api-key-revoke"
  | "sys-grant-super-admin"
  | "sys-admin-run"
  | "test-req";

export interface PrivilegedPathInfo {
  /** Tables observed in the documented caller paths; audit metadata only, not SQL enforcement. */
  allowedTables: string[];
  /** Canonical, complete list of verified direct call sites for this purpose. */
  callerModules: string[];
  /** @deprecated Use callerModules; retained as a compatibility alias for existing integrations. */
  callerModule?: string;
  /** Indicates whether a verified direct caller currently exists. */
  status: "in-use" | "unreferenced";
  justification: string;
}

function definePath(
  allowedTables: string[],
  callerModules: string[],
  justification: string,
  status: PrivilegedPathInfo["status"] = "in-use"
): PrivilegedPathInfo {
  return {
    allowedTables,
    callerModules,
    ...(callerModules[0] ? { callerModule: callerModules[0] } : {}),
    status,
    justification
  };
}

export const PRIVILEGED_PATHS_REGISTRY: Record<PrivilegedPurposeTag, PrivilegedPathInfo> = {
  "sys-login": definePath(
    ["users", "user_credentials", "auth_rate_limits", "email_verification_tokens", "password_reset_tokens", "sessions", "organizations", "organization_members", "audit_records"],
    ["src/app/actions/auth.ts", "src/app/actions/account.ts", "src/services/auth/session.ts"],
    "Shared authentication and account-security context for credentials, rate limits, verification/reset tokens, session lifecycle, workspace identity resolution, and account-deactivation audit writes."
  ),
  "sys-register": definePath(
    ["users", "user_credentials", "organizations", "organization_members", "auth_rate_limits"],
    ["src/app/actions/auth.ts"],
    "Applies registration rate limits and creates the initial user, credentials, organization, and membership."
  ),
  "sys-auth-check": definePath(
    ["sessions", "users", "organizations", "organization_members"],
    [
      "src/services/auth/session.ts",
      "src/services/auth/authorization.ts",
      "tests/unit/core/tenant-context/privileged-paths.test.ts",
      "tests/unit/core/tenant-context/system-mode-bypass.test.ts"
    ],
    "Validates the persisted session and verifies membership in the requested workspace."
  ),
  "sys-auth-role-check": definePath(
    ["users", "organizations", "organization_members"],
    ["src/services/auth/authorization.ts"],
    "Reads the authoritative workspace role from organization_members.role; it does not use the frozen-legacy roles table."
  ),
  "sys-auth-api-check": definePath(
    [],
    [],
    "Registered purpose retained pending owner confirmation; no direct caller was found in the inspected application, script, test, or verification sources.",
    "unreferenced"
  ),
  "sys-create-workspace": definePath(
    ["users", "organizations", "organization_members"],
    ["src/app/actions/workspace.ts"],
    "Creates a workspace (organizations) and its initial membership (organization_members)."
  ),
  "sys-list-workspaces": definePath(
    ["organizations", "organization_members"],
    ["src/app/actions/workspace.ts"],
    "Lists a user's workspace memberships and associated organization details."
  ),
  "sys-accept-invitation": definePath(
    ["users", "organization_invitations", "organization_members", "organizations"],
    ["src/app/actions/workspace.ts"],
    "Resolves a pending organization invitation and creates the accepted user's membership."
  ),
  "sys-switch-workspace": definePath(
    ["users", "organizations", "organization_members", "sessions"],
    ["src/app/actions/workspace.ts"],
    "Re-reads the target workspace role, creates the replacement session, and revokes the previous session."
  ),
  "sys-api-key-auth": definePath(
    ["api_keys"],
    ["src/features/public-api/services/api-service.ts"],
    "Looks up an API key by prefix before switching to its organization-scoped context."
  ),
  "api-key-issue": definePath(
    ["api_keys"],
    ["scripts/api/issue-key.ts"],
    "CLI operation that inserts a new API key for the supplied organization."
  ),
  "api-key-revoke": definePath(
    ["api_keys"],
    ["scripts/api/revoke-key.ts"],
    "CLI operation that revokes an API key by its identifier."
  ),
  "sys-grant-super-admin": definePath(
    ["users", "organizations", "organization_members", "audit_records"],
    ["scripts/auth/grant-super-admin.ts"],
    "Dedicated operator-only purpose tag for granting Workspace super_admin. The recorded table list is audit metadata, not SQL access enforcement; the operation serializes on the parent organization and preserves at least one active workspace_admin."
  ),
  "sys-admin-run": definePath(
    ["*"],
    [
      "tests/features/public-api/public-api.test.ts",
      "tests/features/ai-intelligence/tenant-pipeline.test.ts",
      "tests/features/ai-intelligence/run-all.ts",
      "tests/features/admin/run-all.ts"
    ],
    "Broad system-context purpose used by legacy test runners; the existing runtime test/verification gate remains authoritative."
  ),
  "test-req": definePath(
    ["*"],
    ["verification/phase-0/probe-system-context.ts"],
    "System-context purpose used by the Phase 0 verification probe."
  )
};
