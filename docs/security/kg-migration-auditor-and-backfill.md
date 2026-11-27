# Workspace Knowledge Graph Migration Auditor and Backfill

## Purpose

Workspace Knowledge Graph migrations must not use an unscoped `UPDATE` under forced Row Level Security (RLS). The ordinary Workspace migrator remains subject to tenant RLS. A separate, read-only auditor checks global integrity, while the Backfill uses the ordinary migrator one tenant at a time.

The tool is `pnpm db:kg-integrity`:

- `pnpm db:kg-integrity audit` performs a read-only global audit.
- `pnpm db:kg-integrity backfill` performs a read-only Backfill dry-run.
- `pnpm db:kg-integrity backfill --apply --confirm-database oxenn_workspace` applies the idempotent, tenant-scoped Backfill.

The tool never prints connection URLs, passwords, tenant identifiers, entity names, or entity payloads.

## PostgreSQL role separation

The Workspace database requires two independent credentials:

| Role | RLS behavior | Required permissions | Purpose |
| --- | --- | --- | --- |
| `oxenn_workspace_auditor` | `BYPASSRLS` | Column-level `SELECT` only on approved columns in `entities`, `entity_relationships`, `kg_entities`, and `kg_relationships` | Read-only global integrity audit |
| `oxenn_workspace_migrator` | No `BYPASSRLS` | Existing migration privileges, including tenant-scoped `SELECT` and `UPDATE` on the graph tables | Controlled tenant-by-tenant Backfill |

Never grant `BYPASSRLS` to `oxenn_workspace_migrator`, `app_runtime`, or another runtime role. The auditor is a separate login and must not be a member of another PostgreSQL role. It must not be a table owner, database owner, superuser, role administrator, or database creator.

The auditor must have no table-wide `SELECT` privilege. Grant only the following columns:

- `public.entities`: `id`, `organization_id`, `name`, `entity_type`, `deleted_at`.
- `public.entity_relationships`: `id`, `organization_id`, `source_entity_id`, `target_entity_id`, `relationship_type`, `deleted_at`.
- `public.kg_entities`: `id`, `tenant_id`, `name`, `type`. After migration 0018, additionally grant `canonical_entity_id`, `resolution_status`, `resolution_method`, and `resolved_at`.
- `public.kg_relationships`: `id`, `tenant_id`, `source_entity_id`, `target_entity_id`.

Do not grant access to `properties`, `source_chunk_ids`, document content, credentials, or unrelated tables. The verification script fails closed if any additional application-table column is readable, if the auditor has any write privilege, or if it can execute an application `SECURITY DEFINER` function.

## Provisioning the auditor

Provision the role separately on the intended `oxenn_workspace` database using the approved database-owner procedure. Do not put a password in SQL, source control, a migration, a workflow file, shell history, or chat. Set the credential through the approved Neon/secret-management interface and store the resulting connection URL only in the GitHub Environment secret `OXENN_WORKSPACE_AUDIT_DATABASE_URL`. Configure a distinct environment-scoped URL in both `database-migration-rehearsal` and `production-database-migrations`; never reuse the Production connection string in the rehearsal environment.

For a database where the role does not exist, the database owner can use the following as a provisioning checklist. It deliberately omits a password; set the login credential only through the approved Neon/secret-management interface. Do not run this as part of application migrations:

```sql
CREATE ROLE oxenn_workspace_auditor
  LOGIN BYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE
  NOREPLICATION NOINHERIT;

ALTER ROLE oxenn_workspace_auditor
  SET default_transaction_read_only = on;

ALTER ROLE oxenn_workspace_auditor
  SET row_security = on;

GRANT CONNECT ON DATABASE oxenn_workspace TO oxenn_workspace_auditor;
GRANT USAGE ON SCHEMA public TO oxenn_workspace_auditor;

GRANT SELECT (id, organization_id, name, entity_type, deleted_at)
  ON TABLE public.entities TO oxenn_workspace_auditor;

GRANT SELECT (id, organization_id, source_entity_id, target_entity_id, relationship_type, deleted_at)
  ON TABLE public.entity_relationships TO oxenn_workspace_auditor;

GRANT SELECT (id, tenant_id, name, type)
  ON TABLE public.kg_entities TO oxenn_workspace_auditor;

GRANT SELECT (id, tenant_id, source_entity_id, target_entity_id)
  ON TABLE public.kg_relationships TO oxenn_workspace_auditor;
```

After migration 0018 has added the resolution columns, grant only those four additional columns on `kg_entities`:

```sql
GRANT SELECT (canonical_entity_id, resolution_status, resolution_method, resolved_at)
  ON TABLE public.kg_entities TO oxenn_workspace_auditor;
```

The migration workflow performs the global audit of both EntityRelationships (migration 0017) and Knowledge Graph relationships (migration 0019) before it runs Workspace migrations. Migration 0018 cannot grant access to columns that do not yet exist. Therefore, after successful migrations 0017/0018/0019, the database owner must apply the four-column grant above and verify the auditor's grants before running a new read-only Backfill dry-run and then the separate Backfill workflow. The Backfill workflow is deliberately separate from schema migration so a partially provisioned auditor cannot leave schema changes applied while silently skipping data.

Run `pnpm db:kg-integrity backfill` in the matching protected environment first. This command is read-only and reports aggregate unique/no-match/multiple-match classifications. Review its output and ensure the auditor can read the four new canonical-resolution columns. Only then dispatch the manual workflow **Workspace KG Canonical Backfill**. It accepts only the `main` ref, requires `confirm_preflight_reviewed=true` and `confirm_backfill=true`, and requires an additional `confirm_production=true` when `database_target=production`. It connects only to `oxenn_workspace`; it never touches Platform Admin. Do not dispatch it until migrations 0017, 0018, and 0019 are applied, the auditor's new-column grant is in place, and the migration rehearsal has passed.

This checklist is not a self-service grant script. If the role already exists, stop and inspect its role memberships, database grants, table grants, column grants, ownership, and role configuration before changing it. Do not assume that applying the GRANT statements removes older privileges.

The auditor URL and migrator URL must target the same direct PostgreSQL host, port, and `oxenn_workspace` database. The tool rejects Neon pooler endpoints, role/database mismatches, TLS downgrade, destination overrides, and extra URL options. The migrator URL is read from `OXENN_WORKSPACE_MIGRATION_DATABASE_URL`; it is never substituted with a runtime URL.

## Migration ordering

1. Run the global `audit` before Workspace migrations. This checks the existing `entity_relationships` integrity targeted by migration 0017, the KG source/target endpoint integrity targeted by migration 0019, RLS, and role boundaries. Before migration 0018, canonical-resolution columns are reported as unavailable; that is expected.
2. Migration 0017 contains a preflight query that executes under the migration role's RLS context; do not treat that block as a global view because it may not see other tenants. The dedicated auditor performs the global endpoint and duplicate checks before migration. Migration 0017's composite foreign keys and partial unique index remain authoritative, and PostgreSQL validates them before they can be accepted.
3. Keep migration 0018 schema-only. It adds canonical-resolution columns, indexes, foreign keys, and checks. It must not execute a global canonical-entity `UPDATE`.
4. Let migration 0019 install the tenant-composite KG endpoint foreign keys. PostgreSQL validates existing rows when adding these constraints and aborts the migration on a missing or cross-tenant endpoint. Do not rely on an RLS-filtered `DO` block to count global rows.
5. After migrations 0017, 0018, and 0019 have been applied, run `backfill` without `--apply` and inspect the aggregate dry-run.
6. Apply only after the dry-run is clean and the operator explicitly confirms `--confirm-database oxenn_workspace`. The tool rechecks the schema, constraints, RLS state, auditor role, and migrator role before writing.

The repository's migration runner remains the only Workspace migration path. This Backfill is a separate, explicit data-maintenance command; it does not edit the Drizzle journal or execute schema migrations.

## Backfill transaction behavior

The tool discovers tenant IDs through the auditor but never writes using that connection. It processes each tenant in its own `SERIALIZABLE` transaction using the ordinary `oxenn_workspace_migrator` role and `SET LOCAL app.current_tenant_id`.

Before each transaction, it acquires the same transaction-lock key used by `src/services/knowledge-graph/graph-write-lock.ts` (`oxenn:tenant-graph-write`). This serializes the Backfill with graph mutations that use the repository's graph-write lock. Each tenant transaction then:

1. Counts existing matched, unresolved, ambiguous, and total rows.
2. Finds active canonical entities within the same tenant using normalized name and exact entity type.
3. Marks a row `matched` only when exactly one canonical candidate exists.
4. Leaves zero-candidate rows `unresolved`.
5. Marks rows with multiple candidates `ambiguous`.
6. Never rewrites rows already marked `matched`.
7. Recounts and verifies total-row preservation and exact status reconciliation before commit.

A failed tenant transaction is rolled back. Tenant transactions that already committed remain committed; rerunning the command is safe because the Backfill is idempotent. The command stops on any failed reconciliation and runs a new global audit after all tenants complete. Do not report success unless the post-Backfill audit has zero invalid matched references, zero invalid statuses, zero unmatched classification mismatches, and zero missing or cross-tenant relationship endpoints.

The advisory lock coordinates application graph writers that use the shared graph-write-lock helper. Run the command in the controlled migration window and do not run independent bulk writers against these tables at the same time.

## Required verification

The command verifies:

- Exact database and PostgreSQL role identity for both connections.
- Auditor `BYPASSRLS`, forced read-only transaction/session configuration, no role memberships, no table ownership, no write privileges, and exact column grants.
- Migrator has no `BYPASSRLS`, no elevated role flags, and the tenant-scoped graph read/update privileges needed by the Backfill.
- RLS is both enabled and forced on `entities`, `entity_relationships`, `kg_entities`, and `kg_relationships`.
- Migration 0018 resolution columns and checks, plus migration 0019 validated tenant-composite constraints, before any Backfill write.
- Per-tenant serializable transaction context, lock ordering, row-count reconciliation, rollback on failure, and a final global audit.

Run the unit tests with:

```sh
pnpm exec vitest run --project unit tests/unit/scripts/database/kg-migration-integrity.test.ts
pnpm run typecheck
pnpm run lint
```

A successful dry-run is not permission to apply the Backfill. The `--apply` flag and exact database confirmation are required on every write invocation. Production execution remains subject to the separate manual Production workflow and explicit operator approval.
