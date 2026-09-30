# C06-MP1 Runner Inventory

This document provides a ground-truth inventory of all executable test runner entry points under `tests/` based on evidence in the live file system.

## 1. Runner Entry Points

### `tests/features/acquisition/run-all.ts`
- **Invocation:** Executed via `pnpm test:acquisition` (`tsx tests/features/acquisition/run-all.ts`)
- **DB/Connection:** Does not read `process.env.DATABASE_URL` nor import any DB connection directly.
- **Exit Code Handling:** Uses `process.exitCode = 1;` on failure.
  ```typescript
  main().catch((error: unknown) => {
    console.error("❌ acquisition suite failed", error);
    process.exitCode = 1;
  });
  ```
- **External Dependencies:** None required during runtime.
- **Classification:** PURE
- **Execution Result:**
  - Command: `pnpm tsx tests/features/acquisition/run-all.ts`
  - Exit Code: `0`
  - Output summary:
    ```
    ✅ acquisition suites passed
    ```

### `tests/services/monitoring/run-all.ts`
- **Invocation:** None (No corresponding package.json script)
- **DB/Connection:** Does not read `process.env.DATABASE_URL` nor import any DB connection directly.
- **Exit Code Handling:** Uses `process.exit(1);` on failure.
  ```typescript
  runAll().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
  });
  ```
- **External Dependencies:** None required during runtime.
- **Classification:** PURE
- **Execution Result:**
  - Command: `pnpm tsx tests/services/monitoring/run-all.ts`
  - Exit Code: `0`
  - Output summary:
    ```
    ✅ Tenant Isolation Behavioral Pattern tests passed (strictly follows zero-trust boundaries)!
    ✅ Repository Behavioral Pattern tests passed (strictly follows TenantContextManager constraints)!
    ```

### `tests/features/admin/run-all.ts`
- **Invocation:** None (No corresponding package.json script)
- **DB/Connection:** Needs a database connection. Attempts to instantiate `PostgresClient`.
  ```typescript
  import { testPostgresIntegration } from "./infrastructure/postgres-integration.test";
  ```
- **Exit Code Handling:** Uses `process.exit(1);` on failure.
  ```typescript
  } catch (error) {
    console.error("\n❌ ADMIN TEST SUITE RUNNER FAILURE:", error);
    process.exit(1);
  }
  ```
- **External Dependencies:** Requires local PostgreSQL.
- **Classification:** DB
- **Execution Result:**
  - Command: `pnpm tsx tests/features/admin/run-all.ts`
  - Exit Code: `1`
  - Output summary:
    ```
    ❌ ADMIN TEST SUITE RUNNER FAILURE: Error: DATABASE_URL is required
    ```
  - **CI Hazard:** `j038.md` flagged this runner with "prints-and-exits-0? YES", meaning in some error conditions it might fail silently. The db job must enforce non-zero exit codes.

### `tests/features/ai-intelligence/run-all.ts`
- **Invocation:** None (No corresponding package.json script)
- **DB/Connection:** Uses `pg` module and requires a DB connection.
  ```typescript
  import { Pool } from "pg";
  ```
- **Exit Code Handling:** Uses `process.exit(1);` on failure.
  ```typescript
  } catch (error) {
    console.error("\n❌ TEST SUITE RUNNER FAILURE:", error);
    process.exit(1);
  }
  ```
- **External Dependencies:** Requires local PostgreSQL.
- **Classification:** DB
- **Execution Result:**
  - Command: `pnpm tsx tests/features/ai-intelligence/run-all.ts`
  - Exit Code: `1`
  - Output summary:
    ```
    ❌ TEST SUITE RUNNER FAILURE: Error: DATABASE_URL is required
    ```

### `tests/features/acquisition/integration/run-all.ts`
- **Invocation:** None (No corresponding package.json script)
- **DB/Connection:** Explicitly reads `process.env.DATABASE_URL` and manages connections.
  ```typescript
  const databaseUrl = process.env.DATABASE_URL;
  ```
- **Exit Code Handling:** Uses `process.exitCode = 1;` on failure.
  ```typescript
  main().catch((error: unknown) => {
    console.error("❌ acquisition integration suite failed", error);
    process.exitCode = 1;
  });
  ```
- **External Dependencies:** Requires local PostgreSQL.
- **Classification:** DB
- **Execution Result:** RAN, exit 0 — silently skipped (`⚠️ acquisition integration suite skipped: DATABASE_URL is not set`).
- **CI Hazard:** env-conditional silent skip (per j038). The db job MUST set/assert `DATABASE_URL`, or the runner should exit non-zero when it is unset in CI.

### `tests/isolation/suite.ts`
- **Invocation:** Executed via `pnpm test:isolation` (`tsx tests/isolation/suite.ts`)
- **DB/Connection:** Creates test databases and sets environment variable programmatically.
  ```typescript
  process.env.DATABASE_URL = testDbUrl;
  ```
  ```typescript
  import { Pool, PoolClient } from "pg";
  ```
- **Exit Code Handling:** Uses `process.exit(1);` on failure.
  ```typescript
    } else {
      console.error(`❌ Isolation suite failed.`);
      process.exit(1);
    }
  ```
- **External Dependencies:** Requires local PostgreSQL.
- **Classification:** DB
- **Execution Result:**
  - Command: `pnpm tsx tests/isolation/suite.ts`
  - Exit Code: `1`
  - Output summary: Fails with `ECONNREFUSED` attempting to connect to `::1:5432` due to missing database instance.

## 2. J038.md Discrepancy Cross-Check
The runner classifications were cross-checked against `verification/phase-7/j038.md`.

*Discrepancies & Hazards:*
- **tests/features/acquisition/integration/run-all.ts:** Found to silently skip and exit 0 when `DATABASE_URL` is missing. This confirms the "env-conditional silent skip? YES" flag in `j038.md`. This is a CI hazard; the DB job MUST supply `DATABASE_URL` or the test should be modified to enforce failure.
- **tests/features/admin/run-all.ts:** Flagged in `j038.md` as "prints-and-exits-0? YES". Although it exited 1 in our missing-URL environment, the CI job wiring must be robust against any internal silent failures.

Other core categorizations (DB vs unit/pure) matched the existing claims.

## 3. Summary Lists

### RECOMMENDED FOR CI (pure job)
- `tests/features/acquisition/run-all.ts`
- `tests/services/monitoring/run-all.ts`

### RECOMMENDED FOR CI (db job)
- `tests/features/admin/run-all.ts`
- `tests/features/ai-intelligence/run-all.ts`
- `tests/features/acquisition/integration/run-all.ts`
- `tests/isolation/suite.ts`

### EXCLUDE
- None. (No runners were classified as strictly EXTERNAL or BROKEN unconditionally).
