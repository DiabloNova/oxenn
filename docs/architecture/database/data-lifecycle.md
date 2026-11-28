# Database data lifecycle and retention

Oxenn's database currently contains several different data classes. They must not share one blanket retention rule: operational leases, expiring cache entries, product evidence, vector data, and security audit records have different correctness and compliance requirements.

## Current schema findings

| Data class | Current evidence | Safe conclusion |
|---|---|---|
| Crawl cache | crawl_cache has expires_at; its current unique index is on tenant_id, cache_scope and cache_key, not expires_at; the inspected cache read path treats expired rows as misses but does not remove them | Expired cache entries are logically stale, but a purge should wait until an expires_at index is designed and measured |
| Crawl job leases | crawl_jobs has lease_expires_at, heartbeat_at and worker_id | Lease expiry is operational coordination, not a data-retention signal; never delete a job just because its lease expired |
| Crawl history | crawl_results references crawl_jobs with ON DELETE CASCADE; crawl_snapshots references crawl_jobs and monitoring_configs with ON DELETE CASCADE | Deleting a parent job can remove result and snapshot evidence; no cleanup job was found in the inspected crawl-job/result/snapshot repositories |
| AI evidence | citations references ai_observations with ON DELETE CASCADE; both have soft-delete fields | Soft deletion and historical evidence need an explicit product policy before physical deletion |
| Time-series evidence | historical_metrics has recorded_at; citation_occurrences has occurred_at; crawl_snapshots has captured_at; prompt_executions has created_at/executed_at | These are partitioning/archival review candidates only after size and query measurements |
| Vector data | document_embeddings contains content chunks and embeddings, tenant-scoped | Retention must follow the source document lifecycle and preserve tenant isolation |
| Security audit | audit_records stores actor email, IP address, user agent and before/after payloads; platform_admin_audit_events is a separate audit stream | Do not purge or rewrite audit evidence without an approved legal/compliance retention schedule |
| Platform-admin transient state | sessions, OIDC transactions and auth rate limits have expires_at columns and expiry indexes | These are natural expired-only cleanup candidates, but no cleanup job is introduced here |

The first ephemeral workspace audit found expires_at columns in api_keys, auth_rate_limits, crawl_cache, email_verification_tokens, organization_invitations, password_reset_tokens and sessions. Among those workspace tables, only auth_rate_limits currently has a direct expires_at index key. In particular, crawl_cache has no dedicated expiry index, and its inspected read path treats expired entries as misses without physically removing them.

This is schema/index metadata from the migrated ephemeral database, not evidence of Production row volume or query latency. The absence of an expires_at index does not prove point lookups are slow: token and cache-key lookups may use separate unique indexes. It matters primarily for future bulk expiry sweeps. Before adding an index, measure actual row volume and query plans, then review a tenant-safe key such as (expires_at) or (tenant_id, expires_at) against the intended cleanup query. Do not add indexes to every expires_at column automatically.

## Read-only lifecycle inventory

The database lifecycle audit reports:

- approximate row estimates and live/dead tuple statistics from PostgreSQL catalogs;
- heap, index and total relation sizes;
- index definitions, index scan counters and index sizes;
- timestamp/date columns and explicit expires_at index coverage;
- RLS and FORCE RLS flags;
- last vacuum/autovacuum and analyze/autoanalyze timestamps.

It does not read application row contents, run exact COUNT(*) scans, delete data, change indexes, archive objects, partition tables, or apply migrations. The audit runs in a BEGIN READ ONLY transaction with statement and lock timeouts, and its connection guard accepts only the disposable local isolation database.

Row estimates and index scan counters are statistics, not exact truth. They can be stale or reset; they must not be used alone to drop indexes or set retention periods.

## Retention policy decisions still required

No automatic retention durations are defined by this change. Before setting any period, the product owner should decide:

1. Which user-visible history must remain available and for how long.
2. Whether crawl results and snapshots are contractual evidence or disposable intermediate data.
3. How deletion requests interact with citations, observations, embeddings and audit records.
4. The legal/compliance retention schedule for workspace and platform-admin audit events.
5. Whether archived evidence must be restorable, tenant-scoped, checksummed and independently verified.

## Partitioning and archival cautions

Potential append-heavy candidates include historical_metrics, citation_occurrences, crawl_snapshots, prompt_executions and ai_observations. Partitioning is not a harmless index optimization: several tables use an id-only primary key, and some have foreign-key relationships or cascade behavior. PostgreSQL partitioned unique/primary-key constraints generally need to include the partition key. Any future partition migration therefore requires a schema design, tenant/RLS review, migration rehearsal, backfill validation and rollback plan.

For now, use the inventory to establish real table-growth and index-usage baselines. Do not partition based only on table names, and do not infer that a low idx_scan count proves an index is unused.

## Workflow

The Database Lifecycle Audit workflow runs manually or on pull requests touching its files. It provisions an ephemeral pgvector/pg16 service, runs the existing tenant-isolation suite, then executes the read-only inventory. The runtime report covers the workspace isolation database only; platform-admin TTL tables above were identified from the separate platform-admin schema source and are not queried by this workflow. The JSON report is uploaded as a 14-day artifact and included in the workflow summary. It uses no Neon or Production credentials.
