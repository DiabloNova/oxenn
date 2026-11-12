---
visibility: internal
---

# SCR-001 — Explicit Table Ownership Registry (Stages 1–2)

**Status:** Stage 1 and Stage 2 implemented  
**Date:** 2026-11-11  
**Repository:** DiabloNova/oxenn  
**Pull request:** #130  
**Branch:** audit/040-scr-001-tenant-ownership-review-20261109  
**Stage 1 code commit:** 5ccf1e2d4f83f8bc3226c00123a611eccd87cd94
**Stage 2 validation:** CI run #751 passed on code commit 88b6df55ea9e691e16efa2e7f720987956ccd4f3.

## Outcome

Added an explicit, evidence-backed ownership inventory independent of RLS policy presence and independent of the absence of organization/tenant columns. The registry covers all 70 canonical Workspace application tables and all 7 application tables in the isolated Platform Admin database.

Workspace ownership counts:

| Scope | Tables |
|---|---:|
| ORGANIZATION_SCOPED | 56 |
| USER_OWNED | 5 |
| PLATFORM_OWNED | 3 |
| WORKSPACE_GLOBAL | 4 |
| GLOBAL_SHARED | 1 |
| UNRESOLVED | 1 |
| **Total** | **70** |

All 7 Platform Admin tables are PLATFORM_OWNED and are registered separately from Workspace tables.

## Ownership decisions and boundaries

- ORGANIZATION_SCOPED records the current Workspace schema relationships through organization_id / tenant_id and the organizations root. It preserves existing schema semantics; this registry does not introduce a new tenant abstraction or decide the product-level organization model.
- USER_OWNED records direct user identity relationships. In particular, sessions are owned by user_id; optional workspace_id is selected context, not the session owner.
- PLATFORM_OWNED is limited to the verified Workspace platform configuration/authentication records and the separate Platform Admin control-plane tables.
- WORKSPACE_GLOBAL identifies Workspace-database-wide data that is not Platform Admin control-plane data: legacy admin_users, the privileged Workspace audit_records stream, and the frozen legacy roles/permissions catalogs.
- GLOBAL_SHARED is limited to ai_engines, which is referenced as shared engine catalog data by Workspace observation records.
- UNRESOLVED remains explicit for system_configurations because the Reference Matrix marks it as an orphan/legacy candidate with no verified consumer or ownership contract. It is not treated as Global.
- feature_flags.tenant_overrides remains an embedded payload; it is not treated as a row-level tenant isolation boundary.
- Platform Admin accounts, OIDC identities, permission grants, sessions, transactions, audit events, and rate-limit state remain isolated from the Workspace database.

## Implementation

1. Added scripts/database/table-ownership-registry.ts with separate Workspace and Platform Admin registries, typed scope/status values, rationale and evidence for every table, a fail-closed lookup, and a schema/registry drift helper.
2. Added tests/unit/core/tenant-context/table-ownership-registry.test.ts to compare Workspace declarations with the latest canonical migration snapshot, compare the Platform Admin schema with its inventory, require rationale/evidence, verify unresolved records, and reject unknown tables.
3. Added docs/database/table-ownership-registry.md and updated docs/database/canonical-data-contract.md.
4. Updated docs/REPOSITORY_CONTEXT.md with the Stage 1 and Stage 2 boundaries and the unresolved product-contract discrepancy.
5. Updated the generated src/lib/docsIndex.ts artifact so the new documentation page is indexed and the tracked generated output matches the repository generator.
6. Integrated the explicit registry into verify-tenant-tables.ts, verify-rls-migrations.ts, and build-reference-matrix.ts. Unknown tables fail closed; only ORGANIZATION_SCOPED tables feed the generated tenant runtime inventory and tenant RLS/migration checks.
7. Updated the tracked Reference Matrix to show all six ownership scopes and to mark system_configurations RLS applicability as not evaluated while ownership remains unresolved.

## Stage 2 validation

CI workflow run #751 (workflow run ID 43024728474) passed on code commit 88b6df55ea9e691e16efa2e7f720987956ccd4f3. All jobs and steps passed: Unit Tests, UI Tests, Isolation Suite, Typecheck, Lint, tenant schema alignment, RLS migration coverage, Phase 0 and documentation checks, Drizzle migration chain, Build, Reference Matrix generation, and generated tracked-file no-drift verification.

## Stage 1 validation

Final CI workflow run: 42994650847 (run number 739), on code commit 5ccf1e2d4f83f8bc3226c00123a611eccd87cd94.

All jobs and steps completed successfully:

- Unit Tests, including the new ownership registry tests
- Isolation Suite
- Typecheck
- Lint
- Dependency audit gate and audit gate regression tests
- Verify tenant tables schema alignment
- Verify RLS migration coverage
- Verify Phase 0 baseline and documentation links
- Verify RLS documentation consistency
- Verify Drizzle migration chain
- Build
- Build Reference Matrix
- Verify generated tracked files (no drift)

No live/production database migrations, RLS policy changes, runtime authorization changes, or database connection changes were made. The existing CI isolation suite ran as configured against its ephemeral test database.

## Stage 2 integration and boundaries

The explicit registry is now the sole ownership classifier for verify-tenant-tables.ts, verify-rls-migrations.ts, and build-reference-matrix.ts. Missing registry entries fail closed. Only ORGANIZATION_SCOPED entries are included in TENANT_SCOPED_TABLES and evaluated by tenant RLS/migration coverage. USER_OWNED, PLATFORM_OWNED, WORKSPACE_GLOBAL, and GLOBAL_SHARED remain distinct in the generated matrix. The single UNRESOLVED entry, system_configurations, is surfaced as unresolved and is not labeled Global or given an inferred RLS status.

The runtime tenant-context implementation and authorization code are unchanged. No RLS policies, SQL migrations, database connections, or live database state were changed. The generated runtime table inventory is regenerated from the registry-backed organization scope; this is an inventory correction, not a runtime authorization redesign.

## Remaining architecture decisions

- system_configurations remains UNRESOLVED pending an owner decision on retention/removal and data ownership. Its name and shape alone are not sufficient to classify it as platform-owned.
- The current repository SPEC.md and security context still describe a multi-tenant product model, while the owner has clarified that this task must not introduce a multi-organization product model. Stages 1–2 preserve existing organization-related schema relationships and do not rewrite that product contract. Any change to the product/organization model remains a separately scoped architecture decision.

## Pull request state

PR #130 remains open for review. It was not merged by this implementation.
