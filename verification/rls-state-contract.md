# Oxenn RLS State Contract — Phase 1

**Status:** Phase 1 architecture contract  
**Version:** 1.2  
**Reviewed baseline:** `main` at `1517034c5820fb2215567ad3dff2bf04da30c800`  
**Branch:** `phase-1/rls-state-contract`  
**Scope:** Architecture and state semantics only. This file does not modify application behavior, database objects, migrations, tests, CI, or the existing canonical-data documentation.

---

## 1. Purpose and non-goals

This contract establishes one consistent meaning for the different RLS-related states used by Oxenn. It prevents a Drizzle metadata flag, a checked-in snapshot, a SQL migration, or a successful test from being treated as interchangeable evidence.

This contract does **not** claim that a production PostgreSQL database currently has RLS enabled. Oxenn's main application is not connected to a production database in the reviewed context; the internal database simulator is not PostgreSQL and cannot establish PostgreSQL RLS behavior. The repository does contain a separate PostgreSQL-backed isolation suite used with an ephemeral database in CI.

Out of scope for this phase:
- editing canonical documentation or other source files;
- changing Drizzle Schema declarations;
- changing, regenerating, reordering, or replaying migrations or snapshots;
- changing verifiers, tests, runtime code, package scripts, or CI;
- connecting to or changing any non-disposable database;
- opening a pull request or merging changes.

## 2. Terms that MUST remain distinct

### 2.1 Policy declaration

A policy declaration is a Drizzle schema-level definition represented by `pgPolicy()` (or an equivalent PostgreSQL policy declaration). It describes the intended policy name, command, roles, permissive/restrictive mode, `USING`, and `WITH CHECK` expressions.

A policy declaration is not, by itself, proof that PostgreSQL has enabled RLS on the table.

### 2.2 Drizzle table RLS marker

In the repository's locked versions, `drizzle-orm` is **0.45.2** and `drizzle-kit` is **0.31.11**.

In Drizzle ORM 0.45.2:
- a PostgreSQL table's internal `EnableRLS` marker defaults to `false`;
- `.enableRLS()` sets that marker to `true`.

In Drizzle Kit 0.31.11, the provenance of the serialized `isRLSEnabled` field matters:

1. **Schema-to-snapshot generation:** the PostgreSQL serializer reads `enableRLS` from `getTableConfig(table)` and serializes it as `isRLSEnabled`.
2. **Database introspection:** the introspector queries `pg_catalog.pg_class.relrowsecurity` and serializes that database value into the same `isRLSEnabled` field.

Therefore, `isRLSEnabled` is not a provenance-free, universally interpretable runtime status. Its meaning depends on how the snapshot was produced. A consumer MUST know whether a snapshot came from Schema generation or database introspection before interpreting this field.

Oxenn's normal migration-generation path is schema-driven: `drizzle.config.ts` points Drizzle Kit at `database/schema/index.ts` and writes output to `database/drizzle`; the package script is `pnpm db:generate`. When this path produces a snapshot, `isRLSEnabled: false` means that the Schema table declaration has not opted into Drizzle-managed ENABLE generation. It does **not** establish that PostgreSQL has RLS disabled.

However, the JSON snapshot does not encode which producer path created it. The checked-in value is consistent with the configured Schema-to-snapshot workflow and the current absence of `.enableRLS()`, but the historical provenance of every checked-in snapshot has not been independently recorded. Therefore, consumers MUST treat the provenance of historical snapshots as **not self-describing** unless the generating command and target are separately evidenced.

A snapshot produced by database introspection is different: there, the same field represents the observed `pg_class.relrowsecurity` value at introspection time. It still does not record `relforcerowsecurity`. Such a snapshot is only a point-in-time observation of ENABLE; it is not a proof of current state after later database changes.

Version-pinned source evidence:
- Drizzle ORM 0.45.2, tag commit [`273c78071d4841b497f5144734b38294df7ec64b`](https://github.com/drizzle-team/drizzle-orm/tree/273c78071d4841b497f5144734b38294df7ec64b): `drizzle-orm/src/pg-core/table.ts` (default marker and `.enableRLS()` setter) and `drizzle-orm/src/pg-core/utils.ts` (separate extraction of policies and `enableRLS`).
- Drizzle Kit 0.31.11, tag commit [`15454dbe49d827c6081f3d0231e2e7985e517295`](https://github.com/drizzle-team/drizzle-orm/tree/15454dbe49d827c6081f3d0231e2e7985e517295): `drizzle-kit/src/serializer/pgSerializer.ts` (Schema serialization uses `enableRLS`; introspection reads `c.relrowsecurity`); `drizzle-kit/src/snapshotsDiffer.ts` (a false-to-true marker transition emits an `enable_rls` diff); and `drizzle-kit/src/sqlgenerator.ts` (that diff becomes `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, not FORCE).


### 2.3 PostgreSQL catalog state

The physical state of a PostgreSQL table is represented independently by:

- `pg_class.relrowsecurity`: whether RLS is enabled for the table;
- `pg_class.relforcerowsecurity`: whether the table owner is also subject to RLS.

These are separate Boolean properties. Neither one is a substitute for the other, and neither is represented by the migration ledger.

### 2.4 Effective RLS enforcement

Effective enforcement describes what PostgreSQL actually applies to a particular statement under the effective database role, table ownership, privileges, policies, and tenant context.

It is not a single table Boolean. A table can have RLS enabled and still be bypassed by a superuser, a role with `BYPASSRLS`, or (unless FORCE is enabled) its owner.

## 3. Normative state model

For a table and a statement, RLS policy evaluation is effective only when all of the following conditions hold:

1. The statement is within the operations governed by row security.
2. PostgreSQL reports `relrowsecurity = true` for the table.
3. The effective role is not a superuser.
4. The effective role does not have `BYPASSRLS`.
5. If the effective role owns the table, `relforcerowsecurity = true`.
6. The role has the ordinary SQL privileges required by GRANT.
7. At least one applicable permissive policy allows the row operation, and all applicable restrictive policy conditions are satisfied.
8. The policy expression receives a valid and correctly scoped tenant context where tenant isolation is required.

This is a conceptual acceptance predicate, not a replacement for PostgreSQL's own policy evaluation. It is based on the PostgreSQL 18 definitions of [row-security behavior](https://www.postgresql.org/docs/18/ddl-rowsecurity.html), [catalog flags](https://www.postgresql.org/docs/18/catalog-pg-class.html), [role attributes](https://www.postgresql.org/docs/current/role-attributes.html), and [ALTER TABLE ENABLE/FORCE semantics](https://www.postgresql.org/docs/18/sql-altertable.html).

PostgreSQL policy combination rules MUST be respected:
- applicable permissive policies are combined using OR;
- applicable restrictive policies are combined using AND;
- when RLS is enabled and no applicable permissive policy allows access, the default is deny;
- `USING` and `WITH CHECK` serve different purposes and must be checked for the relevant command.

RLS is not a replacement for GRANT. Operations such as `TRUNCATE` and `REFERENCES` are not row-filtered by RLS and require separate privilege control. Security-definer functions and other elevated execution paths must be considered separately when asserting end-to-end tenant isolation.

## 4. Oxenn's tenant-context contract

The current policy model uses `app.current_tenant_id`.

For tenant-scoped operations:

1. The tenant value MUST originate from the authenticated and authorized application context, not an untrusted client-supplied value.
2. It MUST be applied within the transaction that performs the tenant-scoped SQL operation.
3. Transaction-local context MUST be used (for example, `set_config('app.current_tenant_id', value, true)`).
4. Commit and rollback MUST not leave tenant context for a later request on a pooled connection.
5. Missing context MUST fail closed.
6. The tenant key and its SQL type are table-specific. The current schema has UUID-based policy helpers and a text-based policy helper; validation MUST NOT assume every `tenant_id` column is UUID.

For the current expression form `NULLIF(current_setting('app.current_tenant_id', true), '')`, a missing or empty setting becomes NULL. An equality predicate against that NULL does not evaluate to TRUE, so it must not expose tenant rows or authorize a tenant write.

## 5. Roles, ownership, and FORCE contract

The intended application role split is:

- `app_owner`: intended migration/DDL ownership role;
- `app_runtime`: intended narrowly scoped application DML role.

The distinction between intended and proven identity is mandatory. `src/core/database/migrator.ts` chooses its connection string from the explicit argument, then `MIGRATION_DATABASE_URL`, then `DATABASE_URL`; it does not issue `SET ROLE app_owner` or independently verify `current_user`. The isolation suite runs migrations and then explicitly changes table ownership to `app_owner` as part of its disposable test setup. That test fixture does not prove that another deployment's migration connection creates or owns tables as `app_owner`. The actual migration principal and table owners MUST be read from the target database.

Also, `database/bootstrap.sql` creates `app_owner` and `app_runtime` only when they do not already exist. It does not reconcile or verify attributes of pre-existing roles. A successful bootstrap invocation therefore MUST NOT be treated as evidence that existing roles are non-superuser or lack `BYPASSRLS`.

For tenant isolation, `app_runtime` MUST be:
- non-superuser;
- without `BYPASSRLS`;
- not the owner of tenant-scoped tables;
- granted only the SQL privileges needed by the application.

If the architecture intends `app_owner` to be subject to FORCE RLS when it accesses tenant data, `app_owner` MUST also be non-superuser and without `BYPASSRLS`. Table ownership alone is bypassed by FORCE; the `BYPASSRLS` attribute and superuser status remain independent bypass paths.

The effective role executing a query matters. Tests that connect as an administrative role must explicitly switch to the intended runtime role before claiming to test application RLS behavior. Role attributes such as SUPERUSER and BYPASSRLS are not ordinary inherited object privileges; the test and runtime contract must account for the actual effective role, role memberships, and any permitted `SET ROLE` transition. See the [PostgreSQL role-membership rules](https://www.postgresql.org/docs/current/role-membership.html).

The current `database/bootstrap.sql` comments and role declarations do not fully express this contract: role attributes are not explicitly set in the CREATE ROLE statements, and the comment about `app_owner` and BYPASSRLS is ambiguous relative to the requirement that FORCE subject the owner to policies. This is a contract gap to address in a later, separately scoped phase; no role definition is changed here.

## 6. Source-of-truth and evidence hierarchy

| Concern | Authoritative source | What it proves | What it does not prove |
|---|---|---|---|
| Table/column model | Drizzle Schema import graph configured by `drizzle.config.ts` | Declared logical data model | Current physical database state |
| Policy definition | `pgPolicy()` definitions in the Schema graph | Intended policy expressions and command/role scope | That policies were applied or RLS enabled |
| Drizzle ENABLE marker | `.enableRLS()` / internal `EnableRLS` on the table declaration | Whether Schema generation opts into Drizzle-managed ENABLE state | FORCE state or live PostgreSQL state |
| Schema-generated snapshot | Drizzle Kit serializer output | Serialized Schema metadata at generation time | Current database state |
| Introspected snapshot | Drizzle Kit introspection output, with recorded target/time | Catalog state observed at introspection time | Current state after later drift |
| Tenant classification | Explicitly reviewed security inventory | Which tables require tenant isolation | Physical RLS activation |
| Runtime registry | `src/core/database/tenant-tables.generated.ts` | Compiled table-name list consumed by application/tests | Independent source of truth; policy correctness |
| Expected ENABLE/FORCE history | Ordered SQL migration files plus `meta/_journal.json` | Intended migration sequence and DDL recorded in source control | Whether every migration ran successfully or state stayed unchanged |
| Applied migration history | PostgreSQL Drizzle migration ledger (`public.__drizzle_migrations` in this repository's migrator configuration) | Which migration records were applied to that database | Whether current catalog state still matches them |
| Physical ENABLE/FORCE | PostgreSQL catalog (`pg_class`) | Current RLS and FORCE flags for that database | Effective access without role/policy/context analysis |
| Role bypass and ownership | PostgreSQL role catalog and relation ownership | Current superuser/BYPASSRLS/owner facts | Correct tenant context or policy expression |
| Effective behavior | PostgreSQL isolation tests using intended roles and realistic tenant contexts | Observed access behavior for tested cases | Untested tables, roles, code paths, or Production |
| Unit simulator | Internal unit-test simulator | Application-level behavior modeled by unit tests | PostgreSQL policy semantics |

### Important independence rule

The current `TENANT_SCOPED_TABLES` file is generated from the latest Drizzle snapshot. `verify-tenant-tables.ts` derives its expected list from that same snapshot. `verify-rls-migrations.ts` also derives the policy-bearing table set from the latest snapshot before replaying migration SQL.

These checks are useful for consistency, but they share a source input. Agreement between them is not independent proof that the original Schema classification is complete or that live PostgreSQL is secure.

Accordingly:
- the generated registry is a consumer artifact, not the canonical security inventory;
- a future verifier must avoid treating Snapshot/Registry agreement as an independent security census;
- tenant-vs-global classification must be explicit. Absence from the tenant registry MUST NOT automatically classify a table as globally accessible;
- an unclassified table is not implicitly safe and must remain an explicit review item.

## 7. Current Oxenn baseline recorded by this contract

The reviewed `main` baseline contains:

- Drizzle ORM 0.45.2 and Drizzle Kit 0.31.11 in the lockfile;
- 14 entries in `database/drizzle/meta/_journal.json`, ending at migration 0013;
- 70 tables in `0013_snapshot.json`;
- 51 policy-bearing tables and 204 policy declarations in that snapshot;
- `isRLSEnabled = false` for all 70 tables in that checked-in snapshot;
- no `.enableRLS()` call in the reviewed non-legacy Schema modules;
- exactly 51 `ENABLE ROW LEVEL SECURITY` statements and 51 `FORCE ROW LEVEL SECURITY` statements in `0005_force_rls.sql`, for the same 51 tables;
- cumulative ENABLE statements for those 51 tables already appearing across migrations 0000–0003 (44 + 2 + 1 + 4); migration 0005 also records ENABLE and FORCE for all 51.

The repeat ENABLE statements in migration 0005 are historical source-controlled DDL. This contract does not authorize rewriting or removing them. It also does not authorize generating a new migration to repeat them.

The repository's CI workflow provisions an ephemeral PostgreSQL 16 service for `tests/isolation/suite.ts`. That is real PostgreSQL test evidence when the job runs successfully; it is not evidence about a Production database. The main application database remains the internal simulator in the reviewed user context, so live Production Catalog state is **UNVERIFIED**.

The current code also does not provide a complete tenant-vs-global classification for all 70 snapshot tables:
- the generated tenant registry contains 51 tables;
- `GLOBAL_TABLES` in `tests/isolation/suite.ts` contains 14 tables;
- the two sets have no overlap;
- five snapshot tables occur in neither set and are therefore **UNCLASSIFIED**, not implicitly global:
  - `auth_rate_limits`
  - `email_verification_tokens`
  - `password_reset_tokens`
  - `sessions`
  - `user_credentials`

The 14-entry `GLOBAL_TABLES` test constant is not a canonical security inventory. The five unclassified tables require an explicit security classification in a later approved phase; this contract does not classify them or change their access behavior.

## 8. Architecture decisions

The following decisions are normative for the current Oxenn architecture:

**D1 — Keep physical RLS activation SQL-managed.**  
`ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` remain responsibilities of the ordered SQL migration history.

**D2 — Do not use `.enableRLS()` merely to make a checked-in Snapshot display `true`.**  
In the locked Drizzle Kit 0.31.11 implementation, changing the Schema marker from false to true is a migration diff that can emit ENABLE statements. It does not represent FORCE and does not prove the live catalog. A metadata-only motive is insufficient.

**D3 — Do not infer live state from a Schema-generated `isRLSEnabled` value.**  
Likewise, do not infer the Schema declaration from a field populated by database introspection without retaining its provenance.

**D4 — Do not duplicate or rewrite historical RLS migrations for metadata alignment.**  
Migration 0005 and historical snapshots remain unchanged under this contract.

**D5 — Do not treat Snapshot/Registry/verifier agreement as independent end-to-end proof.**  
Each verification layer must report precisely which source it reads and which claim it establishes.

**D6 — Production status is not claimed until a read-only query against the actual target PostgreSQL instance verifies catalog, role, owner, and policy state.**  
An absent connection or unavailable query is UNVERIFIED, never PASS.

## 9. Evidence required before claiming effective tenant isolation

A complete runtime claim requires evidence from the same disposable or explicitly authorized target database:

1. Table inventory compared against the reviewed tenant security inventory.
2. `relrowsecurity` and `relforcerowsecurity` for every tenant table.
3. Full policy catalog: schema/table, policy name, command, roles, permissive/restrictive mode, `qual`, and `with_check`.
4. Relation owners and effective runtime role attributes, including superuser and BYPASSRLS.
5. Relevant GRANTs and role memberships/effective execution role.
6. Tenant-context transaction behavior, including missing context and rollback/commit cleanup.
7. Cross-tenant SELECT, INSERT, UPDATE, and DELETE tests.
8. Explicit treatment of owner access under FORCE and of any elevated/security-definer path in scope.
9. The target identity, PostgreSQL version, migration ledger, exact commands, and exit statuses.

A successful static verifier can support items about source-controlled Schema/Migration consistency only. A successful ephemeral isolation suite supports only the cases and database it actually exercised. Neither is a Production Catalog inspection.

## 10. Explicitly deferred work

The following items belong to later approved phases and are not implemented by this contract:

- Phase 2: reconcile canonical-data and tenant-context documentation with this contract;
- Phase 3: improve independent static validation and drift detection;
- Phase 4: strengthen PostgreSQL isolation tests and role/bypass assertions;
- Phase 5: read-only inspection of an explicitly identified real PostgreSQL target, if one becomes available;
- Phase 6: CI integration and final evidence reporting.

No code, schema, migration, snapshot, role, policy, database, test, or workflow changes are implied by this document.

---

## 11. Acceptance of Phase 1

Phase 1 is complete when the project has one unambiguous contract that:

- separates Policy declaration, Drizzle marker, PostgreSQL catalog state, and effective enforcement;
- records the provenance-sensitive meaning of `isRLSEnabled` for Drizzle Kit 0.31.11;
- names a single authority for each claim and identifies shared-source limitations;
- defines role, ownership, FORCE, GRANT, policy-combination, and tenant-context requirements;
- records current baseline counts without claiming unverified Production state;
- prohibits metadata-driven duplicate ENABLE migrations under the current SQL-managed architecture.

**Phase 1 result:** Architecture contract established. Implementation and canonical documentation synchronization remain deferred.
