# Phase 1 — Authentication, API Identity, and Tenant Boundary

## Objective

Require a valid server-side session before protected dashboard/API handlers receive user and workspace identity. Client-supplied `x-user-id` and `x-tenant-id` values must not authenticate a request or select its tenant.

## Baseline

- Base branch: `main`
- Base commit: `1517034c5820fb2215567ad3dff2bf04da30c800`
- Work branch: `security/phase-1-auth-api-tenant`
- No database schema or migration changes are part of this phase.
- The application has no connected primary production database; verification must not rely on one.

## Findings addressed

1. `authorizeApiRequest()` accepted raw `x-user-id` and `x-tenant-id` values when no server session existed, then checked membership for those caller-asserted values. Membership lookup does not prove that the caller is that user.
2. A group of dashboard API handlers bypassed the central helper and read client-supplied identity headers directly, sometimes inventing static fallback user or tenant IDs.
3. Some authorization failures were translated into generic HTTP 500 responses instead of explicit 401/403 responses.

## Implemented changes

- `authorizeApiRequest()` now resolves the user and tenant only from `getSession()`; no session means `AuthorizationError(401)`. Request identity headers are ignored.
- Dashboard-related routes now use this resolver before processing tenant-scoped work:
  - `/api/v1/ai/chunk`
  - `/api/v1/ai/sentiment`
  - `/api/v1/analysis/competitive`
  - `/api/v1/analytics/llm`
  - `/api/v1/analytics/summary`
  - `/api/v1/audit/aeo-insight`
  - `/api/v1/audit/engine`
  - `/api/v1/audit/premium`
  - `/api/v1/content/studio`
  - `/api/v1/crawler/start`
  - `/api/v1/optimization/technical`
- `/api/v1/dashboard/summary` now translates authorization exceptions to their actual HTTP status. Its service continues to independently require a valid session.
- Existing session-protected paths (`/api/v1/crawl`, `/api/v1/knowledge-graph/query`) remain session-bound. `/api/v1/ingest/document` and `/api/v1/rag/query` inherit the hardened central helper.
- Public `/api/v1/audit/free` and `/api/v1/docs` are intentionally not changed; they do not establish tenant-scoped authenticated context.
- The standalone `withPublicApi` Bearer-key middleware remains separate. No API-key access was added implicitly to internal dashboard routes.
- Added regression coverage for rejecting header-only identity without a valid session, while preserving the existing session-overrides-forged-headers check. Updated Content Studio, crawler, and LLM Analytics route tests to use a server-authenticated test identity.
- Corrected API/security documentation to describe the actual session boundary and to distinguish simulated LLM analytics from direct provider execution.

## Explicit exclusions

- No production database connection, database mutation, migration, RLS policy, schema, or snapshot changes.
- No simulator/demo/live data behavior changes.
- No dashboard UI, route registry, billing, reports, or settings changes.
- No deployment or production secret changes.
- No automatic acceptance of Bearer API keys by internal dashboard routes.
- The locale-aware `ProtectedRoute` redirect to `/{locale}/login` was not changed in this API-focused patch; it remains an identified authentication UX follow-up because this phase did not perform the required four-state visual verification.
- `DashboardTopbar` still has a client-side workspace selector with hardcoded workspace options; the existing server-side workspace-switch action is not yet wired to that selector. This UI integration remains a separate workspace-phase task.
- This patch establishes authenticated session identity and tenant context; it does not claim a complete route-by-route RBAC/entitlement policy audit. Per-feature role/permission checks remain subject to the dedicated authorization review.
- The separate Bearer API-key middleware is retained but was not made universal across internal dashboard endpoints.

## Verification — 2026-11-02

Final verified code commit: `9521c30cbe4d9d0a223cab490de2f51d820e0cd3`.

GitHub Actions CI run `41422932746` (run #550) completed with **success**. The following passed:
- Dependency audit gate and audit-gate regression tests.
- Typecheck and lint (218 warnings, zero lint errors; within the repository gate).
- Unit tests and UI tests.
- Disposable-container tenant isolation suite.
- Tenant table schema alignment, RLS migration coverage, and Drizzle migration chain checks.
- Production build, generated documentation/reference matrix, and tracked generated-file no-drift check.
- All three Vercel preview status contexts and DeepSource Secrets check.

No primary production database was used or connected. The isolation suite used its disposable CI containers only. The successful DB-related CI checks verify the repository's test/migration contracts; they do not mean a production database is connected.

The final CI run is available at:
`https://github.com/DiabloNova/oxenn/actions/runs/41422932746`.

## Acceptance criteria

- A request with only `x-user-id` and `x-tenant-id` cannot establish an authenticated identity.
- A valid server session determines both user and workspace, even when request headers contain forged values.
- Protected API routes listed above do not create tenant context from client-provided IDs or default/fallback identities.
- Public routes and the separate API-key middleware retain their prior contract.
- CI is green and the resulting branch diff contains only the authorized files.
