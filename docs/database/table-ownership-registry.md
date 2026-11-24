# Canonical Table Ownership Registry

**Status:** SCR-001 Stage 2  
**Workspace source:** database/schema/index.ts and its canonical modular schema sources, including database/schema/users.ts, database/schema/organization-table.ts, database/schema/api-keys.ts, and database/schema/user-profile.ts. The canonical barrel re-exports every table; Drizzle configuration consumes the barrel only.  
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

- Workspace schema: 72 tables, declared by database/schema/index.ts and its canonical modular schema sources. The user_profiles declaration lives in database/schema/user-profile.ts, references users from database/schema/users.ts, and is re-exported by database/schema/index.ts. Both Drizzle configurations and application consumers use the canonical barrel.
- Current Workspace ownership inventory: 57 ORGANIZATION_SCOPED, 6 USER_OWNED, 3 PLATFORM_OWNED, 4 WORKSPACE_GLOBAL, 1 GLOBAL_SHARED, and 1 UNRESOLVED.
- Platform Admin schema: 7 tables in database/platform-admin/schema/index.ts, backed by its own database, configuration, migration directory, and migration history.
- The Platform Admin Drizzle migration ledger is infrastructure metadata, not an application table, and is not included in the seven-table application inventory.
- `brand_entity_associations` is an Organization-scoped Workspace junction introduced by migration `0017_entity_brand_associations`; its composite foreign keys bind each Brand and Entity to the same Organization.
- database/schema/_legacy/ is quarantined and is not an authoritative schema source.

The Workspace migration journal records SQL migration execution order, while Drizzle snapshots represent generated schema states. A custom SQL-only migration does not necessarily have a same-index snapshot. In particular, 0005_force_rls.sql is the custom RLS migration between snapshots 0004 and 0006; 0006_snapshot.json correctly links to 0004_snapshot.json through prevId. This is an intentional snapshot-index gap, not a missing migration or a reason to manufacture an empty snapshot.

The latest Workspace schema snapshot includes user_profiles. Its schema declaration, migration SQL, snapshot table definition, and explicit USER_OWNED registry entry must remain aligned. The focused unit test verifies the latest generated snapshot lineage, schema/snapshot table parity, and ownership-registry coverage.

## Explicit unresolved Workspace entries

| Table | Why unresolved |
|---|---|
| system_configurations | Marked ORPHAN-TABLE (LEGACY-CANDIDATE) in the generated reference matrix, with no verified active consumer or ownership contract. Its name and columns are insufficient evidence to classify it as platform-owned. |

The other four Stage 1 review entries now have evidence-backed Workspace-global classifications:
- admin_users is consumed by the existing Workspace admin persistence adapter and is explicitly not the Platform Admin identity source.
- audit_records is the Workspace privileged audit stream written through system context and read by the Workspace admin persistence adapter; it is distinct from platform_admin_audit_events.
- roles and permissions are frozen legacy Workspace-global catalogs; the schema explicitly identifies organization_members.role as the current authorization source.

The schema also contains platform configuration tables and a shared AI-engine catalog. Their entries explain the evidence and any embedded-field caveats. In particular, feature_flags.tenant_overrides is an embedded payload, not a row-level tenant isolation boundary.

## Stage boundary

SCR-001 Stage 2 integrates the explicit registry into verify-tenant-tables.ts, verify-rls-migrations.ts, and build-reference-matrix.ts. Unknown tables now fail closed instead of falling back to a column-marker classifier. Only ORGANIZATION_SCOPED entries feed the generated TENANT_SCOPED_TABLES runtime inventory and tenant RLS/migration checks. Other explicit scopes remain distinct in the Reference Matrix. UNRESOLVED is reported as unresolved and is not presented as Global or as having verified RLS applicability.

Runtime authorization code and its tenant-context enforcement are not changed. The generated tenant table list is still the organization-scoped subset only. No RLS policies, migrations, database connections, or Platform Admin activation are changed by this stage.
