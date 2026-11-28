# PostgreSQL connection pool budgeting

Oxenn creates process-local PostgreSQL pools. A pool maximum applies to one Node.js process; it is not a deployment-wide or Neon-project-wide limit. Every application replica (and every separately running worker process) creates its own pool instances.

## Workspace and worker pools

The Workspace runtime and crawl worker can create up to three independent pools: the ordinary Workspace pool and crawl dispatcher pool target `DATABASE_URL`; the authenticator pool targets `AUTHENTICATOR_DATABASE_URL` when set, otherwise `DATABASE_URL`.

- `DATABASE_POOL_MAX` controls the ordinary Workspace pool created by `PostgresClient`. Its default remains `20` to preserve current behavior.
- `AUTHENTICATOR_POOL_MAX` controls the privileged/system-context pool created by `PostgresClient`. Its code default remains `20`; `.env.example` intentionally shows `2` as a conservative local example.
- `CRAWL_WORKER_POOL_MAX` controls the crawl dispatcher's separate `pg.Pool` in `scripts/crawl-worker.ts`. Its default is `10`, preserving node-postgres's previous implicit pool default. The worker also enters tenant context and can instantiate the two `PostgresClient` pools, so the dispatcher pool must be counted in addition to those pools.

The Workspace `DATABASE_POOL_MAX` and `AUTHENTICATOR_POOL_MAX` values are validated at Next.js server startup through `instrumentation.ts`, and again when `PostgresClient` is constructed. The crawl worker validates `CRAWL_WORKER_POOL_MAX` before opening its dispatcher pool. All values must be positive integers from `1` through `50`; blank or unset values use their documented code defaults. Invalid values fail fast rather than silently creating a `NaN` or unexpected pool size. The two `PostgresClient` pools remain separate even when their connection URLs happen to be equal: the separation is intentional and must not be removed without reviewing database-role boundaries.

## Capacity calculation

For each physical database endpoint, estimate the upper bound as:

`replica_count × sum(pool_maxima targeting this endpoint) + other services/workers + migration/maintenance headroom`

For a crawl-worker replica where `DATABASE_URL` and `AUTHENTICATOR_DATABASE_URL` resolve to the same endpoint, count all three maxima: `DATABASE_POOL_MAX + AUTHENTICATOR_POOL_MAX + CRAWL_WORKER_POOL_MAX`. For a web replica without the crawl dispatcher, count the two `PostgresClient` pools. If `AUTHENTICATOR_DATABASE_URL` points to a different endpoint, calculate its pool separately. Count Platform Admin's separately configured pool (currently `max: 5`) against its own endpoint; do not combine it with Workspace unless both URLs resolve to the same physical database.

The estimate is a client-side ceiling, not proof of available server capacity. A Neon pooled endpoint may multiplex client connections; direct endpoints and pooler endpoints have different server-side implications. Confirm the selected Neon compute/endpoint limits and deployment replica count before changing production values. Keep headroom for migrations, operators, and transient rollouts where old and new replicas may overlap.

## Tuning procedure

1. Record the number of web, crawl-worker, and other application processes that can run concurrently.
2. Group pool maxima by the actual database endpoint each URL targets.
3. Compare the resulting budget with the provider's connection limits and pooler configuration.
4. Observe pool `totalCount`, `idleCount`, and `waitingCount` during representative load before reducing or increasing maxima.
5. Change environment settings through the deployment's approved secret/configuration process; do not commit credentials or environment-specific URLs.
6. Re-run load and tenant-isolation tests after a material change.

Do not tune pool sizes from a single latency sample, and do not compensate for slow queries merely by increasing the pool maximum.
