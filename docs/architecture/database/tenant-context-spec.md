# PostgreSQL Row Level Security (RLS) & Tenant Context Specification

This document details the architecture, configuration, and security guarantees achieved by implementing PostgreSQL Row Level Security (RLS) for tenant isolation across the application database schema.

---

## 1. Architectural Overview

To ensure zero-trust tenant isolation, the database layer implements real PostgreSQL Row Level Security. Every database table owned by a tenant contains a tenant partition identifier (`organization_id` or `tenant_id`). The system enforces isolation dynamically via runtime database-level policies rather than relying purely on application-level filtering.

```
                   ┌────────────────────────────────────────┐
                   │       Application Layer Session        │
                   │ (Active tenant identity: tenant_uuid)  │
                   └───────────────────┬────────────────────┘
                                       │
                                       ▼ (Execute SQL inside Transaction)
                    SET LOCAL app.current_tenant_id = 'tenant_uuid';
                                       │
                                       ▼
                   ┌────────────────────────────────────────┐
                   │    PostgreSQL Engine RLS Evaluation    │
                   ├────────────────────────────────────────┤
                   │  SELECT / UPDATE / DELETE checks:      │
                   │    USING (organization_id = tenant_id) │
                   │  INSERT / UPDATE checks:               │
                   │    WITH CHECK (organization_id = ...)  │
                   └────────────────────────────────────────┘
```

---

## 2. Session Context Injection Assumptions

PostgreSQL maps session state to RLS policies using the `current_setting(setting_name, true)` utility. The application and persistence layer make the following technical assumptions:

1. **Transaction-Scoped Settings**: Prior to issuing any query or mutation against a tenant-scoped table within a leased database client or transaction, the application must execute the following session variable configuration statement:
   ```sql
   SET LOCAL app.current_tenant_id = 'your-tenant-uuid-here';
   ```
   - Using `SET LOCAL` guarantees that the tenant parameter is strictly bound to the active transaction block and automatically discarded upon transaction commit, rollback, or connection return to the pool (preventing cross-connection contamination).
2. **Strict Session Matching**: If a query is executed without first configuring the session setting, `NULLIF(current_setting('app.current_tenant_id', true), '')` evaluates to `NULL`, and all operations will fail to retrieve or modify any records, complying with a secure-by-default standard.
3. **No Ownership Changes / Hijacking**:
   - `INSERT`: Policies enforce that any newly created row has a tenant partition ID matching the active `app.current_tenant_id`. Any attempt to insert records belonging to another tenant is blocked with a security violation.
   - `UPDATE`: Policies enforce a dual-check:
     - The `USING` clause ensures the administrator is updating a row that currently belongs to their tenant session.
     - The `WITH CHECK` clause ensures that the resulting updated row *remains* under their tenant partition. This prevents any ownership hijacking or changing the partition column of existing records.

---

## 3. Ownership and RLS Coverage

This specification describes transaction-scoped tenant context; it is not a manually maintained table inventory. The canonical ownership rule and separation of ownership, policy declarations, migration coverage, and runtime verification are defined in the [Canonical Data Contract](../../database/canonical-data-contract.md). The generated [Database Reference Matrix](../../database/reference-matrix.md) is the current per-table inventory.

A table is Tenant-Owned according to the canonical schema ownership markers (`organization_id` or `tenant_id`, rooted at `organizations`) and reviewed exceptions—not according to whether a policy happens to exist. Every Tenant-Owned table must have complete SELECT, INSERT, UPDATE, and DELETE tenant policies. The checked-in migration chain must enable and force RLS. These are distinct static checks. Runtime enforcement is established only by the PostgreSQL isolation suite against its disposable test database; static documentation does not prove production database state.

Do not copy table names or counts into this execution-context specification. Consult the generated Reference Matrix for the current repository inventory.

---

## 4. Reversibility and Zero-Downtime Migration Pattern

Migrations that enable or modify RLS are designed to be safe and reversible:
- To revert RLS policies, a migration can simply run:
  ```sql
  ALTER TABLE tableName DISABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS select_tenant_isolation_policy ON tableName;
  DROP POLICY IF EXISTS insert_tenant_isolation_policy ON tableName;
  DROP POLICY IF EXISTS update_tenant_isolation_policy ON tableName;
  DROP POLICY IF EXISTS delete_tenant_isolation_policy ON tableName;
  ```
- Because RLS policies are executed dynamically on every database query, zero-downtime deployment is ensured by deploying transaction-scoped settings in application repositories *before* applying policy definitions to the target PostgreSQL cluster.
