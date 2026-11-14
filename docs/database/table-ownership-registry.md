# Canonical Table Ownership Registry

**Status:** SCR-001 Stage 2  
**Workspace source:** database/schema/index.ts and its canonical modular exports  
**Platform Admin source:** database/platform-admin/schema/index.ts

## Purpose and authority

scripts/database/table-ownership-registry.ts is the explicit, reviewed ownership inventory for the application's canonical database tables. Each table has a scope, lifecycle status, rationale, and evidence. Classification is based on repository domain/schema contracts, not on RLS policy presence, migration coverage, or the absence of a tenant column.

The registry distinguishes the Workspace database from the isolated Platform Admin database. Their tables are not interchangeable and must not be combined into one runtime database boundary.

## Scope values

| Scope | Meaning |
|---|---|
| ORGANIZATION_SCOPED | The current Workspace schema explicitly relates the row to organizations through organization_id or tenant_id, or the table is the organization root. This records existing schema semantics only; it does not create or promise a multi-organization product model. |
| USER_OWNED | The row belongs to a user identity through a direct user identity contract. A session's optional workspace_id is context, not its owner. |
| PLATFORM_OWNED | The row is platform control/configuration state, including the isolated Platform Admin control plane. |
| WORKSPACE_GLOBAL | Shared or legacy records owned at the Workspace application boundary, but not by an organization or user. This is distinct from Platform Admin control-plane ownership. |
| GLOBAL_SHARED | Shared reference/catalog data consumed by multiple domain records and not owned by a user or organization. |
| UNRESOLVED | Current evidence does not establish a safe owner. This is an explicit review state, never a synonym for Global. |

status distinguishes current schema contracts from legacy records and unresolved ownership. Legacy tables remain in the inventory until a separately authorized removal or migration decision is made.

## Inventory coverage

- Workspace schema: 71 tables, all declared in database/schema/index.ts or its canonical organization-table.ts and api-keys.ts exports.
- Current Workspace ownership inventory: 56 ORGANIZATION_SCOPED, 5 USER_OWNED, 4 PLATFORM_OWNED, 4 WORKSPACE_GLOBAL, 1 GLOBAL_SHARED, and 1 UNRESOLVED.
- Platform Admin schema: 7 tables in database/platform-admin/schema/index.ts, backed by its own database, configuration, migration directory, and migration history.
- The Platform Admin Drizzle migration ledger is infrastructure metadata, not an application table, and is not included in the seven-table application inventory.
- database/schema/_legacy/ is quarantined and is not an authoritative schema source.

The focused unit test compares the Workspace registry against all canonical Drizzle table declarations and the latest Workspace migration snapshot, and compares the Platform Admin registry against its separate Drizzle schema. Missing or stale entries fail the test. Unknown table lookups throw instead of falling back to Global.

## Explicit unresolved Workspace entries

| Table | Why unresolved |
|---|---|
| system_configurations | Marked ORPHAN-TABLE (LEGACY-CANDIDATE) in the generated reference matrix, with no verified active consumer or ownership contract. Its name and columns are insufficient evidence to classify it as platform-owned. |

The other four Stage 1 review entries now have evidence-backed Workspace-global classifications:
- admin_users is consumed by the existing Workspace admin persistence adapter and is explicitly not the Platform Admin identity source.
- audit_records is the Workspace privileged audit stream written through system context and read by the Workspace admin persistence adapter; it is distinct from platform_admin_audit_events.
- roles and permissions are frozen legacy Workspace-global catalogs; the schema explicitly identifies organization_members.role as the current authorization source.

The schema also contains platform configuration tables, the encrypted email_outbox delivery queue, and a shared AI-engine catalog. email_outbox is PLATFORM_OWNED because it is delivery infrastructure rather than user- or organization-owned application data. Their entries explain the evidence and any embedded-field caveats. In particular, feature_flags.tenant_overrides is an embedded payload, not a row-level tenant isolation boundary.

## Stage boundary

SCR-001 Stage 2 integrates the explicit registry into verify-tenant-tables.ts, verify-rls-migrations.ts, and build-reference-matrix.ts. Unknown tables now fail closed instead of falling back to a column-marker classifier. Only ORGANIZATION_SCOPED entries feed the generated TENANT_SCOPED_TABLES runtime inventory and tenant RLS/migration checks. Other explicit scopes remain distinct in the Reference Matrix. UNRESOLVED is reported as unresolved and is not presented as Global or as having verified RLS applicability.

The privileged-path registry is extended with the narrowly scoped sys-email-outbox purpose; email_outbox remains outside the generated tenant-scoped table inventory. Migration 0016 adds this platform-owned table without enabling RLS or changing Platform Admin. No production database connection is used and no migration is applied to a live database by this code change.
