# Oxenn MVP — Phase 1: Security and Tenant Isolation

**Status:** In progress — API identity audit and local verification passed; provider/DB/CI validation remains open
**Branch:** `mvp/phase-1-security-tenant-isolation`
**Base:** `mvp/phase-0-scope-baseline`
**Started:** 2026-11-04

## 1. Objective

Close the highest-priority security gaps found in the repository audit before the MVP user journeys are exposed beyond trusted development environments. Phase 1 prioritizes server-derived identity for API routes and safe outbound crawler networking.

This document records code changes and local verification on this branch. Passing local tests do not establish production security or prove effective RLS behavior in a live database.

## 2. Implemented on this branch

### 2.1 API identity is derived from the server session

`authorizeApiRequest` now accepts identity only from `getSession()`, which validates the HttpOnly session token against the database and requires active workspace membership. The `x-user-id` and `x-tenant-id` headers are no longer accepted as an authentication fallback.

All 16 tenant-scoped API endpoints were reviewed. Routes with user/workspace
context derive it from the validated server session; request correlation IDs
remain caller-supplied metadata only and are never used as identity.

The following additional endpoints were migrated from caller-controlled
identity headers/default IDs to authorizeApiRequest:

- src/app/api/v1/ai/chunk/route.ts
- src/app/api/v1/ai/sentiment/route.ts
- src/app/api/v1/analytics/summary/route.ts
- src/app/api/v1/audit/aeo-insight/route.ts
- src/app/api/v1/audit/engine/route.ts
- src/app/api/v1/audit/premium/route.ts
- src/app/api/v1/content/studio/route.ts

Previously protected endpoints were also checked: competitive analysis, LLM
analytics, crawler campaign start, technical optimization, crawl jobs,
dashboard summary, document ingestion, knowledge graph, and RAG. The shared
authorizationErrorResponse helper preserves 401/403 responses instead of
allowing authorization failures to surface as generic 500 responses.

All browser UI callers have had x-tenant-id and x-user-id removed. Same-origin
session cookies are the authentication mechanism.

Non-tenant / public endpoint classification:

- /api/v1/audit/free is intentionally public (free audit lead magnet) and does
  not create tenant context.
- /api/v1/docs is intentionally public but serves only documentation approved
  by isPublicDocumentation.
- /api/inngest delegates request handling to the Inngest serve adapter. The
  deployed signing-key configuration was not verified in this task.

Compatibility note: header-only developer integrations are intentionally
rejected. A future non-browser integration must use a separately designed,
cryptographically verified API credential, not caller-supplied user and tenant
IDs.

### 2.2 Outbound crawler requests are SSRF-restricted

New module: `src/services/crawler/safe-http-fetch.ts`.

The helper:

- Allows HTTP/HTTPS only; rejects embedded credentials, reserved hostnames, non-public literal IPs, and non-standard ports.
- Resolves DNS and rejects the hostname if any returned A/AAAA address is non-public.
- Connects to the selected resolved IP directly, preserving the original Host header and TLS server name, to reduce DNS-rebinding exposure.
- Revalidates every redirect target and rejects redirect loops. Free workspaces are limited to 5 redirects; paid workspaces have no redirect-hop count cap.
- Both tiers retain a hard 60-second redirect-chain budget, and redirect response bodies are closed without being downloaded. The legacy fetcher uses 10-second DNS/request deadlines and a 2 MiB body cap; Acquisition uses a 10-second DNS deadline, policy-bounded connect/request deadlines (10/30 seconds by default), and a 5 MiB default response cap (25 MiB hard policy ceiling).
- The effective plan is resolved from the tenant subscription on the server. A client-supplied policy cannot raise the free-tier limit or remove the paid-tier time/resource budgets.
- IPv6 validation permits the specifically globally reachable special-purpose allocations while retaining blocks for reserved, transition, documentation, and non-global ranges.
- Uses GET only and does not forward caller cookies or authorization headers.

The crawler consumers now use this helper instead of native `fetch`:

- `src/services/crawler/link-discovery.ts`
- `src/services/crawler/web-crawler.ts`

### 2.3 Negative-path tests added and updated

- tests/unit/services/auth/authorize-api-request.test.ts: rejects spoofed
  identity headers without a server session and verifies that returned
  identity comes from the validated session.
- tests/unit/api/v1/tenant-auth-boundaries.test.ts: rejects forged tenant/user
  headers across 15 tenant-scoped API handlers and verifies 401/403 mapping.
- tests/unit/api/v1/crawl.test.ts: verifies forged identity headers cannot
  submit a crawl without a real session.
- tests/unit/api/v1/content/studio.test.ts: verifies the tenant/user passed
  into tenant context are session-derived even when forged headers are sent.
- tests/unit/services/crawler/safe-http-fetch.test.ts: covers public/reserved
  IPv4 and IPv6, unsafe URL forms, mixed DNS answers, private redirects,
  redirect loops, free/paid hop policy, response-size limits, and DNS/request
  timeouts.
- tests/unit/features/acquisition/fetcher.test.ts: covers per-hop SSRF checks,
  redirect loops, free/paid hop policy, streamed and declared response-size
  limits, and DNS/request timeout behavior.

Legacy direct-route feature harnesses for competitive analysis, technical
optimization, premium audit, and content studio now test rejection of spoofed
identity headers rather than assuming those headers authenticate the caller.

## 3. Remaining Phase 1 work

- [ ] Run the complete GitHub Actions workflow and record its result before
  marking Phase 1 complete.
- [x] Add integration/negative-path coverage for redirect-to-private-IP,
  redirect loops, response-size limits, and request/DNS timeouts in both
  crawler HTTP fetch paths.
- [ ] Review service-to-service authentication requirements and implement a
  dedicated signed API credential flow if required; do not restore
  header-based identity fallback.
- [ ] Validate behavior against an isolated PostgreSQL test environment and
  verify effective RLS behavior.
- [ ] Complete authorization/role review and deployed end-to-end testing.

## 4. Verification boundaries

Not verified by this branch operation:

- Production or staging database connectivity, migration state, grants, and
  effective RLS behavior.
- Live DNS, outbound network, or external provider behavior from the deployed
  runtime.
- Inngest signing-key configuration in deployed environments.
- GitHub Actions status for these commits.
- End-to-end security behavior in a deployed environment.

No database migration, production database query, secret change, production
operation, or deployment was performed for this phase.

## 5. Local verification — 2026-11-04

The branch was cloned into an isolated, disposable Sprite environment. Dependencies were installed with the repository-pinned pnpm version (10.30.3) using the frozen lockfile. No production credentials or database connection were configured.

| Check | Result |
|---|---|
| TypeScript `tsc --noEmit` | PASS |
| Focused security boundary tests | PASS — 28 tests across 4 files |
| Full unit suite (`vitest run --project unit`) | PASS — 54 files passed, 292 tests passed, 1 file skipped, 1 todo |
| Full repository ESLint (`--max-warnings=218`) | PASS — 0 errors, 215 warnings |
| Focused ESLint on changed runtime/test files | PASS — 0 errors, 2 existing warnings |

The initial full unit run exposed tests that relied on caller-supplied identity headers. Those tests were updated to mock the server-side authorization helper; the crawler test verifies session-derived identity reaches the orchestrator. The expanded API boundary suite now covers 15 protected handlers, and the complete unit suite passed.

Full repository ESLint passed with 215 warnings (the workflow limit is 218), with zero lint errors.

### Remaining verification

- [ ] Run the complete GitHub Actions workflow on this branch; no workflow run
  is claimed here.
- [x] Add redirect/timeout/response-size integration tests for both safe fetchers.
- [ ] Complete service-to-service credential design if integrations require
  non-cookie authentication.
- [ ] Validate behavior against a real isolated PostgreSQL test environment
  and verify effective RLS behavior; no live database was accessed during
  this run.
