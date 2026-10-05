import { TenantContextManager } from "../../src/core/database/tenant-context";
import { parseArgs } from "util";

async function main() {
  const { values } = parseArgs({
    options: {
      "key-id": { type: "string" },
    },
    strict: true,
  });

  if (!values["key-id"]) {
    console.error("Usage: tsx scripts/api/revoke-key.ts --key-id <key-id>");
    process.exitCode = 1;
    return;
  }

  const revoked = await TenantContextManager.runWithSystemContext(
    null,
    "api-key-revoke",
    async () => {
      const { PostgresClient } = await import("../../src/features/admin/infrastructure/persistence/postgres");
      const client = PostgresClient.getInstance();

      const sql = `
        UPDATE api_keys
        SET revoked_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND revoked_at IS NULL
        RETURNING id;
      `;
      const res = await client.query(sql, [values["key-id"]]);
      return res.rowCount && res.rowCount > 0;
    }
  );

  if (revoked) {
    console.log(`API Key ${values["key-id"]} revoked successfully.`);
  } else {
    console.error(`API Key ${values["key-id"]} not found or already revoked.`);
    process.exitCode = 1;
  }

  // Close database pools so process can cleanly exit now that audit writes are awaited
  const { PostgresClient } = await import("../../src/features/admin/infrastructure/persistence/postgres");
  await PostgresClient.getInstance().closePools();

  return;
}

main().catch(async (err) => {
  console.error("Error revoking API key:", err);
  process.exitCode = 1;
  const { PostgresClient } = await import("../../src/features/admin/infrastructure/persistence/postgres");
  await PostgresClient.getInstance().closePools();
});
