# Database performance smoke testing

Oxenn has a manual and pull-request-triggered performance smoke workflow that runs against a disposable PostgreSQL service inside GitHub Actions. It does not connect to Neon, Production, or any configured application database.

## What it runs

1. The repository's existing tenant-isolation suite runs first against the local PostgreSQL service.
2. The benchmark creates a uniquely named temporary schema and a synthetic 10,000-row dataset.
3. It measures indexed tenant-range queries, JSONB containment filters, tenant-scoped point lookups, and a small five-worker concurrency pass.
4. It records warm-up and measured iterations, p50/p95/min/max latency, throughput, pool counters, and a representative EXPLAIN ANALYZE plan.
5. The benchmark drops its schema in a finally block and closes the pool even when a query fails.

## Safety boundary

The benchmark refuses to run unless DATABASE_URL resolves to localhost or 127.0.0.1, port 5432, and the database name isolation_test_db. It does not print the connection string. A remote host, different database name, or different port fails before a connection is opened. The workflow provisions its own pgvector/pg16 service and uses no repository or Neon secrets.

## Running it

Run the Database Performance Smoke workflow manually from GitHub Actions, or open a pull request that changes the benchmark, its tests, package script, workflow, or this document. The workflow uses the Node.js 24-compatible checkout, setup-node, and upload-artifact actions; the project runtime remains Node.js 22.

The JSON report is uploaded as a 14-day artifact and summarized in the workflow run.

## Baseline and regression policy

The first version is report-only. It deliberately has no absolute latency threshold: shared GitHub runners and cold PostgreSQL caches introduce variance, and the repository has no comparable historical baseline yet. Collect several runs on the same runner class and PostgreSQL image before choosing a p95 regression threshold. Once the baseline is stable, a separate reviewed change can add a tolerant threshold or compare against a versioned baseline. Do not treat one noisy run as proof of a regression, and do not benchmark against Production to establish the baseline.
