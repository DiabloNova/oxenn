# Canonical Data Contract

## Architecture & Governance

The Oxenn database is defined strictly through **Drizzle ORM**. There is exactly one canonical representation of the truth: the runtime schema declarations located in `database/schema/index.ts`. All changes to the database structure, policy enforcement, and domain types originate here.

### Quarantined Legacy Definitions
The `database/schema/_legacy/` directory contains legacy object-based schemas (`TableDefinition`). These are physically quarantined. They **must not** be imported or used as authoritative representations of the data model. `database/schema/index.ts` is the single source of truth.

### Generated Artifacts
While `database/schema/index.ts` is the source, it is compiled into several critical artifacts used for migration, validation, and testing:

1. **Drizzle Migration Journal** (`database/drizzle/meta/_journal.json` & SQL files):
   - This is the canonical source for physical database migrations.
   - It is generated exclusively via `pnpm db:generate`.
   - Never edit the JSON metadata or generated SQL manually.

2. **Runtime Tenant Scoped Tables Map** (`src/core/database/tenant-tables.generated.ts`):
   - A deterministic, generated array of all tables configured with at least one Row Level Security (RLS) policy in the current Drizzle snapshot.
   - Verified in CI via `scripts/database/verify-tenant-tables.ts` to ensure the application logic (e.g. `isTenantScopedTable` checks) does not drift from actual enforced policies.

3. **Reference Matrix Documentation** (`docs/database/reference-matrix.md`):
   - An auto-generated matrix mapping tables to their scope (Global vs. Tenant-Scoped), RLS status, and known consumers in the codebase.
   - Generated via `scripts/database/build-reference-matrix.ts`.

---

## Data Segregation Models (Scope)

Tables are partitioned into two strictly distinct security models based on multi-tenant architecture.

### 1. Global Tables
Global tables contain core application configurations, user identities, system metadata, or definitions that apply identically across all tenants.

- **RLS Disabled (❌):** They do not have `tenant_id` boundaries.
- **Access Rule:** Can be accessed via standard database clients. No special `tenant_id` context injection is needed, though application-level logic must still verify role permissions.

### 2. Tenant-Scoped Tables
Tenant-scoped tables contain domain data belonging to a specific workspace or organization.

- **RLS Enabled (✅):** They *must* have a Postgres Policy defined linking access to `current_setting('app.current_tenant', true)`.
- **Access Rule:** Can only be queried by non-owner roles (e.g., `app_runtime`) when the session has properly set the `app.current_tenant` parameter using `set_config`. Attempting to query these without a context will result in empty result sets or RLS constraint violations (42501).
- **Isolation Enforcement:** Directly validated via `tests/isolation/suite.ts` which provisions a real database and executes assertions proving that cross-tenant read/write/update/delete operations are explicitly blocked by the database layer.

---

## Validation Vectors

The data contract is verified via multiple independent testing paths:

1. **Unit Testing & The Internal Simulator (`tests/unit/*`)**
   - Pure, stateless behavior.
   - Relies on application-layer isolation assertions and mocking. It *does not* prove that data is actually secure on disk, only that domain logic attempts to pass the correct arguments to repositories.
   - **Environment:** No database connection attached (`DATABASE_URL` is undefined).

2. **Tenant Isolation Testing (`tests/isolation/suite.ts`)**
   - Connects to a live ephemeral PostgreSQL instance.
   - Runs migrations via Drizzle schema.
   - Inserts cross-tenant fixtures.
   - Verifies that raw SQL commands run as the `app_runtime` role are successfully repelled by RLS policies when crossing tenant boundaries or omitting the tenant context.
   - **Environment:** Requires a running PostgreSQL instance. Uses explicit role separation (`app_owner` vs `app_runtime`) as defined in `database/bootstrap.sql`.

3. **Schema Policy Verification (`tests/db/*` and `verify-tenant-tables.ts`)**
   - Compares the `pgPolicy` blocks embedded in `database/schema/index.ts` against the list of `TENANT_SCOPED_TABLES`.
   - Halts CI (`SCHEMA DRIFT DETECTED`) if a developer creates a tenant table without generating its policy map.

---

## Recognized SQL-Only Invariants

Certain database behaviors are enforced directly by PostgreSQL but are difficult or impossible to strictly replicate in the stateless unit testing layer. These represent the boundaries where SQL is the authoritative enforcer:

- **Row Level Security (RLS) enforcement:** The simulator cannot perfectly emulate PostgreSQL's policy evaluation engine. RLS violations are tested strictly in `tests/isolation/suite.ts`.
- **Foreign Key Constraints (`ON DELETE CASCADE`):** Drizzle `schema/index.ts` declarations like `references(() => users.id, { onDelete: "cascade" })` are evaluated by PG triggers. Mock databases do not cascade deletes automatically.
- **Unique Indexes with Functions:** Indexes such as `uniqueIndex("idx_users_lower_email").on(sql\`lower(${table.email})\`)` are enforced by the Postgres b-tree constraint system. The simulator may replicate basic string lowering, but the authoritative proof remains in the SQL schema.
- **Check Constraints:** Specialized data integrity rules (e.g., JSONB structure validation or numeric boundaries) defined via `check(...)`.

When testing these invariants, developers must classify the test as a `test:db` or add it to the isolation suite to ensure accurate verification against the real engine.
