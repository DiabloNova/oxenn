# PostgreSQL connection pool budgeting

Oxenn creates process-local PostgreSQL pools. A pool maximum applies to one Node.js process; it is not a deployment-wide or Neon-project-wide limit. Every application replica (and every separately running worker process) creates its own pool instances.

## Workspace pools

`PostgresClient` owns two separate pools:

- `DATABASE_POOL_MAX` controls the ordinary Workspace pool. Its default remains `20` to preserve current behavior.
- `AUTHENTICATOR_POOL_MAX` controls the privileged/system-context pool. Its code default remains `20`; `.env.example` intentionally shows `2` as a conservative local example.

Both values are validated at startup as positive integers from `1` through `50`. Blank or unset values use the documented code default. Invalid values fail fast rather than silently creating a `NaN` or unexpected pool size. The two pools remain separate even when their connection URLs happen to be equal: the separation is intentional and must not be removed without reviewing database-role boundaries.

## Capacity calculation

For each physical database endpoint, estimate the upper bound as:

`replica_count × sum(pool_maxima targeting this endpoint) + other services/workers + migration/maintenance headroom`

If `DATABASE_URL` and `AUTHENTICATOR_DATABASE_URL` point to the same database endpoint, count both pool maxima for every replica. If they point to different endpoints, calculate each endpoint independently. Count Platform Admin's separately configured pool (currently `max: 5`) against its own endpoint; do not combine it with Workspace unless both URLs resolve to the same physical database.

The estimate is a client-side ceiling, not proof of available server capacity. A Neon pooled endpoint may multiplex client connections; direct endpoints and pooler endpoints have different server-side implications. Confirm the selected Neon compute/endpoint limits and deployment replica count before changing production values. Keep headroom for migrations, operators, and transient rollouts where old and new replicas may overlap.

## Tuning procedure

1. Record the number of application and worker processes that can run concurrently.
2. Group pool maxima by the actual database endpoint each URL targets.
3. Compare the resulting budget with the provider's connection limits and pooler configuration.
4. Observe pool `totalCount`, `idleCount`, and `waitingCount` during representative load before reducing or increasing maxima.
5. Change environment settings through the deployment's approved secret/configuration process; do not commit credentials or environment-specific URLs.
6. Re-run load and tenant-isolation tests after a material change.

Do not tune pool sizes from a single latency sample, and do not compensate for slow queries merely by increasing the pool maximum.
