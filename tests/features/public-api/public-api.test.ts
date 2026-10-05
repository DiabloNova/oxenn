import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { NextRequest, NextResponse } from "next/server";
import { ApiService, ApiQuotaService, withPublicApi, AuthenticatedApiRequest } from "@/features/public-api/index";
import { createHash } from "crypto";
import { TenantContextManager } from "@/core/database/tenant-context";
import { PostgresClient } from "@/features/admin/infrastructure/persistence/postgres";
import { Pool } from "pg";

describe("Public API & Integration", async () => {
  let apiService: ApiService;
  let apiQuotaService: ApiQuotaService;

  let migrationPool: Pool;
  let tenantId: string;
  let apiKeyId: string;
  let rawSecret: string;

  before(async () => {
    // Setup test DB pools
    migrationPool = new Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });

    apiService = new ApiService();
    apiQuotaService = new ApiQuotaService();

    // Create a tenant for testing bypassing RLS
    const client = await migrationPool.connect();
    try {
      const randSlug = `test-org-${Math.random().toString(36).substring(7)}`;
      const tenantRes = await client.query(`
        INSERT INTO organizations (name, slug, created_at, updated_at)
        VALUES ('test-org', $1, NOW(), NOW()) RETURNING id
      `, [randSlug]);
      tenantId = tenantRes.rows[0].id;

      // Ensure quota row exists
      await client.query(`
        INSERT INTO tenant_quotas (
          tenant_id, monthly_token_limit, used_tokens_this_month,
          max_users, max_brands, max_prompts,
          max_observations_per_month, max_crawl_jobs_per_day, monthly_cost_limit_usd,
          created_at, updated_at
        )
        VALUES ($1, 1000, 0, 10, 10, 10, 10, 10, 10, NOW(), NOW())
      `, [tenantId]);
    } finally {
      client.release();
    }
  });

  after(async () => {
    // Clean up created tenant and related objects
    if (tenantId) {
      const client = await migrationPool.connect();
      try {
        await client.query(`DELETE FROM organizations WHERE id = $1`, [tenantId]);
      } finally {
        client.release();
      }
    }
    await migrationPool.end();
  });

  it("Issue API key securely", async () => {
    const res = await apiService.createApiKey({ organizationId: tenantId, name: "E2E Test Key" });
    assert.equal(res.organizationId, tenantId);
    assert.ok(res.secret.startsWith("seo_"));
    apiKeyId = res.id;
    rawSecret = res.secret;

    await TenantContextManager.runWithSystemContext(null, "sys-admin-run", async () => {
      const client = PostgresClient.getInstance();
      const dbRes = await client.query(`SELECT hash FROM api_keys WHERE id = $1`, [apiKeyId]);
      assert.notEqual(dbRes.rows[0].hash, res.secret);
      const expectedHash = createHash("sha256").update(res.secret).digest("hex");
      assert.equal(dbRes.rows[0].hash, expectedHash);
    });
  });

  it("Middleware: Authentication & successful request (RAG/Ingest proxy)", async () => {
    const req = new NextRequest("http://localhost/api/v1/public/test", {
      headers: { "Authorization": `Bearer ${rawSecret}` }
    });

    let resolvedTenantId = null;
    const res = await withPublicApi(req, async (authReq: AuthenticatedApiRequest) => {
      resolvedTenantId = authReq.tenantId;
      return NextResponse.json({ success: true }, { status: 200 });
    });

    assert.equal(res.status, 200);
    assert.equal(resolvedTenantId, tenantId);
  });

  it("Middleware: Quota enforcement & consumption proxy", async () => {
    const req = new NextRequest("http://localhost/api/v1/public/test", {
      headers: { "Authorization": `Bearer ${rawSecret}` }
    });

    const res = await withPublicApi(req, async () => {
      return NextResponse.json({ success: true }, { status: 200 });
    }, { requireQuotaTokens: 100 });

    assert.equal(res.status, 200);

    await TenantContextManager.runWithSystemContext(null, "sys-admin-run", async () => {
      const client = PostgresClient.getInstance();
      const dbRes = await client.query(`SELECT used_tokens_this_month FROM tenant_quotas WHERE tenant_id = $1`, [tenantId]);
      assert.equal(dbRes.rows[0].used_tokens_this_month, 100);
    });
  });

  it("Concurrency test for atomic quota consumption", async () => {
    // Current limit is 1000, used is 100.
    // Try to consume 100 tokens 10 times concurrently (should succeed).
    // Try 11 times concurrently -> 10 succeed, 1 fails with Usage Limit Exceeded.

    const requests = Array.from({ length: 11 }).map(async () => {
      const req = new NextRequest("http://localhost/api/v1/public/test", {
        headers: { "Authorization": `Bearer ${rawSecret}` }
      });
      return await withPublicApi(req, async () => {
        return NextResponse.json({ success: true }, { status: 200 });
      }, { requireQuotaTokens: 100 });
    });

    const responses = await Promise.all(requests);

    let successCount = 0;
    let limitExceededCount = 0;

    for (const r of responses) {
      if (r.status === 200) {
        successCount++;
      } else if (r.status === 403) {
        const body = await r.json();
        if (body.error.code === "USAGE_LIMIT_EXCEEDED") {
          limitExceededCount++;
        }
      }
    }

    // Limit was 1000. Used was 100. Remaining: 900.
    // Each request consumes 100. So exactly 9 requests can succeed.
    // Total success should be 9. Limit Exceeded should be 2.
    assert.equal(successCount, 9, "9 requests should succeed");
    assert.equal(limitExceededCount, 2, "2 requests should fail due to quota limit");

    await TenantContextManager.runWithSystemContext(null, "sys-admin-run", async () => {
      const client = PostgresClient.getInstance();
      const dbRes = await client.query(`SELECT used_tokens_this_month FROM tenant_quotas WHERE tenant_id = $1`, [tenantId]);
      assert.equal(dbRes.rows[0].used_tokens_this_month, 1000); // capped at limit
    });
  });

  it("Revoked key -> 401", async () => {
    await TenantContextManager.runWithSystemContext(null, "sys-admin-run", async () => {
      const client = PostgresClient.getInstance();
      await client.query(`UPDATE api_keys SET revoked_at = NOW() WHERE id = $1`, [apiKeyId]);
    });

    const req = new NextRequest("http://localhost/api/v1/public/test", {
      headers: { "Authorization": `Bearer ${rawSecret}` }
    });
    const res = await withPublicApi(req, async () => {
      return NextResponse.json({ success: true }, { status: 200 });
    });

    assert.equal(res.status, 401);
  });

  it("Wrong key -> 401", async () => {
    const req = new NextRequest("http://localhost/api/v1/public/test", {
      headers: { "Authorization": `Bearer seo_invalidkey123` }
    });
    const res = await withPublicApi(req, async () => {
      return NextResponse.json({ success: true }, { status: 200 });
    });
    assert.equal(res.status, 401);
  });

  it("Rate limit exhaustion -> 429", async () => {
    // Generate a new key for this test to bypass the revoked status
    const newKeyRes = await apiService.createApiKey({ organizationId: tenantId, name: "RL Key" });
    const localSecret = newKeyRes.secret;

    let exhausted = false;
    let rateLimitHeadersFound = false;

    for (let i = 0; i < 105; i++) {
      const req = new NextRequest("http://localhost/api/v1/public/test", {
        headers: { "Authorization": `Bearer ${localSecret}` }
      });
      const res = await withPublicApi(req, async () => {
        return NextResponse.json({ success: true }, { status: 200 });
      });

      if (res.status === 429) {
        exhausted = true;
        rateLimitHeadersFound = res.headers.has("Retry-After") && res.headers.has("X-RateLimit-Remaining");
        break;
      }
    }

    assert.ok(exhausted, "Rate limit should eventually be exhausted");
    assert.ok(rateLimitHeadersFound, "Rate limit headers should be present on 429");
  });

});
