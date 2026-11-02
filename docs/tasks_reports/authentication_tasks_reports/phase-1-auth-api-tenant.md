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

## Verification

- Automated tests are updated but must be executed by CI on this branch/PR; no local pnpm runner is available in this execution environment.
- Required CI checks: typecheck, lint, build, unit tests, UI tests, tenant-table/RLS verification, migration-chain check, and isolation suite.
- No live database was used. A successful CI run with its disposable PostgreSQL isolation service would be evidence for the tested migration/isolation cases, not evidence that a primary production database is connected.

## Acceptance criteria

- A request with only `x-user-id` and `x-tenant-id` cannot establish an authenticated identity.
- A valid server session determines both user and workspace, even when request headers contain forged values.
- Protected API routes listed above do not create tenant context from client-provided IDs or default/fallback identities.
- Public routes and the separate API-key middleware retain their prior contract.
- CI is green and the resulting branch diff contains only the authorized files.
