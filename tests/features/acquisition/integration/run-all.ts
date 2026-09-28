import assert from "node:assert/strict";
import { createServer } from "node:http";
import { Pool, type PoolClient } from "pg";
import { TenantContextManager } from "../../../../src/core/database/tenant-context";
import { PostgresClient } from "../../../../src/features/admin/infrastructure/persistence/postgres";
import {
  CrawlCacheRepository,
  CrawlDispatcherRepository,
  CrawlJobRepository,
  CrawlResultRepository
} from "../../../../src/features/acquisition/infrastructure/persistence/postgres";
import { resolveCrawlPolicy } from "../../../../src/features/acquisition/domain/policy";
import { normalizeUrl } from "../../../../src/features/acquisition/domain/url/normalizer";
import type {
  CrawlRequest,
  CrawlResult
} from "../../../../src/features/acquisition/domain/contracts";
import { CrawlOrchestrator } from "../../../../src/features/acquisition/application/orchestrator";
import { ProviderRouter } from "../../../../src/features/acquisition/application/provider-router";
import { HttpCrawlProvider } from "../../../../src/features/acquisition/infrastructure/providers/http-crawl-provider";

const databaseUrl = process.env.DATABASE_URL;
const policy = resolveCrawlPolicy({});
const normalized = normalizeUrl("https://example.com/");

const normalizedUrl = normalized.ok
  ? normalized.value
  : (() => {
      throw normalized.error;
    })();

const result: CrawlResult = {
  documents: [],
  pageCount: 0,
  bytesProcessed: 0,
  partial: false,
  durationMs: 0,
  provider: { id: "integration" },
  errors: []
};

function request(
  tenantId: string,
  policyOverride = policy
): CrawlRequest {
  return {
    tenantId,
    requestedUrl: "https://example.com/",
    normalizedUrl,
    policy: policyOverride,
    priority: 0,
    requestId: `integration-${tenantId}`
  };
}

async function withTenant<T>(
  tenantId: string,
  work: () => Promise<T>
): Promise<T> {
  return TenantContextManager.runWithTenantContext(
    tenantId,
    null,
    `integration-${tenantId}`,
    work
  );
}

async function rawTenant(
  pool: Pool,
  tenantId: string,
  work: (client: PoolClient) => Promise<void>
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT set_config('app.current_tenant_id', $1, true)",
      [tenantId]
    );
    await work(client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function cleanup(pool: Pool, tenantId: string): Promise<void> {
  await rawTenant(pool, tenantId, async client => {
    await client.query("DELETE FROM crawl_cache WHERE tenant_id = $1", [
      tenantId
    ]);
    await client.query("DELETE FROM crawl_jobs WHERE tenant_id = $1", [
      tenantId
    ]);
  });
}

async function main(): Promise<void> {
  if (!databaseUrl) {
    console.log(
      "⚠️ acquisition integration suite skipped: DATABASE_URL is not set"
    );
    return;
  }

  const testTenantIds = [
    "a0000000-0000-4000-8000-00000000000a",
    "b0000000-0000-4000-8000-00000000000b",
    "c0000000-0000-4000-8000-00000000000c",
    "d0000000-0000-4000-8000-00000000000d",
    "e0000000-0000-4000-8000-00000000000e",
    "f0000000-0000-4000-8000-00000000000f",
    "a1000000-0000-4000-8000-00000000000a",
    "a2000000-0000-4000-8000-00000000000a",
    "a3000000-0000-4000-8000-00000000000a",
    "a4000000-0000-4000-8000-00000000000a"
  ];

  const pool = new Pool({ connectionString: databaseUrl, max: 24 });
  const setupClient = await pool.connect();
  try {
    for (const id of testTenantIds) {
      await setupClient.query(
        `INSERT INTO organizations (id, name, slug)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO NOTHING`,
        [id, 'Test ' + id.slice(0, 8), 'test-' + id.slice(0, 8)]
      );
    }
  } finally {
    setupClient.release();
  }

  const jobs = new CrawlJobRepository();
  const cache = new CrawlCacheRepository();
  const results = new CrawlResultRepository();
  const dispatcher = new CrawlDispatcherRepository(pool);

  try {
    await withTenant("a0000000-0000-4000-8000-00000000000a", async () => {
      const client = TenantContextManager.getDbClient() as PoolClient | null;
      assert.ok(client);
      const setting = await client.query<{ value: string }>(
        "SELECT current_setting('app.current_tenant_id', true) AS value"
      );
      assert.equal(setting.rows[0]?.value, "a0000000-0000-4000-8000-00000000000a");
    });

    await cleanup(pool, "b0000000-0000-4000-8000-00000000000b");
    await cleanup(pool, "c0000000-0000-4000-8000-00000000000c");
    const tenantAJob = await withTenant("b0000000-0000-4000-8000-00000000000b", () =>
      jobs.createOrGetByDedup({ request: request("b0000000-0000-4000-8000-00000000000b") })
    );
    await withTenant("b0000000-0000-4000-8000-00000000000b", async () => {
      await results.put(tenantAJob.id, result);
      await cache.put("cache-a", result, new Date(Date.now() + 60_000));
    });
    await withTenant("c0000000-0000-4000-8000-00000000000c", async () => {
      assert.equal(await jobs.getById(tenantAJob.id), null);
      assert.equal((await results.getByJobId(tenantAJob.id)), null);
      assert.equal((await cache.get("cache-a")).outcome, "MISS");
      await assert.rejects(
        () => cache.get("cache-a", "global"),
        error => error instanceof Error && error.name === "CrawlError"
      );
    });

    await cleanup(pool, "d0000000-0000-4000-8000-00000000000d");
    const concurrent = await Promise.all(
      Array.from({ length: 12 }, () =>
        withTenant("d0000000-0000-4000-8000-00000000000d", () =>
          jobs.createOrGetByDedup({
            request: request("d0000000-0000-4000-8000-00000000000d")
          })
        )
      )
    );
    assert.equal(new Set(concurrent.map(job => job.id)).size, 1);
    const observedActive = await withTenant("d0000000-0000-4000-8000-00000000000d", async () => {
      const client = TenantContextManager.getDbClient() as PoolClient;
      const rows = await client.query<{ count: string }>(
        `SELECT count(*)::text AS count FROM crawl_jobs
         WHERE tenant_id = $1 AND dedup_key = $2
           AND status IN ('PENDING', 'QUEUED', 'RUNNING')`,
        ["d0000000-0000-4000-8000-00000000000d", concurrent[0].dedupKey]
      );
      return Number(rows.rows[0]?.count);
    });
    assert.equal(observedActive, 1);

    await cleanup(pool, "e0000000-0000-4000-8000-00000000000e");
    const first = await withTenant("e0000000-0000-4000-8000-00000000000e", () =>
      jobs.createOrGetByDedup({ request: request("e0000000-0000-4000-8000-00000000000e") })
    );
    const second = await withTenant("e0000000-0000-4000-8000-00000000000e", () =>
      jobs.createOrGetByDedup({
        request: request("e0000000-0000-4000-8000-00000000000e", { ...policy, maxPages: 2 })
      })
    );
    assert.notEqual(first.id, second.id);

    await cleanup(pool, "f0000000-0000-4000-8000-00000000000f");
    const raceJob = await withTenant("f0000000-0000-4000-8000-00000000000f", () =>
      jobs.createOrGetByDedup({ request: request("f0000000-0000-4000-8000-00000000000f") })
    );
    const queued = await withTenant("f0000000-0000-4000-8000-00000000000f", () =>
      jobs.transition(raceJob.id, "PENDING", raceJob.version, "QUEUED")
    );
    const transitions = await Promise.allSettled(
      [0, 1].map(() =>
        withTenant("f0000000-0000-4000-8000-00000000000f", () =>
          jobs.transition(queued.id, "QUEUED", queued.version, "RUNNING")
        )
      )
    );
    assert.equal(
      transitions.filter(entry => entry.status === "fulfilled").length,
      1
    );
    assert.equal(
      transitions.filter(entry => entry.status === "rejected").length,
      1
    );

    await cleanup(pool, "a1000000-0000-4000-8000-00000000000a");
    await cleanup(pool, "a2000000-0000-4000-8000-00000000000a");
    await cleanup(pool, "a3000000-0000-4000-8000-00000000000a");
    await cleanup(pool, "a4000000-0000-4000-8000-00000000000a");
    const dispatchA = await withTenant("a1000000-0000-4000-8000-00000000000a", () =>
      jobs.createOrGetByDedup({ request: request("a1000000-0000-4000-8000-00000000000a") })
    );
    const dispatchB = await withTenant("a2000000-0000-4000-8000-00000000000a", () =>
      jobs.createOrGetByDedup({ request: request("a2000000-0000-4000-8000-00000000000a") })
    );
    await withTenant("a1000000-0000-4000-8000-00000000000a", () =>
      jobs.transition(dispatchA.id, "PENDING", dispatchA.version, "QUEUED")
    );
    await withTenant("a2000000-0000-4000-8000-00000000000a", () =>
      jobs.transition(dispatchB.id, "PENDING", dispatchB.version, "QUEUED")
    );
    const claimed = await dispatcher.claim("integration-worker", 2, 60_000);
    assert.deepEqual(
      new Set(claimed.map(candidate => candidate.tenantId)),
      new Set(["a1000000-0000-4000-8000-00000000000a", "a2000000-0000-4000-8000-00000000000a"])
    );

    await cleanup(pool, "a3000000-0000-4000-8000-00000000000a");
    const recoveryJob = await withTenant("a3000000-0000-4000-8000-00000000000a", () =>
      jobs.createOrGetByDedup({ request: request("a3000000-0000-4000-8000-00000000000a") })
    );
    const recoveryQueued = await withTenant("a3000000-0000-4000-8000-00000000000a", () =>
      jobs.transition(
        recoveryJob.id,
        "PENDING",
        recoveryJob.version,
        "QUEUED"
      )
    );
    const recoveryClaim = (await dispatcher.claim(
      "dead-worker",
      1,
      60_000
    )).find(candidate => candidate.id === recoveryQueued.id);
    assert.ok(recoveryClaim);
    const running = await withTenant("a3000000-0000-4000-8000-00000000000a", () =>
      jobs.getById(recoveryClaim.id)
    );
    assert.ok(running);
    await rawTenant(pool, "a3000000-0000-4000-8000-00000000000a", async client => {
      await client.query(
        "UPDATE crawl_jobs SET lease_expires_at = NOW() - INTERVAL '1 minute' WHERE id = $1",
        [recoveryClaim.id]
      );
    });
    const recovered = await dispatcher.recoverExpired();
    assert.ok(recovered.some(candidate => candidate.id === recoveryClaim.id));
    assert.equal(
      await dispatcher.completeIfLeaseOwner(
        recoveryClaim.id,
        "dead-worker",
        running.version,
        "SUCCEEDED"
      ),
      false
    );
    const queuedAgain = await withTenant("a3000000-0000-4000-8000-00000000000a", () =>
      jobs.getById(recoveryClaim.id)
    );
    assert.equal(queuedAgain?.status, "QUEUED");

    await cleanup(pool, "a4000000-0000-4000-8000-00000000000a");
    const server = createServer((_request, response) => {
      response
        .writeHead(200, { "content-type": "text/html" })
        .end("<html><title>E2E</title><body>crawl result</body></html>");
    });
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const localUrl = `http://127.0.0.1:${address.port}/`;
    const localPolicy = resolveCrawlPolicy({
      robotsPolicy: "ignore",
      maxPages: 1
    });
    const localRouter = new ProviderRouter([
      new HttpCrawlProvider({
        hostValidator: async () => ({ ok: true, ips: ["127.0.0.1"] })
      })
    ]);
    const localOrchestrator = new CrawlOrchestrator(
      jobs,
      cache,
      results,
      localRouter,
      async () => ({ ok: true, ips: ["127.0.0.1"] })
    );
    const submission = await withTenant("a4000000-0000-4000-8000-00000000000a", () =>
      localOrchestrator.submit("a4000000-0000-4000-8000-00000000000a", localUrl, localPolicy)
    );
    assert.ok(submission.job);
    const candidate = (await dispatcher.claim("e2e-worker", 100, 60_000)).find(
      item => item.id === submission.job?.id
    );
    assert.ok(candidate);
    const leaseVersion = submission.job.version + 1;
    const e2eRunning = await withTenant("a4000000-0000-4000-8000-00000000000a", () => jobs.getById(candidate.id));
    assert.equal(e2eRunning?.status, "RUNNING");
    await localOrchestrator.execute(e2eRunning as NonNullable<typeof e2eRunning>, new AbortController().signal, {
      runTenantOperation: operation => withTenant("a4000000-0000-4000-8000-00000000000a", operation),
      getExpectedVersion: () => leaseVersion,
      completeIfLeaseOwner: (status, expectedVersion, facts) =>
        dispatcher.completeIfLeaseOwner(
          candidate.id,
          "e2e-worker",
          expectedVersion,
          status,
          facts
        )
    });
    const terminal = await withTenant("a4000000-0000-4000-8000-00000000000a", () => jobs.getById(candidate.id));
    assert.equal(terminal?.status, "SUCCEEDED");
    assert.ok(await withTenant("a4000000-0000-4000-8000-00000000000a", () => results.getByJobId(candidate.id)));
    const hit = await withTenant("a4000000-0000-4000-8000-00000000000a", () =>
      localOrchestrator.submit("a4000000-0000-4000-8000-00000000000a", localUrl, localPolicy)
    );
    assert.equal(hit.cacheOutcome, "HIT");
    await new Promise<void>(resolve => server.close(() => resolve()));

    console.log("✅ acquisition integration suites passed");
  } finally {
    const cleanClient = await pool.connect();
    try {
      for (const id of testTenantIds) {
        await cleanClient.query("DELETE FROM organizations WHERE id = $1", [id]);
      }
    } finally {
      cleanClient.release();
    }
    await pool.end();
    await PostgresClient.getInstance().getPool().end();
  }
}

main().catch((error: unknown) => {
  console.error("❌ acquisition integration suite failed", error);
  process.exitCode = 1;
});
