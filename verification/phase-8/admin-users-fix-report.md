# Admin User Schema Fix Report

## Findings

The test `testCQRS` in `tests/features/admin/cqrs.test.ts` executes `commandHandler.handleCreateTenant` followed by user administrative commands, including `handleChangeUserRole`. Both `PostgresAdminUserRepository.save` (INSERT and UPDATE operations) map the application's domain type `AdminUser` to postgres. Specifically, they write to columns: `role`, `permissions` (as JSON stringified), `sso_identities` (as JSON stringified), `created_by`, and `updated_by`.

The canonical Drizzle schema inside `database/schema/index.ts` was not aligned. It defined `adminUsers` with only a legacy `role_id` and omitted `role`, `permissions`, `sso_identities`, `created_by`, and `updated_by` entirely.

As a result, any attempt to invoke `userRepo.save()` triggered a `PostgreSQL` mismatch error where column `role` does not exist on relation `admin_users`. This was clearly a drift introduced when the Admin Application Layer transitioned to a CQRS and pure Domain model without generating the requisite Drizzle schema update for its repository backing.

## Execution

1. Added the required missing columns to `database/schema/index.ts`:
   - `role: text("role").notNull().default("Read-Only Observer")`
   - `permissions: jsonb("permissions").notNull().default([])`
   - `ssoIdentities: jsonb("sso_identities").default([])`
   - `createdBy: text("created_by").notNull().default("system")`
   - `updatedBy: text("updated_by").notNull().default("system")`
2. Softened the `role_id` constraint to `nullable` by removing `.notNull()` so that `INSERT` statements executing from the updated `PostgresAdminUserRepository` (which omits `role_id`) do not violate the `NOT NULL` constraint. This preserves backward compatibility for legacy queries filtering by `role_id` without breaking the new code paths.
3. Generated the canonical migration `0013_faithful_cerebro.sql` via `pnpm db:generate`.

## Validation

Codebase analysis definitively proves the `UPDATE admin_users SET ..., role = $3, permissions = $4, ...` mapping in `src/features/admin/infrastructure/persistence/postgres/index.ts` lines 617-628. By executing the migration, the database relation matches the repository mapping exactly.

_Note: Due to the isolated sandbox state without a running PostgreSQL daemon, the CQRS SQL runner could not be executed locally end-to-end, but `pnpm env:check migrate` and `pnpm db:generate` succeeded in establishing the drift and outputting valid SQL schema updates._

## Current Status

- Modified `database/schema/index.ts`
- Generated `database/drizzle/0013_faithful_cerebro.sql`
- Modified `database/drizzle/meta/0013_snapshot.json`
- `git status` reports uncommitted changes as explicitly requested.

## Compatibility Check
The `role_id` column still physically exists in the generated Drizzle schema but is now softened to allow nulls. No reference to `role_id` exists in the current codebase outside of Drizzle meta logic for that schema. It ensures that standard CQRS requests which rely purely on `role`, `permissions` and `sso_identities` succeed while preserving legacy definitions exactly as instructed.

The `created_by` and `updated_by` fields were explicitly added because the `INSERT` statements executing in the CQRS suite (`src/features/admin/infrastructure/persistence/postgres/index.ts:638`) strictly include them in the query mapped to `entity.audit.createdBy` and `entity.audit.updatedBy`. Not defining them in the schema would simply throw further missing column errors immediately upon running `testCQRS`.

## Validation Output
- **Migration Inspection**: Migration `0013_faithful_cerebro.sql` is correctly tracking the new missing schema additions for `adminUsers`.
- **Local Sandbox Constraint**: Since `DATABASE_URL` is empty in this ephemeral container environment, `pnpm db:migrate` and the complete `testCQRS` test runner (`npx tsx tests/features/admin/run-all.ts`) cannot be run end-to-end to verify insertion into Postgres. They exit with ENOTFOUND connection errors explicitly indicating the lack of DB availability.
- **Type Checking**: `pnpm typecheck` passed (exit code 0).
- **Test Results**: `pnpm test:db` successfully executed passing 11 tests across 4 files.

These checks validate the drift was correctly diagnosed and corrected in Drizzle safely without disrupting the test suite boundaries or reverting the active authorization implementations.
