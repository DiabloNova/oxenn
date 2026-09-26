const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const ORG_A = '11111111-1111-1111-1111-111111111111';
const ORG_B = '22222222-2222-2222-2222-222222222222';

const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'oxenn_test',
};

const tableConfigs = [
  {
    table: 'brands',
    tenantCol: 'organization_id',
    colType: 'uuid',
    familyDesc: 'ENABLE-only generated (`organization_id` uuid)',
    insertSql: (newId) => `INSERT INTO brands (id, organization_id, name, canonical_domain, aliases, industry, target_markets, created_at, updated_at, created_by, updated_by, version) VALUES ('${newId}', '${ORG_B}', 'Brand B2', 'brandb2.com', '{}', 'tech', '{}', NOW(), NOW(), 'system', 'system', 1)`,
    updateSql: `UPDATE brands SET name = 'Brand B Updated' WHERE organization_id = '${ORG_B}'`,
    deleteSql: `DELETE FROM brands WHERE id = 'b2222222-2222-2222-2222-222222222222'`,
  },
  {
    table: 'document_embeddings',
    tenantCol: 'tenant_id',
    colType: 'uuid',
    familyDesc: 'ENABLE-only generated (`tenant_id` uuid)',
    insertSql: (newId) => `INSERT INTO document_embeddings (id, tenant_id, content_chunk, metadata, embedding, created_at) VALUES ('${newId}', '${ORG_B}', 'Doc B2', '{}', array_fill(0.2::real, ARRAY[768])::vector, NOW())`,
    updateSql: `UPDATE document_embeddings SET content_chunk = 'Doc B Updated' WHERE tenant_id = '${ORG_B}'`,
    deleteSql: `DELETE FROM document_embeddings WHERE id = 'b2222222-2222-2222-2222-222222222222'`,
  },
  {
    table: 'document_embeddings_forced',
    tenantCol: 'tenant_id',
    colType: 'uuid',
    familyDesc: 'FORCED RLS variant (`tenant_id` uuid)',
    insertSql: (newId) => `INSERT INTO document_embeddings_forced (id, tenant_id, content_chunk, metadata, embedding, created_at) VALUES ('${newId}', '${ORG_B}', 'Doc B2', '{}', array_fill(0.2::real, ARRAY[768])::vector, NOW())`,
    updateSql: `UPDATE document_embeddings_forced SET content_chunk = 'Doc B Updated' WHERE tenant_id = '${ORG_B}'`,
    deleteSql: `DELETE FROM document_embeddings_forced WHERE id = 'b2222222-2222-2222-2222-222222222222'`,
  },
  {
    table: 'crawl_jobs',
    tenantCol: 'tenant_id',
    colType: 'text',
    familyDesc: 'ENABLE-only text tenant policy (`tenant_id` text)',
    insertSql: (newId) => `INSERT INTO crawl_jobs (id, tenant_id, requested_url, normalized_url, policy, dedup_key, cache_key, priority, status, attempts, max_attempts, created_at, updated_at, version) VALUES ('${newId}', '${ORG_B}', 'https://b2.com', 'https://b2.com', '{}', 'dedup_b2_${newId.substring(0,8)}', 'ck_b2', 1, 'SUCCEEDED', 1, 3, NOW(), NOW(), 1)`,
    updateSql: `UPDATE crawl_jobs SET requested_url = 'https://b-updated.com' WHERE tenant_id = '${ORG_B}'`,
    deleteSql: `DELETE FROM crawl_jobs WHERE id = 'b2222222-3333-2222-2222-222222222222'`,
  },
  {
    table: 'websites',
    tenantCol: 'organization_id',
    colType: 'uuid',
    familyDesc: 'ENABLE-only non-whitelisted (`organization_id` uuid)',
    insertSql: (newId) => `INSERT INTO websites (id, organization_id, domain, normalized_url, status, created_at, updated_at, created_by, updated_by, version) VALUES ('${newId}', '${ORG_B}', 'b2.com', 'https://b2.com', 'ACTIVE', NOW(), NOW(), 'system', 'system', 1)`,
    updateSql: `UPDATE websites SET domain = 'b-updated.com' WHERE organization_id = '${ORG_B}'`,
    deleteSql: `DELETE FROM websites WHERE id = 'b2222222-4444-2222-2222-222222222222'`,
  },
  {
    table: 'users',
    tenantCol: null,
    colType: null,
    familyDesc: 'No RLS (`users` table)',
    insertSql: (newId) => `INSERT INTO users (id, name, email, created_at, updated_at) VALUES ('user_b2_${newId.substring(0,8)}', 'User B2', 'user_b2@org-b.com', NOW(), NOW())`,
    updateSql: `UPDATE users SET name = 'User B Updated' WHERE id = 'user_b'`,
    deleteSql: `DELETE FROM users WHERE id = 'user_b'`,
  }
];

const roles = [
  { name: 'r_owner', user: 'r_owner', password: 'r_owner_pass' },
  { name: 'r_nonowner', user: 'r_nonowner', password: 'r_nonowner_pass' }
];

const tenantStates = [
  { name: 'unset', setSql: null },
  { name: 'set to A', setSql: `SET LOCAL app.current_tenant_id = '${ORG_A}';` }
];

async function runMatrix() {
  const transcriptLines = [];
  const matrixResults = [];

  transcriptLines.push(`-- RLS Matrix Verification Transcript`);
  transcriptLines.push(`-- Generated at: ${new Date().toISOString()}\n`);

  let uuidCounter = 1000;

  for (const roleObj of roles) {
    const client = new Client({
      ...dbConfig,
      user: roleObj.user,
      password: roleObj.password,
    });
    await client.connect();

    for (const tenantState of tenantStates) {
      for (const tConfig of tableConfigs) {
        const ops = [
          {
            name: 'SELECT all',
            sql: `SELECT COUNT(*)::int AS cnt FROM ${tConfig.table};`,
            type: 'SELECT_ALL'
          },
          {
            name: 'SELECT WHERE org=B',
            sql: tConfig.tenantCol
              ? `SELECT COUNT(*)::int AS cnt FROM ${tConfig.table} WHERE ${tConfig.tenantCol} = '${ORG_B}';`
              : `SELECT COUNT(*)::int AS cnt FROM ${tConfig.table} WHERE id = 'user_b';`,
            type: 'SELECT_ORG_B'
          },
          {
            name: 'INSERT org=B',
            sqlGen: () => {
              uuidCounter++;
              const newUuid = `f0000000-0000-0000-0000-${String(uuidCounter).padStart(12, '0')}`;
              return tConfig.insertSql(newUuid);
            },
            type: 'INSERT'
          },
          {
            name: 'UPDATE B-row',
            sql: tConfig.updateSql,
            type: 'UPDATE'
          },
          {
            name: 'DELETE B-row',
            sql: tConfig.deleteSql,
            type: 'DELETE'
          }
        ];

        for (const op of ops) {
          const sqlToRun = op.sqlGen ? op.sqlGen() : op.sql;

          transcriptLines.push(`-- Role: ${roleObj.name} | Tenant: ${tenantState.name} | Table: ${tConfig.table} | Op: ${op.name}`);
          transcriptLines.push(`BEGIN;`);
          if (tenantState.setSql) {
            transcriptLines.push(tenantState.setSql);
          }
          transcriptLines.push(sqlToRun);
          transcriptLines.push(`ROLLBACK;\n`);

          let status = 'UNKNOWN';
          let rowsCount = 0;
          let detail = '';

          try {
            await client.query('BEGIN;');
            if (tenantState.setSql) {
              await client.query(tenantState.setSql);
            }

            const res = await client.query(sqlToRun);
            await client.query('ROLLBACK;');

            if (op.type === 'SELECT_ALL' || op.type === 'SELECT_ORG_B') {
              rowsCount = res.rows[0].cnt;
              status = 'ALLOWED';
              detail = `rows=${rowsCount}`;
            } else {
              rowsCount = res.rowCount;
              status = 'ALLOWED';
              detail = `rows_affected=${rowsCount}`;
            }
          } catch (err) {
            try {
              await client.query('ROLLBACK;');
            } catch (rErr) {}

            status = 'DENIED';
            detail = `ERR ${err.code}: ${err.message}`;
          }

          matrixResults.push({
            role: roleObj.name,
            tenantState: tenantState.name,
            table: tConfig.table,
            familyDesc: tConfig.familyDesc,
            op: op.name,
            status,
            rowsCount,
            detail
          });
        }
      }
    }
    await client.end();
  }

  // Save transcript
  fs.writeFileSync(path.join(__dirname, 'transcript.sql'), transcriptLines.join('\n'));
  fs.writeFileSync(path.join(__dirname, 'matrix_raw.json'), JSON.stringify(matrixResults, null, 2));

  console.log('Matrix suite execution complete. Results written to verification/phase-0/matrix_raw.json and transcript.sql.');
}

runMatrix().catch(console.error);
