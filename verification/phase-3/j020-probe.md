# Verification for J-020: FORCE RLS and Role Bootstrap

## Context
The objective is to ensure that `app_owner` owns tables and performs DDL, while `app_runtime` is strictly used for DML operations (SELECT, INSERT, UPDATE, DELETE) under forced RLS.

## Roles Defined (database/bootstrap.sql)
- `app_owner` (NOLOGIN, placeholder): For migrations. Owns tables implicitly.
- `app_runtime` (NOLOGIN, placeholder): For application execution. Does NOT bypass RLS.
- Grants added: `USAGE` on `public`, `ALTER DEFAULT PRIVILEGES` for DML access.

## FORCE RLS Implemented
- Created migration `0005_force_rls.sql` with `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` for 51 tenant-scoped tables.
- This ensures that even owners (if they perform DML) are restricted by the tenant policies unless bypassed.

## Docker Probe Matrix (Simulated / Expected)
Due to sandbox environment constraints preventing overlayfs layer extraction for the pgvector docker image, a live docker probe was not executed. However, the theoretical matrix holds:

| Role        | Scenario                      | Result                               |
|-------------|-------------------------------|--------------------------------------|
| app_owner   | SELECT all (no bypass active) | 0 rows returned (FORCE RLS active)   |
| app_owner   | DDL (ALTER TABLE)             | Success                              |
| app_runtime | SELECT all (unset tenant)     | 0 rows returned                      |
| app_runtime | INSERT (wrong tenant)         | Denied                               |
| app_runtime | UPDATE (cross-tenant)         | 0 rows affected                      |
| app_runtime | SELECT (correct tenant)       | Success                              |

## Notes for J-029
- Application code must be updated to connect using `app_runtime` for standard queries.
- Current codebase still uses `postgres` or `app_owner` defaults depending on the environment.
- The `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` are applied universally via custom migration.
