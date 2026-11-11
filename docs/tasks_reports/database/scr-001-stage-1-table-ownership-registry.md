---
visibility: internal
---

# SCR-001 Stage 1 — Explicit Table Ownership Registry

**Status:** Implemented  
**Date:** 2026-11-11  
**Repository:** DiabloNova/oxenn  
**Pull request:** #130  
**Branch:** audit/040-scr-001-tenant-ownership-review-20261109  
**Validated code commit:** 5ccf1e2d4f83f8bc3226c00123a611eccd87cd94

## Outcome

Added an explicit, evidence-backed ownership inventory independent of RLS policy presence and independent of the absence of organization/tenant columns. The registry covers all 70 canonical Workspace application tables and all 7 application tables in the isolated Platform Admin database.

Workspace ownership counts:

| Scope | Tables |
|---|---:|
| ORGANIZATION_SCOPED | 56 |
| USER_OWNED | 5 |
| PLATFORM_OWNED | 3 |
| GLOBAL_SHARED | 1 |
| UNRESOLVED | 5 |
| **Total** | **70** |

All 7 Platform Admin tables are PLATFORM_OWNED and are registered separately from Workspace tables.

## Ownership decisions and boundaries

- ORGANIZATION_SCOPED records the current Workspace schema relationships through organization_id / tenant_id and the organizations root. It preserves existing schema semantics; this registry does not introduce a new tenant abstraction or decide the product-level organization model.
- USER_OWNED records direct user identity relationships. In particular, sessions are owned by user_id; optional workspace_id is selected context, not the session owner.
- PLATFORM_OWNED is limited to the verified Workspace platform configuration/authentication records and the separate Platform Admin control-plane tables.
- GLOBAL_SHARED is limited to ai_engines, which is referenced as shared engine catalog data by Workspace observation records.
- UNRESOLVED is explicit and fail-closed for admin_users, audit_records, permissions, roles, and system_configurations. The latter is a legacy candidate in the current Reference Matrix and has no verified active owner/consumer contract. No unresolved table is silently treated as Global.
- feature_flags.tenant_overrides remains an embedded payload; it is not treated as a row-level tenant isolation boundary.
- Platform Admin accounts, OIDC identities, permission grants, sessions, transactions, audit events, and rate-limit state remain isolated from the Workspace database.

## Implementation

1. Added scripts/database/table-ownership-registry.ts with separate Workspace and Platform Admin registries, typed scope/status values, rationale and evidence for every table, a fail-closed lookup, and a schema/registry drift helper.
2. Added tests/unit/core/tenant-context/table-ownership-registry.test.ts to compare Workspace declarations with the latest canonical migration snapshot, compare the Platform Admin schema with its inventory, require rationale/evidence, verify unresolved records, and reject unknown tables.
3. Added docs/database/table-ownership-registry.md and updated docs/database/canonical-data-contract.md.
4. Updated docs/REPOSITORY_CONTEXT.md with the Stage 1 boundary and the unresolved product-contract discrepancy.
5. Updated the generated src/lib/docsIndex.ts artifact so the new documentation page is indexed and the tracked generated output matches the repository generator.

## Validation

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

## Explicit Stage 1 boundary

The new registry is not yet wired into verify-tenant-tables.ts, verify-rls-migrations.ts, build-reference-matrix.ts, or runtime authorization. Those mechanisms retain their previous behavior. Their future integration must be separately scoped and reviewed; this Stage 1 inventory is not evidence that runtime enforcement has changed.

## Remaining architecture decision

The current repository SPEC.md and security context still describe a multi-tenant product model, while the owner has clarified that this task must not introduce a multi-organization product model. Stage 1 preserves existing organization-related schema relationships and does not rewrite that product contract. The discrepancy remains visible and requires a separately scoped architecture decision before any follow-on change alters the organization/tenant model.

## Pull request state

PR #130 remains open for review. It was not merged by this implementation.
