import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import type { Permission } from "../../src/features/admin/domain/types";
import { assertDedicatedPlatformAdminDatabaseUrl } from "../../src/features/admin/security/platform-admin-database-guard";

const ALLOWED_PERMISSIONS: readonly Permission[] = [
  "tenant:create", "tenant:write", "tenant:read", "tenant:suspend",
  "tenant:activate", "tenant:archive", "admin:write", "admin:read",
  "config:write", "config:read", "ai:manage", "ai:read", "audit:read",
  "billing:write", "billing:read", "prompt:manage", "crawler:manage",
  "system:monitor",
];

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function main(): Promise<void> {
  const connectionString = required("PLATFORM_ADMIN_MIGRATION_DATABASE_URL");
  assertDedicatedPlatformAdminDatabaseUrl(
    connectionString,
    "PLATFORM_ADMIN_MIGRATION_DATABASE_URL",
  );

  const issuer = required("PLATFORM_ADMIN_BOOTSTRAP_ISSUER");
  const subject = required("PLATFORM_ADMIN_BOOTSTRAP_SUBJECT");
  const displayName = required("PLATFORM_ADMIN_BOOTSTRAP_DISPLAY_NAME");
  const configuredIssuer = required("PLATFORM_ADMIN_OIDC_ISSUER");
  if (issuer !== configuredIssuer) {
    throw new Error("PLATFORM_ADMIN_BOOTSTRAP_ISSUER must exactly match PLATFORM_ADMIN_OIDC_ISSUER.");
  }

  const permissions = [
    ...new Set(
      required("PLATFORM_ADMIN_BOOTSTRAP_PERMISSIONS")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
  if (
    permissions.length === 0 ||
    permissions.some((permission) => !ALLOWED_PERMISSIONS.includes(permission as Permission))
  ) {
    throw new Error(
      "PLATFORM_ADMIN_BOOTSTRAP_PERMISSIONS must contain one or more exact Platform Admin permission keys.",
    );
  }

  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 5_000 });
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtext('oxenn-platform-admin-first-admin-bootstrap'))",
      );
      const existing = await client.query("SELECT 1 FROM platform_admin_accounts LIMIT 1");
      if (existing.rowCount && existing.rowCount > 0) {
        throw new Error("First-admin bootstrap is closed because a Platform Admin account already exists.");
      }

      const accountId = randomUUID();
      const identityId = randomUUID();
      await client.query(
        `INSERT INTO platform_admin_accounts (id, status, display_name)
         VALUES ($1, 'active', $2)`,
        [accountId, displayName],
      );
      await client.query(
        `INSERT INTO platform_admin_external_identities (id, account_id, issuer, subject)
         VALUES ($1, $2, $3, $4)`,
        [identityId, accountId, issuer, subject],
      );
      for (const permission of permissions) {
        await client.query(
          `INSERT INTO platform_admin_permission_grants (account_id, permission_key)
           VALUES ($1, $2)`,
          [accountId, permission],
        );
      }
      await client.query(
        `INSERT INTO platform_admin_audit_events
          (actor_account_id, event_type, outcome, subject, details)
         VALUES ($1, 'platform_admin.bootstrap', 'success', $2, $3::jsonb)`,
        [accountId, identityId, JSON.stringify({ permissions })],
      );
      await client.query("COMMIT");
      process.stdout.write(
        `The first Platform Admin account was provisioned (account ID: ${accountId}). Store this identifier in your controlled operator record.\n`,
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(
    `Platform Admin bootstrap failed: ${error instanceof Error ? error.message : "unknown error"}\n`,
  );
  process.exitCode = 1;
});
