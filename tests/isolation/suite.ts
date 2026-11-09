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
  "system_configurations"
];

const TENANT_JUNCTION_TABLES = [
  { table: "pages_keywords", leftColumn: "page_id", leftTable: "pages", rightColumn: "keyword_id", rightTable: "keywords" },
  { table: "pages_topics", leftColumn: "page_id", leftTable: "pages", rightColumn: "topic_id", rightTable: "topics" },
  { table: "pages_entities", leftColumn: "page_id", leftTable: "pages", rightColumn: "entity_id", rightTable: "entities" },
  { table: "keywords_topics", leftColumn: "keyword_id", leftTable: "keywords", rightColumn: "topic_id", rightTable: "topics" },
  { table: "topics_entities", leftColumn: "topic_id", leftTable: "topics", rightColumn: "entity_id", rightTable: "entities" },
] as const;
const TENANT_JUNCTION_TABLE_NAMES = new Set<string>(TENANT_JUNCTION_TABLES.map(({ table }) => table));
const REGULAR_TENANT_TABLES = TENANT_SCOPED_TABLES.filter((tableName) => !TENANT_JUNCTION_TABLE_NAMES.has(tableName));

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

    // Verify the effective PostgreSQL catalog state after applying migrations.
    // This complements static migration checks: a migration can exist while the
    // resulting database is missing RLS flags or has incomplete policy coverage.
    const rlsState = await client.query(
      `
        SELECT c.relname AS table_name, c.relrowsecurity, c.relforcerowsecurity
        FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind IN ('r', 'p')
          AND c.relname = ANY($1::text[])
      `,
      [TENANT_SCOPED_TABLES],
    );
    const rlsByTable = new Map<
      string,
      { table_name: string; relrowsecurity: boolean; relforcerowsecurity: boolean }
    >(
      rlsState.rows.map((row: { table_name: string; relrowsecurity: boolean; relforcerowsecurity: boolean }) => [
        row.table_name,
        row,
      ] as const),
    );
    const missingRlsState = TENANT_SCOPED_TABLES.filter((tableName) => {
      const state = rlsByTable.get(tableName);
      return !state || !state.relrowsecurity || !state.relforcerowsecurity;
    });
    if (missingRlsState.length > 0) {
      throw new Error(
        `RLS catalog verification failed: ENABLE and FORCE must both be active for every tenant table. Invalid tables: ${missingRlsState.join(", ")}`,
      );
    }
    console.log(`RLS catalog verification passed: ENABLE and FORCE active on all ${TENANT_SCOPED_TABLES.length} tenant tables.`);

    const policyState = await client.query(
      `
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_catalog.pg_policies
        WHERE schemaname = 'public'
          AND tablename = ANY($1::text[])
      `,
      [TENANT_SCOPED_TABLES],
    );
    const policiesByTable = new Map<string, typeof policyState.rows>();
    for (const policy of policyState.rows) {
      const tablePolicies = policiesByTable.get(policy.tablename) ?? [];
      tablePolicies.push(policy);
      policiesByTable.set(policy.tablename, tablePolicies);
    }

    const requiredPolicyExpressions: Record<string, "qual" | "with_check" | "both"> = {
      SELECT: "qual",
      INSERT: "with_check",
      UPDATE: "both",
      DELETE: "qual",
    };
    const policyFailures: string[] = [];
    for (const tableName of TENANT_SCOPED_TABLES) {
      const policies = policiesByTable.get(tableName) ?? [];
      for (const [operation, expressionRequirement] of Object.entries(requiredPolicyExpressions)) {
        const appliesToRuntime = (policy: (typeof policies)[number]) => {
          const roles = (policy.roles as string[] | null) ?? [];
          return roles.includes("public") || roles.includes("app_runtime");
        };
        const commandApplies = (policy: (typeof policies)[number]) => {
          const command = String(policy.cmd).toUpperCase();
          return command === operation || command === "ALL";
        };
        const applicablePermissivePolicies = policies.filter((policy) =>
          String(policy.permissive).toUpperCase() === "PERMISSIVE" &&
          appliesToRuntime(policy) &&
          commandApplies(policy)
        );

        const usesTenantContext = (expression: unknown) =>
          typeof expression === "string" &&
          /current_setting\s*\(\s*'app\.current_tenant_id'(?:\s*::\s*text)?\s*,\s*true\s*\)/i.test(expression);
        const effectiveWithCheck = (policy: (typeof policies)[number]) => {
          if (typeof policy.with_check === "string") return policy.with_check;

          // PostgreSQL reuses USING as WITH CHECK for ALL and UPDATE policies
          // when WITH CHECK is omitted. Do not apply this fallback to INSERT-only
          // policies, where WITH CHECK is the required new-row expression.
          const command = String(policy.cmd).toUpperCase();
          return command === "ALL" || command === "UPDATE" ? policy.qual : null;
        };
        const policyHasTenantContext = (policy: (typeof policies)[number]) => {
          if (expressionRequirement === "qual") return usesTenantContext(policy.qual);
          if (expressionRequirement === "with_check") return usesTenantContext(effectiveWithCheck(policy));
          return usesTenantContext(policy.qual) && usesTenantContext(effectiveWithCheck(policy));
        };

        // PostgreSQL ORs PERMISSIVE policies together. Every applicable
        // permissive policy must be tenant-scoped, not merely one of them.
        if (applicablePermissivePolicies.length === 0) {
          policyFailures.push(`${tableName}:${operation}:no-applicable-permissive-policy`);
        } else {
          const unscopedPolicies = applicablePermissivePolicies.filter(
            (policy) => !policyHasTenantContext(policy),
          );
          if (unscopedPolicies.length > 0) {
            policyFailures.push(
              `${tableName}:${operation}:unscoped-permissive-policy(${unscopedPolicies.map((policy) => policy.policyname).join(", ")})`,
            );
          }
        }
      }
    }

    if (policyFailures.length > 0) {
      const samplePolicies = policiesByTable.get("aeo_analyses") ?? [];
      throw new Error(
        `RLS policy catalog verification failed: tenant-context policies are missing or incomplete for ${policyFailures.join(", ")}. Sample catalog policies: ${JSON.stringify(samplePolicies.slice(0, 4))}`,
      );
    }
    console.log(`RLS policy catalog verification passed: SELECT/INSERT/UPDATE/DELETE tenant-context policies verified on all ${TENANT_SCOPED_TABLES.length} tenant tables.`);

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
    for (const tableName of REGULAR_TENANT_TABLES) {
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

    for (const junction of TENANT_JUNCTION_TABLES) {
      const insertSql = `INSERT INTO ${junction.table} (${junction.leftColumn}, ${junction.rightColumn}, organization_id) VALUES ($1, $2, $3)`;
      await client.query(insertSql, [rowsMapA[junction.leftTable], rowsMapA[junction.rightTable], orgAId]);
      await client.query(insertSql, [rowsMapB[junction.leftTable], rowsMapB[junction.rightTable], orgBId]);
    }

    await client.query("SET session_replication_role = 'origin'");
    console.log("Fixtures inserted successfully.");

    let success = true;
    let assertionsCount = 0;

    for (const tableName of REGULAR_TENANT_TABLES) {
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

    // The regular-table checks above intentionally delete their tenant-A
    // fixtures. Recreate only the junction parents with the same IDs so the
    // relationship tests have valid FK targets without weakening constraints.
    await client.query("SET session_replication_role = 'replica'");
    const junctionParentTables = new Set(
      TENANT_JUNCTION_TABLES.flatMap(({ leftTable, rightTable }) => [leftTable, rightTable]),
    );
    for (const tableName of junctionParentTables) {
      const columns = tablesMetadata[tableName];
      const requiredCols = columns.filter(
        (column) => column.is_nullable === "NO" && column.column_default === null && column.column_name !== "id",
      );
      const colNames = ["id", ...requiredCols.map((column) => column.column_name)];
      const placeholders = colNames.map((colName, index) => {
        if (
          colName === "policy" || colName === "result" || colName === "normalized_result" ||
          colName === "crawl_policy" || colName === "snapshot_metadata" || colName === "event_metadata" ||
          colName === "properties" || colName === "capabilities" || colName === "metadata"
        ) return "$" + (index + 1) + "::jsonb";
        return "$" + (index + 1);
      }).join(", ");
      const valuesA = [rowsMapA[tableName], ...requiredCols.map((column) => getDefaultValue(column, true, tableName))];
      await client.query(
        "INSERT INTO " + tableName + " (" + colNames.join(", ") + ") VALUES (" + placeholders + ")",
        valuesA,
      );
    }
    // Deleting each parent fixture cascades to its junction rows. Recreate
    // tenant A's links after restoring the parent IDs for the focused checks.
    for (const junction of TENANT_JUNCTION_TABLES) {
      await client.query(
        "INSERT INTO " + junction.table + " (" + junction.leftColumn + ", " + junction.rightColumn + ", organization_id) VALUES ($1, $2, $3)",
        [rowsMapA[junction.leftTable], rowsMapA[junction.rightTable], orgAId],
      );
    }
    await client.query("SET session_replication_role = 'origin'");

    for (const junction of TENANT_JUNCTION_TABLES) {
      const tableName = junction.table;
      const insertSql = `INSERT INTO ${tableName} (${junction.leftColumn}, ${junction.rightColumn}, organization_id) VALUES ($1, $2, $3)`;
      const valuesA = [rowsMapA[junction.leftTable], rowsMapA[junction.rightTable], orgAId];
      const valuesB = [rowsMapB[junction.leftTable], rowsMapB[junction.rightTable], orgBId];
      const keyPredicate = `${junction.leftColumn} = $1 AND ${junction.rightColumn} = $2 AND organization_id = $3`;

      await client.query("SET ROLE app_runtime");
      await client.query("RESET app.current_tenant_id");

      const noTenantRead = await client.query(`SELECT count(*) FROM ${tableName}`);
      assertionsCount++;
      if (Number(noTenantRead.rows[0].count) !== 0) {
        console.error(`❌ ${tableName}: rows were visible without tenant context.`);
        success = false;
      }

      await client.query("BEGIN");
      await client.query("SAVEPOINT junction_unset_insert");
      let unsetInsertError: string | null = null;
      try {
        await client.query(insertSql, valuesB);
      } catch (error: unknown) {
        unsetInsertError = (error as { code?: string }).code ?? null;
      }
      await client.query("ROLLBACK TO SAVEPOINT junction_unset_insert");
      await client.query("COMMIT");
      assertionsCount++;
      if (unsetInsertError !== "42501") {
        console.error(`❌ ${tableName}: expected RLS denial for INSERT without tenant context, got ${unsetInsertError ?? "success"}.`);
        success = false;
      }

      await client.query("SELECT set_config('app.current_tenant_id', $1, false)", [orgAId]);
      const readA = await client.query(`SELECT count(*) FROM ${tableName} WHERE organization_id = $1`, [orgAId]);
      const readB = await client.query(`SELECT count(*) FROM ${tableName} WHERE organization_id = $1`, [orgBId]);
      assertionsCount += 2;
      if (Number(readA.rows[0].count) !== 1 || Number(readB.rows[0].count) !== 0) {
        console.error(`❌ ${tableName}: tenant A did not see exactly its own relationship row.`);
        success = false;
      }

      await client.query("BEGIN");
      await client.query("SAVEPOINT junction_cross_insert");
      let crossInsertError: string | null = null;
      try {
        await client.query(insertSql, valuesB);
      } catch (error: unknown) {
        crossInsertError = (error as { code?: string }).code ?? null;
      }
      await client.query("ROLLBACK TO SAVEPOINT junction_cross_insert");
      await client.query("COMMIT");
      assertionsCount++;
      if (crossInsertError !== "42501") {
        console.error(`❌ ${tableName}: tenant A was not blocked from inserting tenant B's relationship.`);
        success = false;
      }

      // A matching organization_id alone must not permit references to either
      // side of a relationship owned by another tenant. Composite foreign keys
      // enforce this independently of RLS visibility.
      const mismatchedParentReferences = [
        {
          label: "left parent",
          values: [rowsMapB[junction.leftTable], rowsMapA[junction.rightTable], orgAId],
        },
        {
          label: "right parent",
          values: [rowsMapA[junction.leftTable], rowsMapB[junction.rightTable], orgAId],
        },
      ];
      for (const mismatch of mismatchedParentReferences) {
        await client.query("BEGIN");
        await client.query("SAVEPOINT junction_cross_tenant_reference");
        let referenceError: string | null = null;
        try {
          await client.query(insertSql, mismatch.values);
        } catch (error: unknown) {
          referenceError = (error as { code?: string }).code ?? null;
        }
        await client.query("ROLLBACK TO SAVEPOINT junction_cross_tenant_reference");
        await client.query("COMMIT");
        assertionsCount++;
        if (referenceError !== "23503") {
          console.error(`❌ ${tableName}: ${mismatch.label} from another tenant was not rejected by the composite foreign key (got ${referenceError ?? "success"}).`);
          success = false;
        }
      }

      const updateA = await client.query(
        `UPDATE ${tableName} SET created_at = NOW() WHERE ${keyPredicate}`,
        [valuesA[0], valuesA[1], orgAId],
      );
      assertionsCount++;
      if (updateA.rowCount !== 1) {
        console.error(`❌ ${tableName}: tenant A could not update its own relationship.`);
        success = false;
      }

      await client.query("BEGIN");
      await client.query("SAVEPOINT junction_transfer_ownership");
      let transferError: string | null = null;
      try {
        await client.query(
          `UPDATE ${tableName} SET organization_id = $1 WHERE ${junction.leftColumn} = $2 AND ${junction.rightColumn} = $3 AND organization_id = $4`,
          [orgBId, valuesA[0], valuesA[1], orgAId],
        );
      } catch (error: unknown) {
        transferError = (error as { code?: string }).code ?? null;
      }
      await client.query("ROLLBACK TO SAVEPOINT junction_transfer_ownership");
      await client.query("COMMIT");
      assertionsCount++;
      if (transferError !== "42501") {
        console.error(`❌ ${tableName}: UPDATE was allowed to transfer a row to another organization.`);
        success = false;
      }

      const deleteB = await client.query(`DELETE FROM ${tableName} WHERE organization_id = $1`, [orgBId]);
      assertionsCount++;
      if (deleteB.rowCount !== 0) {
        console.error(`❌ ${tableName}: tenant A deleted a tenant B relationship.`);
        success = false;
      }

      const deleteA = await client.query(`DELETE FROM ${tableName} WHERE ${keyPredicate}`, [valuesA[0], valuesA[1], orgAId]);
      assertionsCount++;
      if (deleteA.rowCount !== 1) {
        console.error(`❌ ${tableName}: tenant A could not delete its own relationship.`);
        success = false;
      }

      const insertA = await client.query(insertSql, valuesA);
      assertionsCount++;
      if (insertA.rowCount !== 1) {
        console.error(`❌ ${tableName}: tenant A could not insert its own relationship.`);
        success = false;
      }
      await client.query(`DELETE FROM ${tableName} WHERE ${keyPredicate}`, [valuesA[0], valuesA[1], orgAId]);

      await client.query("RESET app.current_tenant_id");
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
