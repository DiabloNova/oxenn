# BL-008 — Historical architecture and roadmap documents contain stale or conflicting repository claims

## Metadata
- **Global order:** 8
- **Part:** 04 — Documentation and Repository Governance
- **Priority:** P2 — Source-of-truth and operational planning risk
- **Status:** validated
- **Confidence:** high for the cited document/code mismatches
- **Audited baseline:** `main` at `7bd2b6ba04e18abbcaf772fac63f29c465a45a42`

## Exact problem

The repository contains multiple roadmaps and audit/architecture records whose status and claims are not consistently presented as historical or superseded. Examples:

1. `docs/architecture/database/reconciliation-report.md` is dated August 2024 and repeats historical claims that 21 tables were missing from migrations and 5 tables were missing from custom TypeScript definitions. The current CI at the audited commit reports successful Drizzle migration-chain verification, tenant-table/schema alignment and a passing Phase 0 baseline check. The old report does not identify which findings have since been fixed.
2. The same reconciliation report states that `scripts/crawl-worker.ts` bypasses `TenantContextManager`. The current worker source calls `TenantContextManager.runWithTenantContext` for per-job reads, heartbeats and orchestrator operations. The dispatcher methods use separately documented system-scoped database functions. The old description is therefore incomplete and should be reconciled, not blindly repeated as a current finding.
3. `docs/project/roadmap/IRPRP.md` says the prior infrastructure audit is authoritative and that no additional audit/discovery is required. That instruction conflicts with the new repository-wide Baseline Plan process.
4. `docs/project/roadmap/PRODUCT_EVOLUTION_ROADMAP.md` and `EXECUTION_ROADMAP.md` describe earlier Seorchable product positioning and sequencing. They are not reconciled with the newer Iran-first product model and the new authoritative Roadmap directory.

This finding is about document authority and freshness. It does not mean the historical records should be deleted; they retain useful context.

## Evidence

- `docs/architecture/database/reconciliation-report.md:3,15-19,120-121` carries the old date and historical mismatch/worker claims.
- `src/core/database/tenant-context/index.ts:255-343` defines the current per-tenant transaction context.
- `scripts/crawl-worker.ts:57-68,80-105` invokes `runWithTenantContext` for job-scoped tenant work.
- `src/features/acquisition/infrastructure/persistence/postgres/dispatcher-repository.ts` describes its cross-tenant queue operations as deliberately system-scoped through database functions.
- `docs/project/roadmap/IRPRP.md` explicitly says no further audit/discovery is required.
- `docs/project/README.md` describes project roadmap documents as historical point-in-time records.

## Root cause

Several independent planning and audit documents were created at different stages. Their current status, verified remediation, and precedence were not consistently maintained as the repository evolved.

## Target files

- `docs/architecture/database/reconciliation-report.md` — annotate point-in-time scope and reconcile each old issue against current migration/verification evidence.
- `docs/project/README.md` — define historical/superseded status and point to the authoritative current planning documents.
- `docs/project/roadmap/IRPRP.md`, `EXECUTION_ROADMAP.md`, `PRODUCT_EVOLUTION_ROADMAP.md`, and `TASKS.md` — add concise historical/superseded notices and links, preserving original content.
- `docs/README.md` — retain links to `Baseline plan` and `Roadmap` as the current authorities (already staged on the documentation branch).

## Recommended remediation

1. Preserve historical documents; do not delete or rewrite old task records.
2. Add a standard status banner to each superseded roadmap and point-in-time audit, naming its date/scope and linking to the current authoritative document.
3. Reconcile the database report row by row: mark each old table/migration mismatch as fixed, still open, or unverified against current Drizzle schema/migration evidence.
4. Update the worker note accurately: distinguish tenant-scoped work wrapped in TenantContextManager from intentionally system-scoped dispatcher function calls. Inspect the SQL function definitions and grants before making any security conclusion.
5. Define precedence in `docs/project/README.md`: current Baseline Plan for defect inventory/remediation; current Roadmap for future product execution; older documents only for historical context.
6. Add a lightweight link/status verifier or documentation check only if it can be maintained without creating a brittle duplicate source of truth.

## Dependencies and impacts

- Related to the documentation structure added in the current documentation branch.
- Historical database claims should be reconciled with migration/schema findings, not treated as active technical defects without evidence.
- Security conclusions about privileged dispatcher functions depend on inspection of their SQL definitions, owners, grants and search path.

## Parallelization assessment

**Safe for separate documents; conditional for shared indexes.**
- Individual historical documents can receive status banners in parallel when each file is owned by one reviewer.
- The database report requires a single evidence owner because its table/migration/worker notes are interdependent.
- The docs/project README and root docs index should be edited by one integrator.

## Acceptance criteria

- Every current planning/audit document has an explicit status and date/scope.
- Only one current Baseline Plan and one current Roadmap authority are linked from the docs index.
- All legacy DB mismatch statements are reconciled against current schema/migration/CI evidence.
- Worker context behavior is described accurately without implying unverified security properties.
- Historical information remains recoverable and intact.

## Rollback and recovery

Retain the original historical text in Git history and preferably preserve the body beneath a new status banner. Revert only erroneous status/link changes; never delete historical audit evidence as a cleanup shortcut.

## Verification record

- Cited documentation and code mismatch: **verified by inspection**.
- SQL function security properties: **unresolved; requires a separate inspection before any security conclusion**.
- Implementation: pending.
