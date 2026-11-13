# Oxenn MVP — Phase 1: Security and Tenant Isolation

**Status:** In progress — API identity audit and local verification passed; provider/DB/CI validation remains open
**Branch:** `mvp/phase-1-security-tenant-isolation`
**Base:** `mvp/phase-0-scope-baseline`
**Started:** 2026-11-04

## 1. Objective

Close the highest-priority security gaps found in the repository audit before the MVP user journeys are exposed beyond trusted development environments. Phase 1 prioritizes server-derived identity for API routes and safe outbound crawler networking.

This document records code changes and verification boundaries for this branch. Passing tests do not establish production security or prove effective RLS behavior in a live database.

## 1.1 Scope decision

The Phase 1 scope is a security prerequisite for the two MVP journeys defined
in Phase 0: Technical SEO Audit and AI Visibility Audit. It does not expand the
MVP to make every dashboard tool production-ready. The work in this PR is
limited to server-derived tenant identity, SSRF-safe outbound fetching,
subscription authorization for premium audit work, executable regression
coverage, and accurate release documentation.

## 1.2 Historical Phase 1 repository baseline — 2026-11-04

The 70-table / 51-policy-bearing-table figures below were the repository
inventory recorded for this Phase 1 workstream on 2026-11-04. They are retained
as a dated historical baseline, not as the current repository inventory or a
claim about deployed database state. Subsequent DB-001 remediation and the
DOC-001 ownership-governance work changed the repository contract. For the
current per-table inventory, use the generated [Database Reference Matrix](../database/reference-matrix.md);
for ownership and verification semantics, use the [Canonical Data Contract](../database/canonical-data-contract.md).

At the time this Phase 1 baseline was written, the canonical Drizzle schema
was recorded as containing 70 tables and its reconciled tenant RLS subset as
containing 51 policy-bearing tables. Those numbers are historical evidence
only and must not be reused as current counts. They never proved any
particular database's deployed migration state.

The current workflow's relevant checks are typecheck, lint, build, unit/UI
tests, schema alignment, RLS migration coverage, migration-chain validation,
generated-file drift verification, and the PostgreSQL isolation suite. CI
results are revision-specific; the latest PR head must be checked before
claiming current verification.

## 1.3 Conflicts and their disposition

- Earlier route classification described competitive analysis, LLM analytics,
  crawler start, and technical optimization as already protected. That was
  inaccurate: their baseline handlers trusted fallback or caller-provided
  identity. They are now listed as routes migrated by Phase 1.
- Three standalone feature scripts were outside the configured Vitest
  discovery roots. They are now represented by unit-project suites that keep
  the functional success/scoring/validation assertions and test the session
  boundary.
- Premium audit previously required authentication but did not enforce a
  server-side plan entitlement. It now checks the explicit
  canRunPremiumAudit entitlement before provider work; Free is denied and paid
  plans are allowed.
- The crawler's paid redirect policy is finite (10 redirects), not unlimited.
  The safe transport rejects response encodings other than identity because it
  does not decompress compressed bodies within the byte limit.

## 1.4 Operational unknowns

The PR and CI cannot prove deployed PostgreSQL connectivity, production RLS
behavior, live Firecrawl reachability/credentials, DNS behavior from the
deployed runtime, production subscription records, or deployed session-cookie
configuration. Those require separately authorized staging/production
verification and must remain NOT VERIFIED until observed directly.

## 1.5 Phase 0 exit criteria and release gate

Phase 0 is recorded as In Progress in MVP_PHASE_0_SCOPE_BASELINE.md. Phase 1
implementation does not retroactively mark Phase 0 complete. Repository scope,
schema/migration inventory, and CI checks are documented; production
connectivity, deployed provider behavior, and production RLS remain unknown.
The Phase 0 exit review therefore remains incomplete for release purposes.

**Public beta remains BLOCKED** until all of the following are verified on the
candidate release revision:

1. Unit and UI regression suites pass, including authentication, route
   validation, DNS/redirect, timeout, response-size, and content-encoding
   negative paths.
2. The PostgreSQL isolation suite passes, and an authorized isolated
   environment verifies effective RLS and migration state.
3. Staging verifies session creation/revocation, entitlement decisions,
   provider credentials, and safe outbound behavior from the deployed runtime.
4. Remaining security review threads are either fixed and verified or have a
   documented, accepted reason for being out of scope.
5. The release owner explicitly reviews and accepts the Phase 0/Phase 1 gate.

No statement in this document is an assertion that public beta is approved.

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

The following endpoints were also migrated during this phase from caller-
supplied identity headers or fallback identifiers to the server-session
authorization helper; they were not previously protected by the current
baseline implementation:

- competitive analysis
- LLM analytics
- crawler campaign start
- technical optimization

Other already session-protected endpoints were also rechecked: crawl jobs,
dashboard summary, document ingestion, knowledge graph, and RAG. The shared
authorizationErrorResponse helper preserves 401/403 responses instead of
allowing authorization failures to surface as generic 500 responses.

All browser UI callers have had x-tenant-id and x-user-id removed. Same-origin
session cookies are the authentication mechanism.

Non-tenant / public endpoint classification:

- /api/v1/audit/free requires a validated server session and is not public.
  It uses the narrow `sys-free-audit` system database purpose for counters and
  audit metadata; it does not create tenant-scoped request context. It meters
  3 attempts per user per UTC month, 10 per trusted Vercel ingress IP per UTC
  hour, and 500 globally per UTC day. User, IP, and idempotency bucket keys are
  SHA-256 hashes. The bounded internal HTTP crawl is limited to one page, 1 MiB
  response/total bytes, 20 seconds, and three redirects, and enforces robots
  policy plus the shared SSRF protections. A scheduled job deletes expired
  `free-audit-*` rate-limit rows.
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
- Revalidates every redirect target and rejects redirect loops. Free workspaces are limited to 5 redirects; paid workspaces are limited to 10 redirects per request.
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
  redirect loops, free/paid hop policy, response-size limits, DNS/request
  timeouts, TLS SNI/IP pinning, and rejection of unsupported content encodings.
- tests/unit/services/auth/session.test.ts: verifies absent sessions remain
  unauthenticated while database/system-context failures propagate as server
  failures.
- tests/unit/api/v1/session-derived-identity.test.ts and
  tenant-auth-boundaries.test.ts: exercise the real session authorization path
  and verify forged tenant/user headers cannot override Session identity.
- tests/unit/api/v1/audit/premium-audit.test.ts,
  tests/unit/api/v1/analysis/competitive.test.ts, and
  tests/unit/api/v1/optimization/technical.test.ts: restore the feature
  functional contracts in the discovered Vitest unit project.
- tests/unit/features/acquisition/fetcher.test.ts: covers per-hop SSRF checks,
  redirect loops, free/paid hop policy, streamed and declared response-size
  limits, and DNS/request timeout behavior.

The former standalone feature scripts for premium audit, competitive
analysis, and technical optimization were moved into the Vitest unit project.
Their authenticated functional scenarios are retained, while authentication
boundary cases use the real server-session authorization path. The offline
crawler harness injects a fixture implementing the same safe-fetch response
contract; it no longer relies on global fetch interception.

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

The verification table below records an earlier isolated pre-review run
using the repository-pinned pnpm version (10.30.3) and frozen lockfile. It is
historical evidence for that earlier revision only; the current PR head must
pass its own CI checks before this phase can be marked verified. No production
credentials or database connection were configured for that historical run.

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
