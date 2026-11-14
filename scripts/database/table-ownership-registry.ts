/**
 * Explicit ownership inventory for the canonical application database schemas.
 * This is a domain inventory, not an RLS/policy inventory. UNRESOLVED is never
 * interpreted as Global. Organization-scoped entries preserve existing schema
 * semantics and do not establish a multi-organization product commitment.
 */
export type TableOwnershipScope =
  | "ORGANIZATION_SCOPED"
  | "USER_OWNED"
  | "PLATFORM_OWNED"
  | "WORKSPACE_GLOBAL"
  | "GLOBAL_SHARED"
  | "UNRESOLVED";

export interface TableOwnershipEntry {
  readonly scope: TableOwnershipScope;
  readonly status: "current" | "legacy" | "unresolved";
  readonly rationale: string;
  readonly evidence: readonly string[];
}

function organizationScoped(
  marker: "organization_id" | "tenant_id",
  schemaPath = "database/schema/index.ts",
): TableOwnershipEntry {
  return {
    scope: "ORGANIZATION_SCOPED",
    status: "current",
    rationale:
      "The canonical Workspace Drizzle definition stores " + marker +
      " with a foreign key to organizations.id. This preserves the existing " +
      "organization-scoped schema contract only; it does not assert or " +
      "introduce a multi-organization product model.",
    evidence: [
      schemaPath + ": " + marker + " references organizations.id",
      "database/drizzle/meta/0016_snapshot.json: canonical Workspace snapshot",
    ],
  };
}

function userOwned(rationale: string, schemaObject: string): TableOwnershipEntry {
  return {
    scope: "USER_OWNED",
    status: "current",
    rationale,
    evidence: [
      "database/schema/index.ts: " + schemaObject,
      "database/drizzle/meta/0016_snapshot.json: canonical Workspace snapshot",
    ],
  };
}

function platformOwned(rationale: string, schemaObject: string): TableOwnershipEntry {
  return {
    scope: "PLATFORM_OWNED",
    status: "current",
    rationale,
    evidence: [
      "database/schema/index.ts: " + schemaObject,
      "docs/database/canonical-data-contract.md: Workspace schema contract",
    ],
  };
}

function workspaceGlobal(
  rationale: string,
  schemaObject: string,
  evidence: readonly string[],
  status: "current" | "legacy" = "current",
): TableOwnershipEntry {
  return {
    scope: "WORKSPACE_GLOBAL",
    status,
    rationale,
    evidence: ["database/schema/index.ts: " + schemaObject, ...evidence, "database/drizzle/meta/0016_snapshot.json: canonical Workspace snapshot"],
  };
}

function unresolved(
  rationale: string,
  status: "legacy" | "unresolved",
  evidence: readonly string[],
): TableOwnershipEntry {
  return { scope: "UNRESOLVED", status, rationale, evidence };
}

/** The 70 Workspace tables in the canonical Drizzle schema and modular exports. */
const workspaceOwnership = {
  admin_users: workspaceGlobal(
    "Legacy Workspace-database administrator records are consumed by the existing Workspace admin Postgres adapter. They are not Platform Admin identities: the isolated Platform Admin authentication boundary explicitly does not read this table.",
    "adminUsers",
    ["src/features/admin/infrastructure/persistence/postgres/index.ts: active admin_users SELECT/INSERT/UPDATE operations", "docs/security/PLATFORM_ADMIN_AUTHENTICATION.md: Platform Admin authentication does not read admin_users"],
    "legacy",
  ),
  aeo_analyses: organizationScoped("tenant_id"),
  ai_engines: {
    scope: "GLOBAL_SHARED",
    status: "current",
    rationale: "Shared AI-engine catalog referenced by Workspace observation records. The catalog row describes an engine rather than a user's or organization's observation.",
    evidence: [
      "database/schema/index.ts: aiEngines",
      "database/schema/index.ts: aiObservations.engineId references aiEngines.id",
      "database/drizzle/meta/0016_snapshot.json: canonical Workspace snapshot",
    ],
  },
  ai_observations: organizationScoped("organization_id"),
  ai_provider_configs: platformOwned(
    "Provider endpoint, masked provider credential, active state, and failover configuration are platform integration settings. No organization or user owner is represented in this row.",
    "aiProviderConfigs",
  ),
  ai_visibility_audits: organizationScoped("organization_id"),
  api_keys: organizationScoped("organization_id", "database/schema/api-keys.ts"),
  audit_prompts: organizationScoped("organization_id"),
  audit_records: workspaceGlobal(
    "The Workspace database shared privileged audit stream is written through explicit system context and read by the Workspace admin persistence adapter. It is distinct from platform_admin_audit_events in the isolated Platform Admin database.",
    "auditRecords",
    ["src/core/database/tenant-context/index.ts: doAuditLog inserts through privileged system client", "src/features/admin/infrastructure/persistence/postgres/index.ts: audit_records read/write adapter", "database/platform-admin/schema/index.ts: separate platform_admin_audit_events table"],
  ),
  auth_rate_limits: platformOwned(
    "Rate-limit buckets are keyed by endpoint and bucket key with attempt/expiry counters; the schema models shared authentication-abuse control state, not user-owned business data.",
    "authRateLimits",
  ),
  brand_associations: organizationScoped("organization_id"),
  brand_mentions: organizationScoped("organization_id"),
  brands: organizationScoped("organization_id"),
  citation_occurrences: organizationScoped("organization_id"),
  citation_sources: organizationScoped("organization_id"),
  citations: organizationScoped("organization_id"),
  competitive_analyses: organizationScoped("organization_id"),
  competitive_seo_findings: organizationScoped("tenant_id"),
  competitor_changes: organizationScoped("tenant_id"),
  competitors: organizationScoped("organization_id"),
  crawl_cache: organizationScoped("tenant_id"),
  crawl_jobs: organizationScoped("tenant_id"),
  crawl_results: organizationScoped("tenant_id"),
  crawl_snapshots: organizationScoped("organization_id"),
  credit_transactions: organizationScoped("tenant_id"),
  diagnostic_finding_relationships: organizationScoped("organization_id"),
  diagnostic_findings: organizationScoped("organization_id"),
  document_embeddings: organizationScoped("tenant_id"),
  email_outbox: platformOwned(
    "Encrypted authentication-email payloads and delivery state are shared platform queue data. User ownership is retained by user_id for lifecycle cleanup, but application access is routed through the authentication transaction and dedicated outbox worker system-context paths.",
    "emailOutbox",
  ),
  email_verification_tokens: userOwned(
    "Each token belongs to one user through its required user_id foreign key; it is an authentication artifact for that identity.",
    "emailVerificationTokens.userId references users.id",
  ),
  entities: organizationScoped("organization_id"),
  entity_relationships: organizationScoped("organization_id"),
  faq_opportunities: organizationScoped("tenant_id"),
  feature_flags: platformOwned(
    "Flag definitions and the global enablement switch are platform configuration. tenant_overrides is an embedded payload; its per-organization semantics and enforcement are not a row-level ownership boundary and remain a separate concern.",
    "featureFlags",
  ),
  historical_metrics: organizationScoped("organization_id"),
  keywords: organizationScoped("organization_id"),
  keywords_topics: organizationScoped("organization_id"),
  kg_alignments: organizationScoped("tenant_id"),
  kg_entities: organizationScoped("tenant_id"),
  kg_relationships: organizationScoped("tenant_id"),
  monitoring_alerts: organizationScoped("organization_id"),
  monitoring_configs: organizationScoped("organization_id"),
  organization_invitations: organizationScoped("organization_id"),
  organization_members: organizationScoped("organization_id"),
  organizations: {
    scope: "ORGANIZATION_SCOPED",
    status: "current",
    rationale: "Root table referenced by the existing organization_id and tenant_id foreign keys. This records the current schema relationship only and is not a product decision to support multiple organizations.",
    evidence: ["database/schema/organization-table.ts: organizations", "database/drizzle/meta/0016_snapshot.json: canonical Workspace snapshot"],
  },
  pages: organizationScoped("organization_id"),
  pages_entities: organizationScoped("organization_id"),
  pages_keywords: organizationScoped("organization_id"),
  pages_topics: organizationScoped("organization_id"),
  password_reset_tokens: userOwned(
    "Each reset token belongs to one user through its required user_id foreign key and is scoped to that identity's credential recovery.",
    "passwordResetTokens.userId references users.id",
  ),
  permissions: workspaceGlobal(
    "Frozen legacy Workspace-global permission catalog. The schema states it is no longer used for authorization decisions; organization_members.role is the current authorization source.",
    "permissions",
    ["database/schema/index.ts: FROZEN-LEGACY declaration and permissions.role_id foreign key", "database/schema/index.ts: organizationMembers.role is current authorization source"],
    "legacy",
  ),
  position_observations: organizationScoped("organization_id"),
  premium_audits: organizationScoped("organization_id"),
  prompt_definitions: organizationScoped("organization_id"),
  prompt_executions: organizationScoped("organization_id"),
  prompt_schedules: organizationScoped("organization_id"),
  prompts: organizationScoped("organization_id"),
  recommendation_observations: organizationScoped("organization_id"),
  recommendations: organizationScoped("organization_id"),
  roles: workspaceGlobal(
    "Frozen legacy Workspace-global role catalog. The schema states roles and permissions are no longer used for authorization decisions; organization_members.role is current. admin_users.role_id is a legacy schema relationship, not a current authorization decision path.",
    "roles",
    ["database/schema/index.ts: FROZEN-LEGACY declaration", "database/schema/index.ts: adminUsers.roleId and permissions.roleId foreign keys", "database/schema/index.ts: organizationMembers.role is current authorization source"],
    "legacy",
  ),
  sessions: userOwned(
    "The required user_id foreign key identifies the session owner. workspace_id is an optional selected-workspace context reference and does not change the session's user ownership.",
    "sessions.userId references users.id; sessions.workspaceId references organizations.id",
  ),
  system_configurations: unresolved(
    "The current reference matrix marks this table ORPHAN-TABLE (LEGACY-CANDIDATE), and no verified consumer or ownership contract establishes its owner. Do not infer PLATFORM_OWNED from the table name or the absence of an organization marker.",
    "legacy",
    [
      "database/schema/index.ts: systemConfigurations",
      "docs/database/reference-matrix.md: system_configurations is ORPHAN-TABLE (LEGACY-CANDIDATE)",
    ],
  ),
  technical_audits: organizationScoped("organization_id"),
  tenant_quotas: organizationScoped("tenant_id"),
  tenant_subscriptions: organizationScoped("tenant_id"),
  topics: organizationScoped("organization_id"),
  topics_entities: organizationScoped("organization_id"),
  user_credentials: userOwned(
    "The unique required user_id foreign key binds the credential record to exactly one user identity.",
    "userCredentials.userId references users.id",
  ),
  users: userOwned(
    "The users table is the global identity directory; email is unique across the Workspace schema and dependent credentials/tokens/sessions reference users.id.",
    "users.email unique; userCredentials, sessions, and token tables reference users.id",
  ),
  visibility_scores: organizationScoped("organization_id"),
  websites: organizationScoped("organization_id"),
} as const satisfies Readonly<Record<string, TableOwnershipEntry>>;

const platformAdminOwnership = {
  platform_admin_accounts: {
    scope: "PLATFORM_OWNED",
    status: "current",
    rationale: "Internal Platform Admin accounts are provisioned and controlled by the platform operator in the isolated Platform Admin database.",
    evidence: ["database/platform-admin/schema/index.ts: platformAdminAccounts", "docs/security/PLATFORM_ADMIN_AUTHENTICATION.md: dedicated Platform Admin control plane"],
  },
  platform_admin_external_identities: {
    scope: "PLATFORM_OWNED",
    status: "current",
    rationale: "Validated OIDC issuer/subject identities are linked to platform-admin accounts in the isolated control plane.",
    evidence: ["database/platform-admin/schema/index.ts: platformAdminExternalIdentities", "docs/security/PLATFORM_ADMIN_AUTHENTICATION.md: exact issuer/subject identity binding"],
  },
  platform_admin_permission_grants: {
    scope: "PLATFORM_OWNED",
    status: "current",
    rationale: "Explicit, individually revocable permission grants authorize Platform Admin accounts.",
    evidence: ["database/platform-admin/schema/index.ts: platformAdminPermissionGrants", "docs/security/PLATFORM_ADMIN_AUTHENTICATION.md: permission grants are the sole permission source"],
  },
  platform_admin_sessions: {
    scope: "PLATFORM_OWNED",
    status: "current",
    rationale: "Hashed opaque authentication sessions belong to Platform Admin accounts and are persisted only in the dedicated control-plane database.",
    evidence: ["database/platform-admin/schema/index.ts: platformAdminSessions", "docs/security/PLATFORM_ADMIN_AUTHENTICATION.md: isolated Platform Admin sessions"],
  },
  platform_admin_oidc_transactions: {
    scope: "PLATFORM_OWNED",
    status: "current",
    rationale: "Short-lived browser-bound OIDC transactions are authentication control-plane state owned by the platform.",
    evidence: ["database/platform-admin/schema/index.ts: platformAdminOidcTransactions", "docs/security/PLATFORM_ADMIN_AUTHENTICATION.md: browser-bound OIDC transaction flow"],
  },
  platform_admin_audit_events: {
    scope: "PLATFORM_OWNED",
    status: "current",
    rationale: "Authentication, bootstrap, and logout audit events are part of the isolated Platform Admin control plane.",
    evidence: ["database/platform-admin/schema/index.ts: platformAdminAuditEvents", "docs/security/PLATFORM_ADMIN_AUTHENTICATION.md: Platform Admin audit events"],
  },
  platform_admin_auth_rate_limits: {
    scope: "PLATFORM_OWNED",
    status: "current",
    rationale: "Hashed client-key rate-limit state protects Platform Admin authentication endpoints.",
    evidence: ["database/platform-admin/schema/index.ts: platformAdminAuthRateLimits", "docs/security/PLATFORM_ADMIN_AUTHENTICATION.md: Platform Admin authentication rate limits"],
  },
} as const satisfies Readonly<Record<string, TableOwnershipEntry>>;

export const WORKSPACE_TABLE_OWNERSHIP = Object.freeze(workspaceOwnership);
export const PLATFORM_ADMIN_TABLE_OWNERSHIP = Object.freeze(platformAdminOwnership);

export type OwnershipDatabase = "workspace" | "platform-admin";

function getRegistry(database: OwnershipDatabase): Readonly<Record<string, TableOwnershipEntry>> {
  return database === "workspace"
    ? WORKSPACE_TABLE_OWNERSHIP
    : PLATFORM_ADMIN_TABLE_OWNERSHIP;
}

/** Returns an explicit reviewed entry; unknown tables fail closed. */
export function getTableOwnershipEntry(
  database: OwnershipDatabase,
  tableName: string,
): TableOwnershipEntry {
  const entry = getRegistry(database)[tableName];
  if (!entry) {
    throw new Error(
      "[table-ownership-registry] No explicit ownership entry for " +
      database + " table \"" + tableName +
      "\". Add a reviewed registry entry before classifying this table.",
    );
  }
  return entry;
}

/** Reports missing schema entries and stale registry entries. */
export function getOwnershipRegistryDrift(
  database: OwnershipDatabase,
  schemaTableNames: readonly string[],
): { missingRegistryEntries: string[]; staleRegistryEntries: string[] } {
  const registered = Object.keys(getRegistry(database)).sort();
  const schema = [...new Set(schemaTableNames)].sort();
  return {
    missingRegistryEntries: schema.filter((name) => !registered.includes(name)),
    staleRegistryEntries: registered.filter((name) => !schema.includes(name)),
  };
}
