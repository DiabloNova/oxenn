# Privacy-safe database query telemetry

Oxenn's PostgreSQL client can emit structured query and pool-acquisition telemetry without logging SQL text, bind parameters, connection strings, tenant IDs, or error messages. Telemetry is disabled by default.

## Enablement

Set `DATABASE_QUERY_TELEMETRY_ENABLED=true` only in an environment whose log retention and access controls have been reviewed. The `.env.example` default is `false`. Disabling the flag stops telemetry emission while leaving query execution and error propagation unchanged.

## Events

`oxenn.database.query` contains:

- `poolName`: `workspace` or `authenticator`
- `queryFingerprint`: the first 16 hexadecimal characters of a SHA-256 hash over normalized SQL structure
- `durationMs`: elapsed query execution time in milliseconds
- `rowCount`: returned row count, or `null` on failure
- `outcome`: `success` or `error`
- `traceId`: validated request ID when one exists
- `errorCode`: safe PostgreSQL error code only, when available

`oxenn.database.pool.acquire` contains pool name, acquisition wait time, `totalCount`, `idleCount`, `waitingCount`, `outcome` (`success` or `error`), an optional safe PostgreSQL error code, and request ID when available. Failed acquisition attempts are recorded too, so connection timeouts remain visible without exposing error messages. Pool wait is reported separately for explicit client leases (`connectClient` and `connectSystemClient`). The direct `Pool.query` path retains node-postgres semantics, so its reported duration includes any internal acquisition wait as well as query execution; it does not fabricate a separate wait measurement.

## Privacy properties

- Raw SQL and parameter arrays are never emitted.
- SQL string/numeric/boolean literals and dollar-quoted strings are tokenized alongside line and nested block comments before fingerprinting; operator and punctuation spacing is canonicalized while quoted-identifier case is preserved. Only the hash is logged.
- Error messages and stack traces are not copied into telemetry; only a validated short PostgreSQL code may be included.
- Connection strings, credentials and tenant identifiers are not part of either event schema.
- The direct `Pool.query` path and both leased-client wrappers are observed exactly once; the existing tenant-context checks, result values, thrown errors and client-release behavior are preserved.

The fingerprint is an operational grouping key, not a reversible query archive. Do not add raw query text, parameter values, tenant IDs or arbitrary request metadata to these events.
