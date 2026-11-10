-- PostgreSQL 13+ migration; SQL Server-only session directives do not apply.
CREATE TABLE IF NOT EXISTS platform_admin_schema_migrations (
  id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_admin_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  display_name text NOT NULL CHECK (length(btrim(display_name)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz
);

CREATE TABLE IF NOT EXISTS platform_admin_external_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES platform_admin_accounts(id) ON DELETE RESTRICT,
  issuer text NOT NULL CHECK (length(btrim(issuer)) > 0),
  subject text NOT NULL CHECK (length(btrim(subject)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_authenticated_at timestamptz,
  CONSTRAINT platform_admin_external_identity_issuer_subject_unique UNIQUE (issuer, subject)
);
CREATE INDEX IF NOT EXISTS platform_admin_external_identities_account_idx
  ON platform_admin_external_identities(account_id);

CREATE TABLE IF NOT EXISTS platform_admin_permission_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES platform_admin_accounts(id) ON DELETE RESTRICT,
  permission_key text NOT NULL CHECK (permission_key IN (
    'tenant:create', 'tenant:write', 'tenant:read', 'tenant:suspend',
    'tenant:activate', 'tenant:archive', 'admin:write', 'admin:read',
    'config:write', 'config:read', 'ai:manage', 'ai:read', 'audit:read',
    'billing:write', 'billing:read', 'prompt:manage', 'crawler:manage',
    'system:monitor'
  )),
  granted_by_account_id uuid REFERENCES platform_admin_accounts(id) ON DELETE RESTRICT,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS platform_admin_permission_grants_active_unique
  ON platform_admin_permission_grants(account_id, permission_key)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS platform_admin_permission_grants_account_idx
  ON platform_admin_permission_grants(account_id) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS platform_admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES platform_admin_accounts(id) ON DELETE RESTRICT,
  external_identity_id uuid NOT NULL REFERENCES platform_admin_external_identities(id) ON DELETE RESTRICT,
  audience text NOT NULL CHECK (length(btrim(audience)) > 0),
  token_hash char(64) NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CHECK (expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS platform_admin_sessions_active_account_idx
  ON platform_admin_sessions(account_id, expires_at) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS platform_admin_oidc_transactions (
  state_hash char(64) PRIMARY KEY CHECK (state_hash ~ '^[a-f0-9]{64}$'),
  nonce text NOT NULL,
  code_verifier_ciphertext text NOT NULL,
  browser_binding_hash char(64) NOT NULL CHECK (browser_binding_hash ~ '^[a-f0-9]{64}$'),
  redirect_uri text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  CHECK (expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS platform_admin_oidc_transactions_expiry_idx
  ON platform_admin_oidc_transactions(expires_at);

CREATE TABLE IF NOT EXISTS platform_admin_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_account_id uuid REFERENCES platform_admin_accounts(id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('success', 'denied', 'error')),
  subject text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS platform_admin_audit_events_created_idx
  ON platform_admin_audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS platform_admin_audit_events_actor_idx
  ON platform_admin_audit_events(actor_account_id, created_at DESC);

CREATE TABLE IF NOT EXISTS platform_admin_auth_rate_limits (
  key_hash char(64) PRIMARY KEY CHECK (key_hash ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz NOT NULL,
  attempt_count integer NOT NULL CHECK (attempt_count > 0),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS platform_admin_auth_rate_limits_expiry_idx
  ON platform_admin_auth_rate_limits(expires_at);
