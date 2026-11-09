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
   - A deterministic, generated array of every organization-owned / tenant-owned table in the latest Drizzle snapshot. Ownership is derived from the canonical schema: `organizations` is the tenant root, and `organization_id` / `tenant_id` are ownership markers on dependent tables.
   - The inventory includes tenant-owned tables even when their RLS policies are missing or incomplete. Missing protection must never remove a table from the ownership inventory or make it appear Global.
   - Verified in CI via `scripts/database/verify-tenant-tables.ts`, which checks ownership inventory drift and independently reports missing or incomplete SELECT / INSERT / UPDATE / DELETE tenant policies. This is a snapshot check, not proof of live RLS enforcement.

3. **Reference Matrix Documentation** (`docs/database/reference-matrix.md`):
   - An auto-generated matrix mapping tables to their scope (Global vs. Tenant-Scoped), declared RLS policies, indexes, constraints, foreign keys, and known consumers in the codebase.
   - Generated via `scripts/database/build-reference-matrix.ts`.

---

## Data Segregation Models (Scope)

Tables are partitioned into two strictly distinct security models based on multi-tenant architecture.

### 1. Global Tables
Global tables contain platform-wide configurations, user identities, system metadata, or definitions that apply identically across organizations.

- **Ownership rule:** A table is Global only when its canonical schema does not declare an organization / tenant ownership marker and it is not the `organizations` tenant root. Any deliberate exception for a table carrying `organization_id` or `tenant_id` must be explicitly reviewed and recorded with a non-empty rationale in `GLOBAL_OWNERSHIP_EXCEPTIONS` in `scripts/database/verify-tenant-tables.ts`.
- **RLS is independent:** A table's absence of an RLS policy does not make it Global. Likewise, the presence or absence of a policy does not determine ownership. Global tables may still have policies for other access-control purposes.
- **Access Rule:** Access remains subject to database roles and application authorization. Tenant context is not implied by Global ownership.

### 2. Tenant-Owned Tables
Tenant-Owned tables contain domain data belonging to a specific workspace or organization. The `organizations` table is the tenant root and is tenant-owned through its own `id`; dependent tables are tenant-owned when their canonical schema declares `organization_id` or `tenant_id`, unless an explicitly approved exception is recorded.

- **Tenant RLS policy coverage:** Every tenant-owned table must declare tenant-scoped PostgreSQL policies covering SELECT, INSERT, UPDATE, and DELETE, using the canonical `current_setting('app.current_tenant_id', true)` context. Missing or incomplete policies are security defects; they do not change the table's ownership classification.
- **Access Rule:** Non-owner application roles (e.g., `app_runtime`) can access tenant-owned rows only with the properly established `app.current_tenant_id` transaction context. Missing context must fail closed.
- **Isolation Enforcement:** Actual database enforcement is verified by `tests/isolation/suite.ts`, which provisions PostgreSQL and exercises cross-tenant read/write/update/delete behavior using the runtime role. Static metadata alone does not prove this behavior.
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

3. **Schema Ownership, Policy, and Migration Verification** (`verify-tenant-tables.ts`, `verify-rls-migrations.ts`, and `build-reference-matrix.ts`)
   - `verify-tenant-tables.ts` derives ownership from the latest Drizzle snapshot (`organizations`, `organization_id`, and `tenant_id`) independently of policy presence. It compares that ownership set with `TENANT_SCOPED_TABLES` and separately checks all four tenant-policy operations. It does not inspect a live database.
   - `verify-rls-migrations.ts` uses the same ownership classifier and checks the checked-in migration journal, in order, for final `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` state for every tenant-owned table. This is static evidence only, not proof that migrations have been applied to production.
   - `build-reference-matrix.ts` reports ownership scope, policy declarations, tenant-policy coverage, migration coverage, and runtime enforcement verification as separate fields. Runtime enforcement is explicitly marked as unverified by static generation.
   - The `test:isolation` CI job provisions ephemeral PostgreSQL and exercises tenant isolation using `app_runtime`. The `test:db` script is not currently invoked by CI; claims about live enforcement must be grounded in the isolation suite, not a script name or static artifact.

---

## Recognized SQL-Only Invariants

Certain database behaviors are enforced directly by PostgreSQL but are difficult or impossible to strictly replicate in the stateless unit testing layer. These represent the boundaries where SQL is the authoritative enforcer:

- **Row Level Security (RLS) enforcement:** The simulator cannot perfectly emulate PostgreSQL's policy evaluation engine. RLS violations are tested strictly in `tests/isolation/suite.ts`.
- **Foreign Key Constraints (`ON DELETE CASCADE`):** Drizzle `schema/index.ts` declarations like `references(() => users.id, { onDelete: "cascade" })` are evaluated by PG triggers. Mock databases do not cascade deletes automatically.
- **Unique Indexes with Functions:** Indexes such as `uniqueIndex("idx_users_lower_email").on(sql\`lower(${table.email})\`)` are enforced by the Postgres b-tree constraint system. The simulator may replicate basic string lowering, but the authoritative proof remains in the SQL schema.
- **Check Constraints:** Specialized data integrity rules (e.g., JSONB structure validation or numeric boundaries) defined via `check(...)`.

When testing these invariants, add assertions to the CI-run isolation suite, or explicitly wire the `test:db` project into CI. Merely naming a test `test:db` does not make CI execute it.
