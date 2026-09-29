import { Pool, PoolClient } from "pg";
import { runMigrations } from "../../src/core/database/migrator";
import { TENANT_SCOPED_TABLES } from "../../src/core/database/tenant-tables.generated";
import * as crypto from "crypto";
import fs from "fs";
import path from "path";

const GLOBAL_TABLES = [
  "users",
  "roles",
  "permissions",
  "admin_users",
  "ai_engines",
  "ai_provider_configs",
  "audit_records",
  "feature_flags",
  "system_configurations",
  "pages_keywords",
  "pages_topics",
  "pages_entities",
  "keywords_topics",
  "topics_entities"
];

function randomUUID() {
  return crypto.randomUUID();
}

type ColumnMetadata = { column_name: string; data_type: string; is_nullable: string; column_default: unknown; };
const testDbUrl = "postgresql://postgres:postgres@localhost:5432/isolation_test_db";
const MOCK_VECTOR = '[' + Array.from({length: 768}, () => (Math.random() * 0.1).toFixed(4)).join(',') + ']';

async function setupTestDb() {
  const adminDbUrl = "postgresql://postgres:postgres@localhost:5432/postgres";
  const pool = new Pool({ connectionString: adminDbUrl });

  const client = await pool.connect();
  try {
    const res = await client.query("SELECT datname FROM pg_catalog.pg_database WHERE datname = 'isolation_test_db'");
    if (res.rows.length === 0) {
      await client.query("CREATE DATABASE isolation_test_db");
    } else {
      await client.query("DROP DATABASE isolation_test_db WITH (FORCE)");
      await client.query("CREATE DATABASE isolation_test_db");
    }
  } finally {
    client.release();
    await pool.end();
  }

  const testPool = new Pool({ connectionString: testDbUrl });
  const testClient = await testPool.connect();

  try {
    const bootstrapSql = fs.readFileSync(path.resolve(__dirname, "../../database/bootstrap.sql"), "utf-8");
    await testClient.query(bootstrapSql);
    await testClient.query(`
      GRANT ALL PRIVILEGES ON DATABASE isolation_test_db TO app_owner;
      GRANT ALL PRIVILEGES ON SCHEMA public TO app_owner;
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_owner;
    `);
  } finally {
    testClient.release();
    await testPool.end();
  }

  process.env.DATABASE_URL = testDbUrl;
  process.env.MIGRATION_DATABASE_URL = testDbUrl;
  await runMigrations(testDbUrl);
}

async function runTest() {
  await setupTestDb();
  console.log("Database initialized and migrations applied.");

  const pool = new Pool({ connectionString: testDbUrl });
  const client = await pool.connect();

  try {
    const tablesRes = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    for (const row of tablesRes.rows) {
      await client.query(`ALTER TABLE "${row.tablename}" OWNER TO app_owner;`);
    }

    await client.query("GRANT USAGE ON SCHEMA public TO app_runtime;");
    await client.query("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;");
    await client.query("GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO app_runtime;");

    const roleCheck = await client.query(`SELECT tableowner FROM pg_tables WHERE tablename = 'organizations';`);
    if (roleCheck.rows[0].tableowner === 'app_runtime') {
      throw new Error("app_runtime is the owner of the tables, which bypasses RLS. Fix ownership.");
    }
    console.log("Role verification passed: app_runtime is not the table owner.");

    const res = await client.query(`
      SELECT
        c.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default
      FROM information_schema.columns c
      JOIN information_schema.tables t ON c.table_name = t.table_name
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
    `);

    const tablesMetadata: Record<string, ColumnMetadata[]> = {};
    for (const row of res.rows) {
      if (!tablesMetadata[row.table_name]) {
        tablesMetadata[row.table_name] = [];
      }
      tablesMetadata[row.table_name].push(row);
    }

    await client.query("SET ROLE postgres");
    await client.query("SET session_replication_role = 'replica'");

    const orgAId = randomUUID();
    const orgBId = randomUUID();

    const fkMap: Record<string, { A: string; B: string }> = {
      organization_id: { A: orgAId, B: orgBId },
      tenant_id: { A: orgAId, B: orgBId },
    };

    function getDefaultValue(col: ColumnMetadata, isForA: boolean, tableName: string) {
      if (col.column_name === 'tenant_id' || col.column_name === 'organization_id') {
        return isForA ? orgAId : orgBId;
      }
      if (fkMap[col.column_name]) {
        return isForA ? fkMap[col.column_name].A : fkMap[col.column_name].B;
      }
      if (col.column_name === 'max_attempts' && tableName === 'crawl_jobs') return 1;
      if (col.column_name === 'version' && tableName === 'crawl_jobs') return 1;
      if (col.column_name === 'finding_type') return 'technical_gap';
      if (col.column_name === 'status' && tableName === 'crawl_jobs') return 'PENDING';
      if (col.column_name === 'cache_scope' && tableName === 'crawl_cache') return 'tenant';
      if (col.column_name === 'cache_outcome' && tableName === 'crawl_jobs') return 'MISS';

      switch (col.data_type) {
        case "text":
        case "character varying":
          return `test_${col.column_name}_${isForA ? "A" : "B"}`;
        case "boolean":
          return false;
        case "integer":
        case "bigint":
        case "numeric":
        case "double precision":
          return 0;
        case "jsonb":
        case "json":
          return '{}';
        case "USER-DEFINED":
          if (tableName === 'document_embeddings' && col.column_name === 'embedding') {
            return MOCK_VECTOR;
          }
          return '1.0';
        case "uuid":
          return randomUUID();
        case "ARRAY":
          return '{}';
        case "timestamp with time zone":
        case "timestamp without time zone":
          return new Date('2026-01-01T00:00:00Z');
        default:
          return '1';
      }
    }

    const rowsMapA: Record<string, string> = {};
    const rowsMapB: Record<string, string> = {};

    console.log(`Verifying ${TENANT_SCOPED_TABLES.length} tenant tables...`);
    for (const tableName of TENANT_SCOPED_TABLES) {
      const columns = tablesMetadata[tableName];
      if (!columns) throw new Error(`Table ${tableName} not found in metadata`);

      const requiredCols = columns.filter(c => c.is_nullable === 'NO' && c.column_default === null && c.column_name !== 'id');
      const colNames = ['id', ...requiredCols.map(c => c.column_name)];
      const idA = tableName === 'organizations' ? orgAId : randomUUID();
      const idB = tableName === 'organizations' ? orgBId : randomUUID();
      const valA = [idA, ...requiredCols.map(c => getDefaultValue(c, true, tableName))];
      const valB = [idB, ...requiredCols.map(c => getDefaultValue(c, false, tableName))];

      rowsMapA[tableName] = idA;
      rowsMapB[tableName] = idB;

      const placeholders = colNames.map((colName, i) => {
        if (tableName === 'document_embeddings' && colName === 'embedding') return `$${i + 1}::vector(768)`;
        if (colName === 'policy' || colName === 'result' || colName === 'normalized_result' || colName === 'crawl_policy' || colName === 'snapshot_metadata' || colName === 'event_metadata' || colName === 'properties' || colName === 'capabilities' || colName === 'metadata') return `$${i + 1}::jsonb`;
        return `$${i + 1}`;
      }).join(', ');

      if (tableName === 'organization_members') {
        await client.query(`INSERT INTO organization_members (id, organization_id, user_id, role) VALUES ($1, $2, $3, 'owner')`, [idA, orgAId, randomUUID()]);
        await client.query(`INSERT INTO organization_members (id, organization_id, user_id, role) VALUES ($1, $2, $3, 'owner')`, [idB, orgBId, randomUUID()]);
        continue;
      }

      try {
        await client.query(`INSERT INTO ${tableName} (${colNames.join(', ')}) VALUES (${placeholders})`, valA);
        await client.query(`INSERT INTO ${tableName} (${colNames.join(', ')}) VALUES (${placeholders})`, valB);
      } catch (error: unknown) {
        const err = error as Error & { code?: string };
        console.error(`Failed to insert fixture into ${tableName}: ${err.message}`);
        throw err;
      }
    }

    await client.query("SET session_replication_role = 'origin'");
    console.log("Fixtures inserted successfully.");

    let success = true;
    let assertionsCount = 0;

    for (const tableName of TENANT_SCOPED_TABLES) {
      await client.query("SET ROLE app_runtime");

      const idA = rowsMapA[tableName];
      const idB = rowsMapB[tableName];
      const tenantCol = tableName === 'organizations' ? 'id' : (tablesMetadata[tableName].some(c => c.column_name === 'tenant_id') ? 'tenant_id' : 'organization_id');

      await client.query("RESET app.current_tenant_id");

      try {
        const resNoTenant = await client.query(`SELECT count(*) FROM ${tableName}`);
        assertionsCount++;
        if (parseInt(resNoTenant.rows[0].count, 10) !== 0) {
          console.error(`❌ Table ${tableName}: returned ${resNoTenant.rows[0].count} rows with NO tenant context (expected 0)`);
          success = false;
        }
      } catch(error: unknown) {
        const err = error as Error & { code?: string };
        if (err.code === '42501') {
          assertionsCount++;
        } else {
          console.error(`❌ Table ${tableName}: App_runtime cannot select: ${err.message}`);
          success = false;
        }
      }

      await client.query("BEGIN");
      await client.query("SAVEPOINT unset_insert");
      let unsetInsertAllowed = false;
      let unsetErrCode = null;
      try {
        const columns = tablesMetadata[tableName];
        const requiredCols = columns.filter(c => c.is_nullable === 'NO' && c.column_default === null && c.column_name !== 'id');
        const colNames = ['id', ...requiredCols.map(c => c.column_name)];
        const placeholders = colNames.map((colName, i) => {
          if (tableName === 'document_embeddings' && colName === 'embedding') return `$${i + 1}::vector(768)`;
          if (colName === 'policy' || colName === 'result' || colName === 'normalized_result' || colName === 'crawl_policy' || colName === 'snapshot_metadata' || colName === 'event_metadata' || colName === 'properties' || colName === 'capabilities' || colName === 'metadata') return `$${i + 1}::jsonb`;
          return `$${i + 1}`;
        }).join(', ');
        const idANew = randomUUID();
        const valA = [idANew, ...requiredCols.map(c => getDefaultValue(c, true, tableName))];

        if (tableName !== 'organization_members' && tableName !== 'organizations') {
          await client.query(`INSERT INTO ${tableName} (${colNames.join(', ')}) VALUES (${placeholders})`, valA);
          unsetInsertAllowed = true;
        }
      } catch (error: unknown) {
        const err = error as Error & { code?: string }; unsetErrCode = err.code; }
      finally { await client.query("ROLLBACK TO SAVEPOINT unset_insert"); await client.query("COMMIT"); }

      if (unsetInsertAllowed) {
        console.error(`❌ Table ${tableName}: Allowed INSERT with NO tenant context!`);
        success = false;
      } else if (unsetErrCode !== '42501' && tableName !== 'organization_members' && tableName !== 'organizations') {
        console.error(`❌ Table ${tableName}: Expected RLS policy violation (42501) but got ${unsetErrCode}`);
        success = false;
      } else if (unsetErrCode === '42501') {
        console.log(`✅ Table ${tableName}: Caught expected RLS violation 42501 for unset insert.`);
      }
      assertionsCount++;

      await client.query(`SET app.current_tenant_id = '${orgAId}'`);

      try {
        const resTenantA = await client.query(`SELECT count(*) FROM ${tableName} WHERE id = '${idA}'`);
        assertionsCount++;
        if (parseInt(resTenantA.rows[0].count, 10) === 0) {
          console.error(`❌ Table ${tableName}: returned 0 rows for Tenant A (expected 1)`);
          success = false;
        }
      } catch (error: unknown) {
        const err = error as Error & { code?: string };
         console.error(`❌ Table ${tableName}: App_runtime cannot select A: ${err.message}`);
         success = false;
      }

      const resTenantB = await client.query(`SELECT count(*) FROM ${tableName} WHERE id = '${idB}'`);
      assertionsCount++;
      if (parseInt(resTenantB.rows[0].count, 10) !== 0) {
        console.error(`❌ Table ${tableName}: Tenant A context saw Tenant B rows!`);
        success = false;
      }

      if (tablesMetadata[tableName].some(c => c.column_name === 'updated_at')) {
        const updateB = await client.query(`UPDATE ${tableName} SET updated_at = NOW() WHERE ${tenantCol} = '${orgBId}'`);
        assertionsCount++;
        if (updateB.rowCount !== 0) {
          console.error(`❌ Table ${tableName}: Tenant A context updated Tenant B rows!`);
          success = false;
        }
      }

      const delB = await client.query(`DELETE FROM ${tableName} WHERE ${tenantCol} = '${orgBId}'`);
      assertionsCount++;
      if (delB.rowCount !== 0) {
        console.error(`❌ Table ${tableName}: Tenant A context deleted Tenant B rows!`);
        success = false;
      }

      await client.query("BEGIN");
      await client.query("SAVEPOINT neg_insert");
      let negInsertAllowed = false;
      let negErrCode = null;
      try {
        const columns = tablesMetadata[tableName];
        const requiredCols = columns.filter(c => c.is_nullable === 'NO' && c.column_default === null && c.column_name !== 'id');
        const colNames = ['id', ...requiredCols.map(c => c.column_name)];
        const placeholders = colNames.map((colName, i) => {
          if (tableName === 'document_embeddings' && colName === 'embedding') return `$${i + 1}::vector(768)`;
          if (colName === 'policy' || colName === 'result' || colName === 'normalized_result' || colName === 'crawl_policy' || colName === 'snapshot_metadata' || colName === 'event_metadata' || colName === 'properties' || colName === 'capabilities' || colName === 'metadata') return `$${i + 1}::jsonb`;
          return `$${i + 1}`;
        }).join(', ');
        const idBNew = randomUUID();
        const valB = [idBNew, ...requiredCols.map(c => getDefaultValue(c, false, tableName))];

        if (tableName !== 'organization_members' && tableName !== 'organizations') {
          await client.query(`INSERT INTO ${tableName} (${colNames.join(', ')}) VALUES (${placeholders})`, valB);
          negInsertAllowed = true;
        }
      } catch (error: unknown) {
        const err = error as Error & { code?: string }; negErrCode = err.code; }
      finally { await client.query("ROLLBACK TO SAVEPOINT neg_insert"); await client.query("COMMIT"); }

      if (negInsertAllowed) {
        console.error(`❌ Table ${tableName}: Tenant A context inserted Tenant B row!`);
        success = false;
      } else if (negErrCode !== '42501' && tableName !== 'organization_members' && tableName !== 'organizations') {
        console.error(`❌ Table ${tableName}: Expected RLS policy violation (42501) but got ${negErrCode}`);
        success = false;
      } else if (negErrCode === '42501') {
        console.log(`✅ Table ${tableName}: Caught expected RLS violation 42501 for cross-tenant insert.`);
      }
      assertionsCount++;

      if (tablesMetadata[tableName].some(c => c.column_name === 'updated_at')) {
        const updateA = await client.query(`UPDATE ${tableName} SET updated_at = NOW() WHERE id = '${idA}'`);
        assertionsCount++;
        if (updateA.rowCount === 0) {
          console.error(`❌ Table ${tableName}: Tenant A context failed to update Tenant A row!`);
          success = false;
        }
      }

      if (tableName !== 'organizations' && tableName !== 'organization_members') {
        const delA = await client.query(`DELETE FROM ${tableName} WHERE id = '${idA}'`);
        assertionsCount++;
        if (delA.rowCount === 0) {
          console.error(`❌ Table ${tableName}: Tenant A context failed to delete Tenant A row!`);
          success = false;
        }
      }

      await client.query("BEGIN");
      await client.query("SAVEPOINT pos_insert");
      let posInsertAllowed = true;
      try {
        const columns = tablesMetadata[tableName];
        const requiredCols = columns.filter(c => c.is_nullable === 'NO' && c.column_default === null && c.column_name !== 'id');
        const colNames = ['id', ...requiredCols.map(c => c.column_name)];
        const placeholders = colNames.map((colName, i) => {
          if (tableName === 'document_embeddings' && colName === 'embedding') return `$${i + 1}::vector(768)`;
          if (colName === 'policy' || colName === 'result' || colName === 'normalized_result' || colName === 'crawl_policy' || colName === 'snapshot_metadata' || colName === 'event_metadata' || colName === 'properties' || colName === 'capabilities' || colName === 'metadata') return `$${i + 1}::jsonb`;
          return `$${i + 1}`;
        }).join(', ');
        const idANew = randomUUID();
        const valA = [idANew, ...requiredCols.map(c => getDefaultValue(c, true, tableName))];

        if (tableName !== 'organization_members' && tableName !== 'organizations') {
          await client.query(`INSERT INTO ${tableName} (${colNames.join(', ')}) VALUES (${placeholders})`, valA);
        }
      } catch (error: unknown) {
        const err = error as Error & { code?: string };
        if (err.code !== '23503' && err.code !== '23514' && err.code !== '23505') {
          console.error(`❌ Table ${tableName} positive insert failed: ${err.message} (Code: ${err.code})`);
          posInsertAllowed = false;
        }
      } finally {
        await client.query("ROLLBACK TO SAVEPOINT pos_insert");
        await client.query("COMMIT");
      }

      if (!posInsertAllowed) {
        console.error(`❌ Table ${tableName}: Tenant A context failed to insert Tenant A row!`);
        success = false;
      }
      assertionsCount++;

      await client.query("RESET ROLE");
    }

    console.log(`\nVerifying ${GLOBAL_TABLES.length} global tables (intentionally excluded from isolation)...`);
    for (const tableName of GLOBAL_TABLES) {
      await client.query("SET ROLE app_runtime");
      await client.query("RESET app.current_tenant_id");

      try {
        await client.query(`SELECT count(*) FROM ${tableName}`);
        assertionsCount++;
      } catch(error: unknown) {
        const err = error as Error & { code?: string };
        console.error(`❌ Global table ${tableName} is NOT readable by app_runtime: ${err.message}`);
        success = false;
      }
      await client.query("RESET ROLE");
    }

    if (success) {
      console.log(`✅ All isolation suites passed! Covered ${TENANT_SCOPED_TABLES.length} tenant tables with ${assertionsCount} assertions.`);
    } else {
      console.error(`❌ Isolation suite failed.`);
      process.exit(1);
    }

  } finally {
    client.release();
    await pool.end();
  }
}

runTest().catch(err => {
  console.error(err);
  process.exit(1);
});
