# Canonical Data Contract

## Architecture & Governance

The Oxenn database is defined strictly through **Drizzle ORM**. There is exactly one canonical representation of the application schema: the Drizzle declarations located in `database/schema/index.ts`. Physical database behavior is realized by the migration history, including SQL-only operations such as enabling and forcing row-level security (RLS). Schema changes should originate in the declarations; migration files remain the record of how those changes are applied.

### Quarantined Legacy Definitions
The `database/schema/_legacy/` directory contains legacy object-based schemas (`TableDefinition`). These are physically quarantined. They **must not** be imported or used as authoritative representations of the data model. `database/schema/index.ts` is the single source of truth.

### Generated Artifacts
While `database/schema/index.ts` is the source, it is compiled into several critical artifacts used for migration, validation, and testing:

1. **Drizzle Migration Journal** (`database/drizzle/meta/_journal.json` & SQL files):
   - This is the canonical source for physical database migrations.
   - It is generated exclusively via `pnpm db:generate`.
   - Never edit the JSON metadata or generated SQL manually.

2. **Runtime Tenant-Owned Tables Map** (`src/core/database/tenant-tables.generated.ts`):
   - A deterministic, generated inventory of tables owned by an organization. Ownership is derived from the canonical Drizzle snapshot: `organizations` is the tenant root, and `organization_id` / `tenant_id` are ownership markers unless a reviewed exception with a non-empty rationale is recorded in `GLOBAL_OWNERSHIP_EXCEPTIONS`.
   - Verified in CI via `scripts/database/verify-tenant-tables.ts`. The verifier independently checks that every tenant-owned table has complete tenant-scoped SELECT / INSERT / UPDATE / DELETE policies. A missing policy is a defect on a tenant-owned table; it never changes the table's ownership classification. Static checks do not prove that migrations have been applied to a live database.

3. **Reference Matrix Documentation** (`docs/database/reference-matrix.md`):
   - An auto-generated matrix reporting independent facts for each table: ownership scope, declared RLS policy objects, tenant-policy coverage, ENABLE / FORCE migration coverage, runtime enforcement verification boundary, indexes, constraints, foreign keys, and known consumers.
   - Generated via `scripts/database/build-reference-matrix.ts`. Ownership is never inferred from policy or migration presence.

---

## Data Segregation Models (Scope)

Tables have an explicit ownership scope. Tenant ownership, RLS policy coverage, migration state, and runtime enforcement are separate governance dimensions; none is inferred from another.

### 1. Global Tables
Global tables contain core application configurations, user identities, system metadata, or definitions that apply identically across all tenants.

- **Ownership classification:** A table is Global when it is not `organizations` and has neither an `organization_id` nor a `tenant_id` ownership marker. A table carrying either marker may be classified Global only through a reviewed entry in `GLOBAL_OWNERSHIP_EXCEPTIONS` with a non-empty rationale. Absence of an RLS policy or absence from the runtime tenant-owned map is never evidence of Global ownership. RLS settings and policies, if any, are reported independently.
- **Access Rule:** Can be accessed via standard database clients. No special `tenant_id` context injection is needed, though application-level logic must still verify role permissions.

### 2. Tenant-Scoped Tables
Tenant-scoped tables contain domain data belonging to a specific workspace or organization.

- **Ownership classification:** `organizations` is the tenant root. Other tables with `organization_id` or `tenant_id` are Tenant-Owned unless an explicit, reviewed exception with a rationale applies.
- **Tenant RLS policy coverage:** Every Tenant-Owned table *must* have correctly scoped PostgreSQL policies for SELECT, INSERT, UPDATE, and DELETE, linking access to `current_setting('app.current_tenant_id', true)`. Missing or incomplete policies are security defects; they do not change ownership scope.
- **Access Rule:** Can only be queried by non-owner roles (e.g., `app_runtime`) when the session has properly set the `app.current_tenant_id` parameter using `set_config`. Attempting to query these without a context will result in empty result sets or RLS constraint violations (42501).
- **Isolation Enforcement:** Directly validated via `tests/isolation/suite.ts` which provisions a real database and executes assertions proving that cross-tenant read/write/update/delete operations are explicitly blocked by the database layer.

---

## Validation Vectors

The data contract is verified via multiple independent testing paths:

1. **Unit Testing & The Internal Simulator (`tests/unit/*`)**
   - Pure, stateless behavior.
   - Relies on application-layer isolation assertions and mocking. It *does not* prove that data is actually secure on disk, only that domain logic attempts to pass the correct arguments to repositories.
   - **Environment:** CI does not provision a database service for the unit-test job; individual tests may set `DATABASE_URL` for their own mocks or fixtures.

2. **Tenant Isolation Testing (`tests/isolation/suite.ts`)**
   - Connects to a live ephemeral PostgreSQL instance.
   - Runs migrations via Drizzle schema.
   - Inserts cross-tenant fixtures.
   - Verifies that raw SQL commands run as the `app_runtime` role are successfully repelled by RLS policies when crossing tenant boundaries or omitting the tenant context.
   - **Environment:** Requires a running PostgreSQL instance. Uses explicit role separation (`app_owner` vs `app_runtime`) as defined in `database/bootstrap.sql`.

3. **Schema Policy and Migration Verification** (`verify-tenant-tables.ts` and `verify-rls-migrations.ts`)
   - `verify-tenant-tables.ts` derives ownership from the canonical snapshot and compares that inventory with `TENANT_SCOPED_TABLES`; it separately checks tenant-policy expressions and operation coverage. It does not inspect a live database.
   - `verify-rls-migrations.ts` uses the same ownership classifier and checks the checked-in migration history for final `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` state for every Tenant-Owned table. This is a static migration audit, not proof that migrations have been applied to production.
   - The `test:isolation` CI job provisions ephemeral PostgreSQL and exercises tenant isolation. The `test:db` script is not currently invoked by CI; SQL invariants must be included in the isolation suite or the workflow must be updated before claiming those tests run.

---

## Recognized SQL-Only Invariants

Certain database behaviors are enforced directly by PostgreSQL but are difficult or impossible to strictly replicate in the stateless unit testing layer. These represent the boundaries where SQL is the authoritative enforcer:

- **Row Level Security (RLS) enforcement:** The simulator cannot perfectly emulate PostgreSQL's policy evaluation engine. RLS violations are tested strictly in `tests/isolation/suite.ts`.
- **Foreign Key Constraints (`ON DELETE CASCADE`):** Drizzle `schema/index.ts` declarations like `references(() => users.id, { onDelete: "cascade" })` are evaluated by PG triggers. Mock databases do not cascade deletes automatically.
- **Unique Indexes with Functions:** Indexes such as `uniqueIndex("idx_users_lower_email").on(sql\`lower(${table.email})\`)` are enforced by the Postgres b-tree constraint system. The simulator may replicate basic string lowering, but the authoritative proof remains in the SQL schema.
- **Check Constraints:** Specialized data integrity rules (e.g., JSONB structure validation or numeric boundaries) defined via `check(...)`.

When testing these invariants, add assertions to the CI-run isolation suite, or explicitly wire the `test:db` project into CI. Merely naming a test `test:db` does not make CI execute it.
