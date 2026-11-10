import { sql } from "drizzle-orm";
import {
  char,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const platformAdminAccounts = pgTable(
  "platform_admin_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    status: text("status").notNull().default("active"),
    displayName: text("display_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
  },
  (table) => [
    check("platform_admin_accounts_status_check", sql`${table.status} IN ('active', 'suspended')`),
    check("platform_admin_accounts_display_name_check", sql`length(btrim(${table.displayName})) > 0`),
  ],
);

export const platformAdminExternalIdentities = pgTable(
  "platform_admin_external_identities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => platformAdminAccounts.id, { onDelete: "restrict" }),
    issuer: text("issuer").notNull(),
    subject: text("subject").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastAuthenticatedAt: timestamp("last_authenticated_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("platform_admin_external_identity_issuer_subject_unique").on(table.issuer, table.subject),
    index("platform_admin_external_identities_account_idx").on(table.accountId),
    check("platform_admin_external_identities_issuer_check", sql`length(btrim(${table.issuer})) > 0`),
    check("platform_admin_external_identities_subject_check", sql`length(btrim(${table.subject})) > 0`),
  ],
);

export const platformAdminPermissionGrants = pgTable(
  "platform_admin_permission_grants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => platformAdminAccounts.id, { onDelete: "restrict" }),
    permissionKey: text("permission_key").notNull(),
    grantedByAccountId: uuid("granted_by_account_id").references(() => platformAdminAccounts.id, {
      onDelete: "restrict",
    }),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    check(
      "platform_admin_permission_grants_permission_key_check",
      sql`${table.permissionKey} IN (
        'tenant:create', 'tenant:write', 'tenant:read', 'tenant:suspend',
        'tenant:activate', 'tenant:archive', 'admin:write', 'admin:read',
        'config:write', 'config:read', 'ai:manage', 'ai:read', 'audit:read',
        'billing:write', 'billing:read', 'prompt:manage', 'crawler:manage',
        'system:monitor'
      )`,
    ),
    uniqueIndex("platform_admin_permission_grants_active_unique")
      .on(table.accountId, table.permissionKey)
      .where(sql`${table.revokedAt} IS NULL`),
    index("platform_admin_permission_grants_account_idx")
      .on(table.accountId)
      .where(sql`${table.revokedAt} IS NULL`),
  ],
);

export const platformAdminSessions = pgTable(
  "platform_admin_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => platformAdminAccounts.id, { onDelete: "restrict" }),
    externalIdentityId: uuid("external_identity_id")
      .notNull()
      .references(() => platformAdminExternalIdentities.id, { onDelete: "restrict" }),
    audience: text("audience").notNull(),
    tokenHash: char("token_hash", { length: 64 }).notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    check("platform_admin_sessions_audience_check", sql`length(btrim(${table.audience})) > 0`),
    check("platform_admin_sessions_token_hash_check", sql`${table.tokenHash} ~ '^[a-f0-9]{64}$'`),
    check("platform_admin_sessions_expiry_check", sql`${table.expiresAt} > ${table.createdAt}`),
    index("platform_admin_sessions_active_account_idx")
      .on(table.accountId, table.expiresAt)
      .where(sql`${table.revokedAt} IS NULL`),
  ],
);

export const platformAdminOidcTransactions = pgTable(
  "platform_admin_oidc_transactions",
  {
    stateHash: char("state_hash", { length: 64 }).primaryKey(),
    nonce: text("nonce").notNull(),
    codeVerifierCiphertext: text("code_verifier_ciphertext").notNull(),
    browserBindingHash: char("browser_binding_hash", { length: 64 }).notNull(),
    redirectUri: text("redirect_uri").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    check("platform_admin_oidc_transactions_state_hash_check", sql`${table.stateHash} ~ '^[a-f0-9]{64}$'`),
    check("platform_admin_oidc_transactions_binding_hash_check", sql`${table.browserBindingHash} ~ '^[a-f0-9]{64}$'`),
    check("platform_admin_oidc_transactions_expiry_check", sql`${table.expiresAt} > ${table.createdAt}`),
    index("platform_admin_oidc_transactions_expiry_idx").on(table.expiresAt),
  ],
);

export const platformAdminAuditEvents = pgTable(
  "platform_admin_audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorAccountId: uuid("actor_account_id").references(() => platformAdminAccounts.id, {
      onDelete: "restrict",
    }),
    eventType: text("event_type").notNull(),
    outcome: text("outcome").notNull(),
    subject: text("subject"),
    details: jsonb("details").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("platform_admin_audit_events_outcome_check", sql`${table.outcome} IN ('success', 'denied', 'error')`),
    index("platform_admin_audit_events_created_idx").on(table.createdAt),
    index("platform_admin_audit_events_actor_idx").on(table.actorAccountId, table.createdAt),
  ],
);

export const platformAdminAuthRateLimits = pgTable(
  "platform_admin_auth_rate_limits",
  {
    keyHash: char("key_hash", { length: 64 }).primaryKey(),
    windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
    attemptCount: integer("attempt_count").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    check("platform_admin_auth_rate_limits_key_hash_check", sql`${table.keyHash} ~ '^[a-f0-9]{64}$'`),
    check("platform_admin_auth_rate_limits_attempt_count_check", sql`${table.attemptCount} > 0`),
    index("platform_admin_auth_rate_limits_expiry_idx").on(table.expiresAt),
  ],
);
