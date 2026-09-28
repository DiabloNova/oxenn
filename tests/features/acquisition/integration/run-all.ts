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

  const pool = new Pool({ connectionString: databaseUrl, max: 24 });
  const jobs = new CrawlJobRepository();
  const cache = new CrawlCacheRepository();
  const results = new CrawlResultRepository();
  const dispatcher = new CrawlDispatcherRepository(pool);

  try {
    await withTenant("e0000000-0000-0000-0000-00000000000e", async () => {
      const client = TenantContextManager.getDbClient() as PoolClient | null;
      assert.ok(client);
      const setting = await client.query<{ value: string }>(
        "SELECT current_setting('app.current_tenant_id', true) AS value"
      );
      assert.equal(setting.rows[0]?.value, "e0000000-0000-0000-0000-00000000000e");
    });

    await cleanup(pool, "f0000000-0000-0000-0000-00000000000f");
    await cleanup(pool, "10000000-0000-0000-0000-000000000001");
    const tenantAJob = await withTenant("f0000000-0000-0000-0000-00000000000f", () =>
      jobs.createOrGetByDedup({ request: request("f0000000-0000-0000-0000-00000000000f") })
    );
    await withTenant("f0000000-0000-0000-0000-00000000000f", async () => {
      await results.put(tenantAJob.id, result);
      await cache.put("cache-a", result, new Date(Date.now() + 60_000));
    });
    await withTenant("10000000-0000-0000-0000-000000000001", async () => {
      assert.equal(await jobs.getById(tenantAJob.id), null);
      assert.equal((await results.getByJobId(tenantAJob.id)), null);
      assert.equal((await cache.get("cache-a")).outcome, "MISS");
      await assert.rejects(
        () => cache.get("cache-a", "global"),
        error => error instanceof Error && error.name === "CrawlError"
      );
    });

    await cleanup(pool, "20000000-0000-0000-0000-000000000002");
    const concurrent = await Promise.all(
      Array.from({ length: 12 }, () =>
        withTenant("20000000-0000-0000-0000-000000000002", () =>
          jobs.createOrGetByDedup({
            request: request("20000000-0000-0000-0000-000000000002")
          })
        )
      )
    );
    assert.equal(new Set(concurrent.map(job => job.id)).size, 1);
    const observedActive = await withTenant("20000000-0000-0000-0000-000000000002", async () => {
      const client = TenantContextManager.getDbClient() as PoolClient;
      const rows = await client.query<{ count: string }>(
        `SELECT count(*)::text AS count FROM crawl_jobs
         WHERE tenant_id = $1 AND dedup_key = $2
           AND status IN ('PENDING', 'QUEUED', 'RUNNING')`,
        ["20000000-0000-0000-0000-000000000002", concurrent[0].dedupKey]
      );
      return Number(rows.rows[0]?.count);
    });
    assert.equal(observedActive, 1);

    await cleanup(pool, "30000000-0000-0000-0000-000000000003");
    const first = await withTenant("30000000-0000-0000-0000-000000000003", () =>
      jobs.createOrGetByDedup({ request: request("30000000-0000-0000-0000-000000000003") })
    );
    const second = await withTenant("30000000-0000-0000-0000-000000000003", () =>
      jobs.createOrGetByDedup({
        request: request("30000000-0000-0000-0000-000000000003", { ...policy, maxPages: 2 })
      })
    );
    assert.notEqual(first.id, second.id);

    await cleanup(pool, "40000000-0000-0000-0000-000000000004");
    const raceJob = await withTenant("40000000-0000-0000-0000-000000000004", () =>
      jobs.createOrGetByDedup({ request: request("40000000-0000-0000-0000-000000000004") })
    );
    const queued = await withTenant("40000000-0000-0000-0000-000000000004", () =>
      jobs.transition(raceJob.id, "PENDING", raceJob.version, "QUEUED")
    );
    const transitions = await Promise.allSettled(
      [0, 1].map(() =>
        withTenant("40000000-0000-0000-0000-000000000004", () =>
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

    await cleanup(pool, "50000000-0000-0000-0000-000000000005");
    await cleanup(pool, "60000000-0000-0000-0000-000000000006");
    await cleanup(pool, "70000000-0000-0000-0000-000000000007");
    await cleanup(pool, "80000000-0000-0000-0000-000000000008");
    const dispatchA = await withTenant("50000000-0000-0000-0000-000000000005", () =>
      jobs.createOrGetByDedup({ request: request("50000000-0000-0000-0000-000000000005") })
    );
    const dispatchB = await withTenant("60000000-0000-0000-0000-000000000006", () =>
      jobs.createOrGetByDedup({ request: request("60000000-0000-0000-0000-000000000006") })
    );
    await withTenant("50000000-0000-0000-0000-000000000005", () =>
      jobs.transition(dispatchA.id, "PENDING", dispatchA.version, "QUEUED")
    );
    await withTenant("60000000-0000-0000-0000-000000000006", () =>
      jobs.transition(dispatchB.id, "PENDING", dispatchB.version, "QUEUED")
    );
    const claimed = await dispatcher.claim("integration-worker", 2, 60_000);
    assert.deepEqual(
      new Set(claimed.map(candidate => candidate.tenantId)),
      new Set(["50000000-0000-0000-0000-000000000005", "60000000-0000-0000-0000-000000000006"])
    );

    await cleanup(pool, "70000000-0000-0000-0000-000000000007");
    const recoveryJob = await withTenant("70000000-0000-0000-0000-000000000007", () =>
      jobs.createOrGetByDedup({ request: request("70000000-0000-0000-0000-000000000007") })
    );
    const recoveryQueued = await withTenant("70000000-0000-0000-0000-000000000007", () =>
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
    const running = await withTenant("70000000-0000-0000-0000-000000000007", () =>
      jobs.getById(recoveryClaim.id)
    );
    assert.ok(running);
    await rawTenant(pool, "70000000-0000-0000-0000-000000000007", async client => {
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
    const queuedAgain = await withTenant("70000000-0000-0000-0000-000000000007", () =>
      jobs.getById(recoveryClaim.id)
    );
    assert.equal(queuedAgain?.status, "QUEUED");

    await cleanup(pool, "80000000-0000-0000-0000-000000000008");
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
    const submission = await withTenant("80000000-0000-0000-0000-000000000008", () =>
      localOrchestrator.submit("80000000-0000-0000-0000-000000000008", localUrl, localPolicy)
    );
    assert.ok(submission.job);
    const candidate = (await dispatcher.claim("e2e-worker", 100, 60_000)).find(
      item => item.id === submission.job?.id
    );
    assert.ok(candidate);
    const leaseVersion = submission.job.version + 1;
    const e2eRunning = await withTenant("80000000-0000-0000-0000-000000000008", () => jobs.getById(candidate.id));
    assert.equal(e2eRunning?.status, "RUNNING");
    await localOrchestrator.execute(e2eRunning as NonNullable<typeof e2eRunning>, new AbortController().signal, {
      runTenantOperation: operation => withTenant("80000000-0000-0000-0000-000000000008", operation),
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
    const terminal = await withTenant("80000000-0000-0000-0000-000000000008", () => jobs.getById(candidate.id));
    assert.equal(terminal?.status, "SUCCEEDED");
    assert.ok(await withTenant("80000000-0000-0000-0000-000000000008", () => results.getByJobId(candidate.id)));
    const hit = await withTenant("80000000-0000-0000-0000-000000000008", () =>
      localOrchestrator.submit("80000000-0000-0000-0000-000000000008", localUrl, localPolicy)
    );
    assert.equal(hit.cacheOutcome, "HIT");
    await new Promise<void>(resolve => server.close(() => resolve()));

    console.log("✅ acquisition integration suites passed");
  } finally {
    await pool.end();
    await PostgresClient.getInstance().getPool().end();
  }
}

main().catch((error: unknown) => {
  console.error("❌ acquisition integration suite failed", error);
  process.exitCode = 1;
});
