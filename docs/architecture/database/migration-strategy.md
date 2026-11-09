# Relational Database Migration Strategy

This specification details the canonical schema modeling, migration execution, and deployment strategy for the AI Visibility Intelligence relational schema.

---

## 1. Migration Tech Stack

We utilize **Drizzle ORM** paired with **Drizzle Kit** for schema modeling, SQL generation, schema diffing, and programmatic migration execution.

```
 [Canonical Drizzle Schema] (database/schema/index.ts)
         │
         ▼  (pnpm run db:generate / drizzle-kit generate)
 [SQL Migration Artifacts] (database/drizzle/*.sql)
         │
         ▼  (pnpm run db:migrate / src/core/database/migrator.ts)
 [Target PostgreSQL / Neon Cluster]
```

- **ORM Client**: Drizzle ORM (`drizzle-orm`)
- **Migration CLI & Diff Engine**: Drizzle Kit (`drizzle-kit`)
- **Programmatic Runner**: `src/core/database/migrator.ts`
- **Target database**: PostgreSQL (v16+) / Neon Serverless PostgreSQL

---

## 2. Directory Hierarchy

All database definitions and generated migration scripts are version-controlled within the repository:

```
database/
  schema/
    index.ts             # Canonical schema entry point (68 local table declarations)
    organization-table.ts # Separately declared organizations table, composed into the schema
    api-keys.ts          # Separately declared api_keys table, re-exported by index.ts
    organization.ts      # Legacy TableDefinition metadata file (retained for reference)
    ...                  # Domain schema metadata files
  drizzle/
    meta/                # Drizzle Kit snapshots and migration metadata records
    0000_*.sql           # Auto-generated Drizzle migration scripts
  migrations/
    0001-0014_*.sql      # Historical hand-rolled SQL migrations (archived artifacts)
```

The effective canonical schema contains **70 tables**: 68 `pgTable` declarations in `database/schema/index.ts`, plus `organizations` from `organization-table.ts` and `api_keys` from `api-keys.ts`. The latest checked-in snapshot is `database/drizzle/meta/0014_snapshot.json`.

---

## 3. Operations & Package Scripts

The repository enforces a single migration mechanism with standard `package.json` scripts:

### Step 3.1: Schema Generation
When modifying TypeScript table definitions in the canonical schema modules under `database/schema/`, generate incremental SQL migration scripts:
```bash
pnpm run db:generate
```

### Step 3.2: Database Migration Execution
Apply pending migration scripts programmatically against the configured `DATABASE_URL`:
```bash
pnpm run db:migrate
```

### Step 3.3: Local Sandbox Schema Push (Dev Only)
Directly push schema changes to a local disposable development database without generating migration files:
```bash
pnpm run db:push
```

---

## 4. Architectural Rules & Guardrails

1. **Single Source of Truth**: Canonical table, index, constraint, and relation definitions live in the schema modules under `database/schema/` and are composed/exported through `database/schema/index.ts`.
2. **Deterministic Execution**: Foreign key creation and table references are strictly dependency-ordered. Core tables (`organizations`, `brands`, `entities`) are bootstrapped before dependent foreign keys.
3. **Multi-Tenant Isolation**: Tenant-scoped tables enforce PostgreSQL Row Level Security (RLS) policies tied to `app.current_tenant_id` transaction settings via `TenantContextManager`. The 56-table tenant-owned inventory is derived from ownership columns and kept aligned across the latest Drizzle snapshot, the generated runtime tenant-table list, and the ordered RLS migrations.
4. **Disposable Verification**: Schema migrations are validated against empty disposable PostgreSQL instances prior to production deployments.


## 5. Tenant-Consistent Junction References

Migration `0015_db_001_composite_tenant_fks.sql` strengthens the five tenant-owned junction tables. Their foreign keys pair each referenced record ID with the junction row's `organization_id`, and the referenced parent tables expose matching unique indexes on `(id, organization_id)`. Supporting indexes are created on both child-side reference pairs.

Before changing any constraint, the migration performs read-only checks for tenant mismatches across all ten junction-to-parent relationships. It raises an exception and stops without changing data when a mismatch exists. Existing single-column foreign keys remain in place until the replacement composite foreign keys have been successfully added, preserving referential enforcement throughout the transition. No automatic reassignment or deletion of inconsistent rows is performed.

The repository currently has no connected application database, so the preflight has not been run against production data from this change. It executes when the migration is applied and must pass before the new constraints can be installed. The isolation suite also verifies that a tenant cannot create a junction row referencing either a left-side or right-side parent owned by another tenant.
