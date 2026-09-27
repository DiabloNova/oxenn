import { TableDefinition } from "../../types";

export const adminUsersTable: TableDefinition = {
  tableName: "admin_users",
  columns: [
    { name: "id", type: "UUID", nullable: false, primaryKey: true, description: "Unique identifier for the admin user" },
    { name: "email", type: "TEXT", nullable: false, unique: true, description: "Email address of the administrator" },
    { name: "full_name", type: "TEXT", nullable: false, description: "Full name of the administrator" },
    { name: "role_id", type: "UUID", nullable: false, description: "FK pointing to administrative role" },
    { name: "is_active", type: "BOOLEAN", nullable: false, default: "TRUE", description: "Whether user can log in" },
    { name: "created_at", type: "TIMESTAMP", nullable: false, default: "NOW()", description: "Timestamp when the record was created" },
    { name: "updated_at", type: "TIMESTAMP", nullable: false, default: "NOW()", description: "Timestamp when the record was last updated" },
    { name: "deleted_at", type: "TIMESTAMP", nullable: true, description: "Timestamp when soft-deletion occurred" },
    { name: "version", type: "INTEGER", nullable: false, default: "1", description: "Optimistic locking version" }
  ],
  indexes: [
    "CREATE INDEX idx_admin_users_email ON admin_users(email);",
    "CREATE INDEX idx_admin_users_deleted_at ON admin_users(deleted_at) WHERE deleted_at IS NULL;"
  ],
  sql: `
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_deleted_at ON admin_users(deleted_at) WHERE deleted_at IS NULL;
  `
};

export const rolesTable: TableDefinition = {
  tableName: "roles",
  columns: [
    { name: "id", type: "UUID", nullable: false, primaryKey: true, description: "Unique identifier for the role" },
    { name: "name", type: "TEXT", nullable: false, unique: true, description: "Name of the admin role" },
    { name: "hierarchy_rank", type: "INTEGER", nullable: false, description: "Integer rank mapping for hierarchy comparison" },
    { name: "created_at", type: "TIMESTAMP", nullable: false, default: "NOW()", description: "Timestamp when the record was created" }
  ],
  indexes: [
    "CREATE INDEX idx_roles_name ON roles(name);"
  ],
  sql: `
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  hierarchy_rank INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
  `
};

export const permissionsTable: TableDefinition = {
  tableName: "permissions",
  columns: [
    { name: "id", type: "UUID", nullable: false, primaryKey: true, description: "Unique identifier for permission" },
    { name: "role_id", type: "UUID", nullable: false, references: { table: "roles", column: "id", onDelete: "CASCADE" }, description: "Role matching this permission key" },
    { name: "permission_key", type: "TEXT", nullable: false, description: "String action name e.g. tenant:write" },
    { name: "created_at", type: "TIMESTAMP", nullable: false, default: "NOW()", description: "Timestamp when the record was created" }
  ],
  indexes: [
    "CREATE INDEX idx_permissions_role_id ON permissions(role_id);"
  ],
  sql: `
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permissions_role_id ON permissions(role_id);
  `
};

export const auditRecordsTable: TableDefinition = {
  tableName: "audit_records",
  columns: [
    { name: "id", type: "UUID", nullable: false, primaryKey: true, description: "Unique identifier for audit record" },
    { name: "timestamp", type: "TIMESTAMP", nullable: false, default: "NOW()", description: "Timestamp when the action was performed" },
    { name: "actor_id", type: "TEXT", nullable: false, description: "Admin User ID who performed the action" },
    { name: "actor_email", type: "TEXT", nullable: false, description: "Admin User Email who performed the action" },
    { name: "actor_role", type: "TEXT", nullable: false, description: "Admin User Role" },
    { name: "action", type: "TEXT", nullable: false, description: "Action identifier string (e.g. TENANT_SUSPEND)" },
    { name: "resource_type", type: "TEXT", nullable: false, description: "Resource type identifier string (e.g. tenant)" },
    { name: "resource_id", type: "TEXT", nullable: false, description: "Target resource ID string" },
    { name: "ip_address", type: "TEXT", nullable: false, description: "Ip address of the administrator" },
    { name: "user_agent", type: "TEXT", nullable: false, description: "Browser user agent" },
    { name: "payload_before", type: "TEXT", nullable: true, description: "JSON string of state before mutation" },
    { name: "payload_after", type: "TEXT", nullable: true, description: "JSON string of state after mutation" },
    { name: "status", type: "TEXT", nullable: false, description: "Result status of mutation: success, denied, error" },
    { name: "error_details", type: "TEXT", nullable: true, description: "Detailed message if status is error" }
  ],
  indexes: [
    "CREATE INDEX idx_audit_records_actor ON audit_records(actor_id);",
    "CREATE INDEX idx_audit_records_resource ON audit_records(resource_type, resource_id);",
    "CREATE INDEX idx_audit_records_timestamp ON audit_records(timestamp);"
  ],
  sql: `
CREATE TABLE IF NOT EXISTS audit_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  actor_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  payload_before TEXT,
  payload_after TEXT,
  status TEXT NOT NULL,
  error_details TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_records_actor ON audit_records(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_records_resource ON audit_records(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_records_timestamp ON audit_records(timestamp);
  `
};

export const featureFlagsTable: TableDefinition = {
  tableName: "feature_flags",
  columns: [
    { name: "id", type: "UUID", nullable: false, primaryKey: true, description: "Unique identifier for feature flag" },
    { name: "key", type: "TEXT", nullable: false, unique: true, description: "Lookup string code for the feature flag" },
    { name: "name", type: "TEXT", nullable: false, description: "User-friendly flag name" },
    { name: "description", type: "TEXT", nullable: false, description: "Flag description" },
    { name: "is_enabled_globally", type: "BOOLEAN", nullable: false, default: "FALSE", description: "Global fallback value" },
    { name: "tenant_overrides", type: "TEXT", nullable: false, default: "'{}'", description: "JSON representation of tenant specific overrides" },
    { name: "created_at", type: "TIMESTAMP", nullable: false, default: "NOW()", description: "Timestamp when the record was created" },
    { name: "updated_at", type: "TIMESTAMP", nullable: false, default: "NOW()", description: "Timestamp when the record was last updated" }
  ],
  indexes: [
    "CREATE INDEX idx_feature_flags_key ON feature_flags(key);"
  ],
  sql: `
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_enabled_globally BOOLEAN NOT NULL DEFAULT FALSE,
  tenant_overrides TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
  `
};

export const systemConfigurationsTable: TableDefinition = {
  tableName: "system_configurations",
  columns: [
    { name: "id", type: "UUID", nullable: false, primaryKey: true, description: "Unique identifier for system configuration" },
    { name: "key", type: "TEXT", nullable: false, unique: true, description: "Lookup string configuration key" },
    { name: "value", type: "TEXT", nullable: false, description: "String value of configuration" },
    { name: "category", type: "TEXT", nullable: false, description: "Config category: security, network, compliance, general" },
    { name: "is_encrypted", type: "BOOLEAN", nullable: false, default: "FALSE", description: "Whether the value is stored encrypted at rest" },
    { name: "created_at", type: "TIMESTAMP", nullable: false, default: "NOW()", description: "Timestamp when the record was created" },
    { name: "updated_at", type: "TIMESTAMP", nullable: false, default: "NOW()", description: "Timestamp when the record was last updated" }
  ],
  indexes: [
    "CREATE INDEX idx_system_configurations_key ON system_configurations(key);"
  ],
  sql: `
CREATE TABLE IF NOT EXISTS system_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  category TEXT NOT NULL,
  is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_configurations_key ON system_configurations(key);
  `
};

export const tenantQuotasTable: TableDefinition = {
  tableName: "tenant_quotas",
  columns: [
    { name: "id", type: "UUID", nullable: false, primaryKey: true, description: "Unique identifier for quota" },
    { name: "tenant_id", type: "UUID", nullable: false, description: "Organization/Tenant reference ID" },
    { name: "max_users", type: "INTEGER", nullable: false, description: "Maximum workspace users allowed" },
    { name: "max_brands", type: "INTEGER", nullable: false, description: "Maximum brands allowed" },
    { name: "max_prompts", type: "INTEGER", nullable: false, description: "Maximum query prompt tracks allowed" },
    { name: "max_observations_per_month", type: "INTEGER", nullable: false, description: "Maximum observations monthly crawl limit" },
    { name: "max_crawl_jobs_per_day", type: "INTEGER", nullable: false, description: "Maximum spider crawlers per day" },
    { name: "monthly_token_limit", type: "INTEGER", nullable: false, description: "Maximum LLM tokens monthly budget limit" },
    { name: "monthly_cost_limit_usd", type: "INTEGER", nullable: false, description: "Maximum dollar spend limit" },
    { name: "used_observations_this_month", type: "INTEGER", nullable: false, default: "0", description: "Current count of month observations" },
    { name: "used_tokens_this_month", type: "INTEGER", nullable: false, default: "0", description: "Current count of month tokens" },
    { name: "used_crawl_jobs_today", type: "INTEGER", nullable: false, default: "0", description: "Current count of today crawls" },
    { name: "created_at", type: "TIMESTAMP", nullable: false, default: "NOW()", description: "Timestamp when the record was created" },
    { name: "updated_at", type: "TIMESTAMP", nullable: false, default: "NOW()", description: "Timestamp when the record was last updated" }
  ],
  indexes: [
    "CREATE INDEX idx_tenant_quotas_tenant ON tenant_quotas(tenant_id);"
  ],
  sql: `
CREATE TABLE IF NOT EXISTS tenant_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  max_users INTEGER NOT NULL,
  max_brands INTEGER NOT NULL,
  max_prompts INTEGER NOT NULL,
  max_observations_per_month INTEGER NOT NULL,
  max_crawl_jobs_per_day INTEGER NOT NULL,
  monthly_token_limit INTEGER NOT NULL,
  monthly_cost_limit_usd INTEGER NOT NULL,
  used_observations_this_month INTEGER NOT NULL DEFAULT 0,
  used_tokens_this_month INTEGER NOT NULL DEFAULT 0,
  used_crawl_jobs_today INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_quotas_tenant ON tenant_quotas(tenant_id);

-- Enable PostgreSQL Row Level Security (RLS) for zero-trust tenant isolation
ALTER TABLE tenant_quotas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON tenant_quotas;
CREATE POLICY select_tenant_isolation_policy ON tenant_quotas
  FOR SELECT
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON tenant_quotas;
CREATE POLICY insert_tenant_isolation_policy ON tenant_quotas
  FOR INSERT
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON tenant_quotas;
CREATE POLICY update_tenant_isolation_policy ON tenant_quotas
  FOR UPDATE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON tenant_quotas;
CREATE POLICY delete_tenant_isolation_policy ON tenant_quotas
  FOR DELETE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
  `
};

export const tenantSubscriptionsTable: TableDefinition = {
  tableName: "tenant_subscriptions",
  columns: [
    { name: "id", type: "UUID", nullable: false, primaryKey: true, description: "Unique identifier for subscription" },
    { name: "tenant_id", type: "UUID", nullable: false, description: "Organization/Tenant reference ID" },
    { name: "plan", type: "TEXT", nullable: false, description: "Subscription plan tier: free, growth, enterprise" },
    { name: "status", type: "TEXT", nullable: false, description: "Status: active, past_due, canceled" },
    { name: "billing_cycle", type: "TEXT", nullable: false, description: "monthly or yearly" },
    { name: "start_date", type: "TIMESTAMP", nullable: false, description: "Subscription validity commencement date" },
    { name: "end_date", type: "TIMESTAMP", nullable: false, description: "Subscription validity termination date" },
    { name: "price_amount", type: "INTEGER", nullable: false, description: "Cost per cycle in cents" },
    { name: "currency", type: "TEXT", nullable: false, default: "'USD'", description: "SaaS payment currency" },
    { name: "created_at", type: "TIMESTAMP", nullable: false, default: "NOW()", description: "Timestamp when the record was created" },
    { name: "updated_at", type: "TIMESTAMP", nullable: false, default: "NOW()", description: "Timestamp when the record was last updated" }
  ],
  indexes: [
    "CREATE INDEX idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);"
  ],
  sql: `
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  price_amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);

-- Enable PostgreSQL Row Level Security (RLS) for zero-trust tenant isolation
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON tenant_subscriptions;
CREATE POLICY select_tenant_isolation_policy ON tenant_subscriptions
  FOR SELECT
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON tenant_subscriptions;
CREATE POLICY insert_tenant_isolation_policy ON tenant_subscriptions
  FOR INSERT
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON tenant_subscriptions;
CREATE POLICY update_tenant_isolation_policy ON tenant_subscriptions
  FOR UPDATE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON tenant_subscriptions;
CREATE POLICY delete_tenant_isolation_policy ON tenant_subscriptions
  FOR DELETE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
  `
};

export const aiProviderConfigsTable: TableDefinition = {
  tableName: "ai_provider_configs",
  columns: [
    { name: "id", type: "UUID", nullable: false, primaryKey: true, description: "Unique identifier for AI configuration" },
    { name: "provider_name", type: "TEXT", nullable: false, description: "AI Provider name: OpenAI, Anthropic, Gemini, Local Models" },
    { name: "endpoint_url", type: "TEXT", nullable: false, description: "Base URL targeting model gateway" },
    { name: "api_key_masked", type: "TEXT", nullable: false, description: "Masked string containing api token credentials" },
    { name: "is_active", type: "BOOLEAN", nullable: false, default: "TRUE", description: "Whether provider is actively dispatching queries" },
    { name: "failover_provider_id", type: "UUID", nullable: true, description: "Fallback config ID reference if active model goes offline" },
    { name: "created_at", type: "TIMESTAMP", nullable: false, default: "NOW()", description: "Timestamp when the record was created" },
    { name: "updated_at", type: "TIMESTAMP", nullable: false, default: "NOW()", description: "Timestamp when the record was last updated" }
  ],
  indexes: [
    "CREATE INDEX idx_ai_provider_configs_active ON ai_provider_configs(is_active);"
  ],
  sql: `
CREATE TABLE IF NOT EXISTS ai_provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  api_key_masked TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  failover_provider_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_provider_configs_active ON ai_provider_configs(is_active);
  `
};
