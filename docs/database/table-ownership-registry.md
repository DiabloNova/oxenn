# Canonical Table Ownership Registry

**Status:** SCR-001 Stage 1  
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
| GLOBAL_SHARED | Shared reference/catalog data consumed by multiple domain records and not owned by a user or organization. |
| UNRESOLVED | Current evidence does not establish a safe owner. This is an explicit review state, never a synonym for Global. |

status distinguishes current schema contracts from legacy records and unresolved ownership. Legacy tables remain in the inventory until a separately authorized removal or migration decision is made.

## Inventory coverage

- Workspace schema: 70 tables, all declared in database/schema/index.ts or its canonical organization-table.ts and api-keys.ts exports.
- Platform Admin schema: 7 tables in database/platform-admin/schema/index.ts, backed by its own database, configuration, migration directory, and migration history.
- The Platform Admin Drizzle migration ledger is infrastructure metadata, not an application table, and is not included in the seven-table application inventory.
- database/schema/_legacy/ is quarantined and is not an authoritative schema source.

The focused unit test compares the Workspace registry against all canonical Drizzle table declarations and the latest Workspace migration snapshot, and compares the Platform Admin registry against its separate Drizzle schema. Missing or stale entries fail the test. Unknown table lookups throw instead of falling back to Global.

## Explicit unresolved Workspace entries

| Table | Why unresolved |
|---|---|
| admin_users | Legacy Workspace admin identity table. Platform Admin authentication explicitly does not read it; its data disposition is not established. |
| audit_records | Generic actor/resource audit rows have no organization/user foreign key or documented ownership contract. |
| permissions | Frozen legacy authorization table; current authorization source is organization_members.role. Historical data disposition is unresolved. |
| roles | Frozen legacy authorization table; current authorization source is organization_members.role. Historical data disposition is unresolved. |
| system_configurations | Marked ORPHAN-TABLE (LEGACY-CANDIDATE) in the current reference matrix; no verified consumer or ownership contract establishes an owner. |

The schema also contains platform configuration tables and a shared AI-engine catalog. Their entries explain the evidence and any embedded-field caveats. In particular, feature_flags.tenant_overrides is an embedded payload, not a row-level tenant isolation boundary.

## Stage boundary

SCR-001 Stage 1 establishes and tests the explicit inventory only. It does not integrate the registry into verify-tenant-tables.ts, verify-rls-migrations.ts, build-reference-matrix.ts, or runtime authorization. Those existing mechanisms retain their current behavior until a separately scoped follow-up stage. Consequently, this stage does not claim that runtime enforcement or generated ownership inventories have changed.

No RLS policies, migrations, database connections, runtime authorization, or Platform Admin activation are changed by this registry.
