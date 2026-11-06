# BL-004 — Product repositories mix PostgreSQL with process-local memory as an authoritative fallback

## Metadata
- **Global order:** 1
- **Part:** 02 — Persistence and Repository Architecture
- **Priority:** P1 — Platform/MVP blocking
- **Status:** validated
- **Confidence:** high for the cited repositories; repository-wide classification remains in progress
- **Audited baseline:** `main` at `7bd2b6ba04e18abbcaf772fac63f29c465a45a42`
- **Blocks:** BL-001, BL-002 and BL-003

## Exact problem

The AI Intelligence repository module exports a process-global `InMemoryDatabase` instance, seeded at module initialization, and several customer-facing repositories read from or write to those Maps instead of treating PostgreSQL as the durable source of truth.

Confirmed examples:

1. `BrandRepository` is entirely memory-backed: find/list/save/delete operate on `db.brands` and do not issue PostgreSQL queries.
2. `WebsiteRepository.findById` and `findByDomain` execute PostgreSQL SELECT queries but discard their results, then read from `db.websites`.
3. `PageRepository.findById`, `findByWebsiteId` and `findByNormalizedUrl` execute PostgreSQL SELECT queries but discard their results, then read from `db.pages`.
4. `AIVisibilityAuditRepository` catches database errors and returns or writes to `db.aiVisibilityAudits` / `db.auditPrompts`. In particular, `save` logs that the database write was skipped or failed, stores the item in memory, and returns the item as a successful-looking result.
5. Other repositories in the same 3,551-line module contain repeated “memory fallback” catches; a complete class-by-class inventory is required before this finding can be closed.

This design can make a server action appear successful while records are not durable. Reads may work only inside the process that originally wrote the Map entry. A restart, cold start or a different serverless instance can return missing or different data. Falling back after an actual database error also conceals persistence outages from the user and monitoring.

## Evidence

- `src/features/ai-intelligence/repositories/index.ts:99-146` defines and seeds the process-local `InMemoryDatabase`.
- `src/features/ai-intelligence/repositories/index.ts:407` creates a global `db = new InMemoryDatabase()`.
- `src/features/ai-intelligence/repositories/index.ts:538-575` implements `BrandRepository` solely through Maps.
- `src/features/ai-intelligence/repositories/index.ts:2005-2025` discards the SELECT result in Website reads and returns data from `db.websites`.
- `src/features/ai-intelligence/repositories/index.ts:2081-2112` discards the SELECT result in Page reads and returns data from `db.pages`.
- `src/features/ai-intelligence/repositories/index.ts:991-1062` falls back to process memory on AI audit reads and writes.
- `src/features/ai-intelligence/repositories/index.ts:1095-1156` falls back to process memory for prompt reads and writes.
- `src/features/admin/infrastructure/persistence/postgres/index.ts` contains the real PostgreSQL pool/query implementation; the cited repositories are not consistently using its result as the source of truth.

## Root cause

The module combines demo/test storage and production persistence in a single repository implementation. Error handling converts database failures into memory fallback behavior, and some read methods issue SQL without mapping the returned rows. There is no enforced runtime mode boundary that restricts in-memory adapters to test/demo execution.

## Target files

- `src/features/ai-intelligence/repositories/index.ts` — separate the current Map-based test/demo adapter from production repositories and fix the named read/write methods.
- `src/features/ai-intelligence/repositories/interfaces.ts` — verify repository contracts and pagination/transaction expectations.
- `src/features/ai-intelligence/domain/**` — use typed domain mapping and repository interfaces.
- `src/features/admin/infrastructure/persistence/postgres/index.ts` and Unit of Work/transaction boundaries — verify correct query client and transaction use; do not redesign without evidence.
- `database/schema/**`, `database/drizzle/**` — verify the relevant tables/keys/indexes against repository contracts before changing any schema.
- Related service actions and unit/integration tests.

## Recommended remediation

1. Establish PostgreSQL as the only authoritative persistence adapter for live customer mode.
2. Move Map-backed data into an explicit `InMemory*Repository` or test fixture adapter injected through dependency composition. Do not instantiate it implicitly in a production repository module.
3. Remove catch-and-continue fallback behavior from live reads/writes. Translate DB failures into typed, observable errors and return a failed/partial state to the caller; never return a fake successful persistence result.
4. Map actual PostgreSQL rows on reads. Handle empty results as genuine not-found/empty results, not as a reason to consult demo Maps.
5. Use a transaction boundary for multi-record operations where consistency requires it. Preserve tenant filters and RLS; do not bypass tenant context to make repositories work.
6. Audit every class/method in the 3,551-line module and record a sub-inventory of all remaining memory reads, writes, seeds and error fallbacks before declaring the issue resolved.
7. Add integration tests against disposable PostgreSQL for restart durability, read-after-write, empty result, database outage, rollback and tenant isolation. Unit tests may inject in-memory adapters explicitly.

This keeps the existing PostgreSQL architecture and domain contracts. It is safer than a wholesale rewrite or introducing a new datastore.

## Dependencies and impacts

- This is a prerequisite for customer-facing audit flows.
- It blocks BL-001, BL-002 and BL-003.
- It may reveal missing unique constraints, row mappers or migration inconsistencies. Handle any schema change with a separately reviewed versioned migration.
- Do not assume the current 51-table isolation suite proves persistence correctness for every repository method.

## Parallelization assessment

**Unsafe to parallelize directly in the current file.**
The file is a large shared implementation surface with multiple repository classes and cross-cutting helper/storage state. Concurrent edits to this file create high conflict and regression risk.

After mapping the full inventory, work can be split by extracting independent repository modules or by assigning clearly disjoint class/file boundaries. Until then:
- one owner coordinates the adapter boundary and shared in-memory store removal;
- tests can be written in parallel against agreed contracts;
- migration review can proceed in parallel read-only;
- production repository rewrites should integrate sequentially.

## Acceptance criteria

- No live repository method falls back to process-local Maps after a DB error or empty result.
- Live reads return mapped PostgreSQL rows; live writes are confirmed by PostgreSQL.
- DB outage is visible as failure/partial state and is observable.
- In-memory adapters are available only through explicit test/demo dependency injection.
- Brand, website, page, audit and prompt records survive a process restart and are visible from a second runtime instance.
- Tenant A cannot read/write Tenant B's records, including via fallback paths.
- Every repository class in the module has a reviewed storage contract and test coverage.

## Rollback and recovery

Keep any extracted in-memory adapter available to tests/demo flows, but never auto-enable it in live execution. For production rollout, use backward-compatible migrations if required, snapshot affected customer data before backfills, verify row counts and tenant ownership, and retain a rollback path. No production migration or data cleanup is authorized by this finding.

## Verification record

- The cited implementations were directly inspected at the baseline commit.
- Current CI RLS isolation and build jobs pass, but they do not demonstrate durable behavior for each repository method.
- Local database tests were not run in this audit environment.
- Full repository class/method inventory and post-fix checks remain pending.
