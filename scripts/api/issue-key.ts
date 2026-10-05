import { randomBytes, createHash } from "crypto";
import { TenantContextManager } from "../../src/core/database/tenant-context";
import { parseArgs } from "util";

async function main() {
  const { values } = parseArgs({
    options: {
      tenant: { type: "string" },
      name: { type: "string" },
    },
    strict: true,
  });

  if (!values.tenant || !values.name) {
    console.error("Usage: tsx scripts/api/issue-key.ts --tenant <tenant-id> --name <key-name>");
    process.exit(1);
  }

  const rawBytes = randomBytes(32).toString("hex");
  const prefix = rawBytes.substring(0, 8);
  const secret = `seo_${rawBytes}`;
  const hash = createHash("sha256").update(secret).digest("hex");

  const apiKeyId = await TenantContextManager.runWithSystemContext(
    null,
    "api-key-issue",
    async () => {
      // Need dynamic import for DB to avoid loading it early or outside context
      const { PostgresClient } = await import("../../src/features/admin/infrastructure/persistence/postgres");
      const client = PostgresClient.getInstance();

      const sql = `
        INSERT INTO api_keys (organization_id, name, prefix, hash, is_active, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id;
      `;
      const res = await client.query(sql, [values.tenant, values.name, prefix, hash, true, "system"]);
      return res.rows[0].id;
    }
  );

  console.log(`API Key issued successfully.`);
  console.log(`ID: ${apiKeyId}`);
  console.log(`Secret: ${secret}`);
  console.log(`\nIMPORTANT: The secret is shown only once and is not persisted. Save it now.`);

  // Close database pools so process can cleanly exit now that audit writes are awaited
  const { PostgresClient } = await import("../../src/features/admin/infrastructure/persistence/postgres");
  await PostgresClient.getInstance().closePools();

  process.exitCode = 0;
}

main().catch(async (err) => {
  console.error("Error issuing API key:", err);
  process.exitCode = 1;
  const { PostgresClient } = await import("../../src/features/admin/infrastructure/persistence/postgres");
  await PostgresClient.getInstance().closePools();
});
