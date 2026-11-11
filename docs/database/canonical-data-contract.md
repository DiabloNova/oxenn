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
   - A deterministic, generated runtime inventory containing only ORGANIZATION_SCOPED tables. The reviewed domain ownership decisions are recorded in `scripts/database/table-ownership-registry.ts`; verify-tenant-tables.ts derives this inventory from that registry and validates registry/schema parity. Unknown tables fail closed.
   - Verified in CI via `scripts/database/verify-tenant-tables.ts`. The verifier independently checks that every tenant-owned table has complete tenant-scoped SELECT / INSERT / UPDATE / DELETE policies. A missing policy is a defect on a tenant-owned table; it never changes the table's ownership classification. Static checks do not prove that migrations have been applied to a live database.

3. **Reference Matrix Documentation** (`docs/database/reference-matrix.md`):
   - An auto-generated matrix reporting independent facts for each table: ownership scope, declared RLS policy objects, tenant-policy coverage, ENABLE / FORCE migration coverage, runtime enforcement verification boundary, indexes, constraints, foreign keys, and known consumers.
   - Generated via `scripts/database/build-reference-matrix.ts`. Ownership is never inferred from policy or migration presence.

---

## Data Segregation Models (Scope)

Tables have an explicit ownership scope. Tenant ownership, RLS policy coverage, migration state, and runtime enforcement are separate governance dimensions; none is inferred from another.

### 1. Explicit ownership scopes

Ownership is recorded per canonical table in scripts/database/table-ownership-registry.ts. The registry uses ORGANIZATION_SCOPED, USER_OWNED, PLATFORM_OWNED, WORKSPACE_GLOBAL, GLOBAL_SHARED, and UNRESOLVED. A table is never classified as Global merely because it lacks organization_id / tenant_id, and RLS policy presence never establishes ownership. Unknown tables fail closed; explicit UNRESOLVED entries remain a distinct review state.

UNRESOLVED is an intentional fail-closed review state. A new or unclassified table must receive an evidence-backed registry entry before it can be considered classified. The registry records rationale and source evidence for every Workspace and Platform Admin application table.

### 2. Existing organization-scoped schema

The Workspace schema currently contains an organizations root and rows related to it through organization_id or tenant_id. The registry records those rows as ORGANIZATION_SCOPED to preserve the repository's existing schema contract. This is not a product decision to introduce or support a multi-organization product model.

- **RLS policy coverage:** RLS policies are a separate security control. Every row requiring organization isolation must have correctly scoped PostgreSQL policies for SELECT, INSERT, UPDATE, and DELETE, linked to current_setting('app.current_tenant_id', true). Missing or incomplete policies are security defects; they do not change ownership.
- **Runtime access:** The generated tenant table map is derived from ORGANIZATION_SCOPED registry entries. The runtime tenant-context implementation itself is unchanged; inventory integration does not by itself change authorization behavior.
- **Isolation verification:** tests/isolation/suite.ts exercises database-level isolation when run against its ephemeral PostgreSQL environment. A static registry or unit test does not prove that a live database is isolated.

### 3. User and platform boundaries

User identity, credentials, tokens, and sessions are classified from their direct user relationship. Platform configuration and the Platform Admin control plane are separately classified as platform-owned. The Platform Admin database remains isolated from the Workspace database; its accounts, grants, sessions, OIDC transactions, rate limits, and audit events are not Workspace tables.

Shared reference data is classified only when schema relationships support that interpretation. Legacy or contradictory tables remain UNRESOLVED until their ownership and disposition are established.
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
   - verify-tenant-tables.ts uses the explicit ownership registry, rejects unknown tables, checks registry/schema parity, derives only ORGANIZATION_SCOPED tables for TENANT_SCOPED_TABLES, and separately checks tenant-policy expressions and operation coverage. Explicit UNRESOLVED entries are reported distinctly. It does not inspect a live database.
   - verify-rls-migrations.ts uses the same registry-backed ORGANIZATION_SCOPED classification and checks the checked-in migration history for final ENABLE ROW LEVEL SECURITY and FORCE ROW LEVEL SECURITY state for those tables. This is a static migration audit, not proof that migrations have been applied to production.
   - The `test:isolation` CI job provisions ephemeral PostgreSQL and exercises tenant isolation. The `test:db` script is not currently invoked by CI; SQL invariants must be included in the isolation suite or the workflow must be updated before claiming those tests run.

---

## Recognized SQL-Only Invariants

Certain database behaviors are enforced directly by PostgreSQL but are difficult or impossible to strictly replicate in the stateless unit testing layer. These represent the boundaries where SQL is the authoritative enforcer:

- **Row Level Security (RLS) enforcement:** The simulator cannot perfectly emulate PostgreSQL's policy evaluation engine. RLS violations are tested strictly in `tests/isolation/suite.ts`.
- **Foreign Key Constraints (`ON DELETE CASCADE`):** Drizzle `schema/index.ts` declarations like `references(() => users.id, { onDelete: "cascade" })` are evaluated by PG triggers. Mock databases do not cascade deletes automatically.
- **Unique Indexes with Functions:** Indexes such as `uniqueIndex("idx_users_lower_email").on(sql\`lower(${table.email})\`)` are enforced by the Postgres b-tree constraint system. The simulator may replicate basic string lowering, but the authoritative proof remains in the SQL schema.
- **Check Constraints:** Specialized data integrity rules (e.g., JSONB structure validation or numeric boundaries) defined via `check(...)`.

When testing these invariants, add assertions to the CI-run isolation suite, or explicitly wire the `test:db` project into CI. Merely naming a test `test:db` does not make CI execute it.
