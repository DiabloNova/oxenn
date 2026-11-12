# Historical Security and Tenant Isolation Remediation Record

**Record date:** 2026-11-04; preserved and reclassified on 2026-11-12  
**Status:** Historical implementation/verification record; not a current MVP phase, release decision, or proof of current runtime behavior.  
**Original workstream:** `mvp/phase-1-security-tenant-isolation`, based on the former `mvp/phase-0-scope-baseline` workstream.

> This record preserves the technical scope, changes, tests, and verification limitations reported for the historical security-remediation workstream. Its references to the former two-journey MVP and its release gate are historical only. The current product scope is defined by [OXENN MVP Product Specification](../../product/OXENN_MVP_PRODUCT_SPECIFICATION.md), and the current code-level mapping is in [MVP Engineering Baseline](../MVP_ENGINEERING_BASELINE.md).

## 1. Objective

Close the highest-priority security gaps found in the repository audit before the MVP user journeys are exposed beyond trusted development environments. Phase 1 prioritizes server-derived identity for API routes and safe outbound crawler networking.

This document records code changes and verification boundaries for this branch. Passing tests do not establish production security or prove effective RLS behavior in a live database.

## 1.1 Historical scope context

This workstream was originally organized as a security prerequisite for the former two-journey engineering MVP (Technical SEO Audit and AI Visibility Audit). That scope is no longer the current product MVP definition. The security work described here remains relevant as historical implementation evidence, but it must not be used to limit the current product MVP to those two journeys.

The historical work focused on server-derived tenant identity, SSRF-safe outbound fetching, subscription authorization for premium audit work, executable regression coverage, and release documentation. Current security requirements are maintained in [Security Model](../../security/SECURITY_MODEL.md).

## 1.2 Historical Phase 1 repository baseline — 2026-11-04

The 70-table / 51-policy-bearing-table figures below were the repository inventory recorded for this Phase 1 workstream on 2026-11-04. They are retained as a dated historical baseline, not as the current repository inventory or a claim about deployed database state. Subsequent DB-001 remediation and the DOC-001 ownership-governance work changed the repository contract. For the current per-table inventory, use the generated [Database Reference Matrix](../../database/reference-matrix.md); for ownership and verification semantics, use the [Canonical Data Contract](../../database/canonical-data-contract.md).

At the time this Phase 1 baseline was written, the canonical Drizzle schema was recorded as containing 70 tables and its reconciled tenant RLS subset as containing 51 policy-bearing tables. Those numbers are historical evidence only and must not be reused as current counts. They never proved any particular database's deployed migration state.

The current workflow's relevant checks are typecheck, lint, build, unit/UI tests, schema alignment, RLS migration coverage, migration-chain validation, generated-file drift verification, and the PostgreSQL isolation suite. CI results are revision-specific; the latest PR head must be checked before claiming current verification.

## 1.3 Conflicts and their disposition

- Earlier route classification described competitive analysis, LLM analytics, crawler start, and technical optimization as already protected. That was inaccurate: their baseline handlers trusted fallback or caller-provided identity. They were migrated during the historical Phase 1 workstream.
- Three standalone feature scripts were outside the configured Vitest discovery roots. They were represented by unit-project suites that retained functional success/scoring/validation assertions and tested the session boundary.
- Premium audit previously required authentication but did not enforce a server-side plan entitlement. The historical implementation added an explicit `canRunPremiumAudit` entitlement check before provider work; Free was denied and paid plans were allowed.
- The crawler's paid redirect policy is finite (10 redirects), not unlimited. The safe transport rejects response encodings other than identity because it does not decompress compressed bodies within the byte limit.

## 1.4 Operational unknowns

The PR and CI cannot prove deployed PostgreSQL connectivity, production RLS behavior, live Firecrawl reachability/credentials, DNS behavior from the deployed runtime, production subscription records, or deployed session-cookie configuration. Those require separately authorized staging/production verification and must remain NOT VERIFIED until observed directly.

## 1.5 Historical release-gate context and current interpretation

The original Phase 0/Phase 1 gate was tied to the previous engineering MVP and is retained here only to explain the historical workstream. It is not the current OXENN MVP release gate. The new product MVP's engineering acceptance and release gates are defined in [MVP Engineering Baseline](../MVP_ENGINEERING_BASELINE.md).

The historical verification work did not establish production/staging database connectivity, effective deployed RLS, live provider credentials/reachability, or end-to-end behavior in a deployed environment. Those limitations remain meaningful whenever the relevant environment is evaluated today; they must be reverified against the actual current revision and environment. This historical record does not certify that any current beta or release is approved.

## 2. Work recorded as implemented on the historical branch

### 2.1 API identity was derived from the server session

`authorizeApiRequest` was changed to accept identity only from `getSession()`, which validated the HttpOnly session token against the database and required active workspace membership. The `x-user-id` and `x-tenant-id` headers were no longer accepted as an authentication fallback.

All 16 tenant-scoped API endpoints were reviewed. Routes with user/workspace context derived it from the validated server session; request correlation IDs remained caller-supplied metadata only and were not used as identity.

The following additional endpoints were migrated from caller-controlled identity headers/default IDs to authorizeApiRequest:

- src/app/api/v1/ai/chunk/route.ts
- src/app/api/v1/ai/sentiment/route.ts
- src/app/api/v1/analytics/summary/route.ts
- src/app/api/v1/audit/aeo-insight/route.ts
- src/app/api/v1/audit/engine/route.ts
- src/app/api/v1/audit/premium/route.ts
- src/app/api/v1/content/studio/route.ts

The following endpoints were also migrated during that phase from caller-supplied identity headers or fallback identifiers to the server-session authorization helper; they were not previously protected by the current baseline implementation:

- competitive analysis
- LLM analytics
- crawler campaign start
- technical optimization

Other already session-protected endpoints were also rechecked: crawl jobs, dashboard summary, document ingestion, knowledge graph, and RAG. The shared authorizationErrorResponse helper preserved 401/403 responses instead of allowing authorization failures to surface as generic 500 responses.

All browser UI callers had x-tenant-id and x-user-id removed. Same-origin session cookies were the authentication mechanism.

### 2.2 Historical non-tenant endpoint classification

- The original classification treated `/api/v1/audit/free` as public. That historical classification is superseded by the owner-approved rule in `KNOW-64`: every service, including free services, requires registration and a server-authenticated session. The current route-level enforcement gap is documented in [Security Model](../../security/SECURITY_MODEL.md); this historical record does not claim that the route has been secured.
- `/api/v1/docs` was classified as public but served only documentation approved by `isPublicDocumentation`.
- `/api/inngest` delegated request handling to the Inngest serve adapter. The deployed signing-key configuration was not verified in that task.

Compatibility note: header-only developer integrations were intentionally rejected. A future non-browser integration must use a separately designed, cryptographically verified API credential, not caller-supplied user and tenant IDs.

### 2.3 Outbound crawler requests were SSRF-restricted

New module: `src/services/crawler/safe-http-fetch.ts`.

The helper:

- Allowed HTTP/HTTPS only; rejected embedded credentials, reserved hostnames, non-public literal IPs, and non-standard ports.
- Resolved DNS and rejected the hostname if any returned A/AAAA address was non-public.
- Connected to the selected resolved IP directly, preserving the original Host header and TLS server name, to reduce DNS-rebinding exposure.
- Revalidated every redirect target and rejected redirect loops. Free workspaces were limited to 5 redirects; paid workspaces were limited to 10 redirects per request.
- Both tiers retained a hard 60-second redirect-chain budget, and redirect response bodies were closed without being downloaded. The legacy fetcher used 10-second DNS/request deadlines and a 2 MiB body cap; Acquisition used a 10-second DNS deadline, policy-bounded connect/request deadlines (10/30 seconds by default), and a 5 MiB default response cap (25 MiB hard policy ceiling).
- Resolved the effective plan from the tenant subscription on the server. A client-supplied policy could not raise the free-tier limit or remove the paid-tier time/resource budgets.
- Allowed specifically globally reachable IPv6 special-purpose allocations while retaining blocks for reserved, transition, documentation, and non-global ranges.
- Used GET only and did not forward caller cookies or authorization headers.

The crawler consumers were migrated to use this helper instead of native `fetch`:

- `src/services/crawler/link-discovery.ts`
- `src/services/crawler/web-crawler.ts`

### 2.4 Negative-path tests recorded

- tests/unit/services/auth/authorize-api-request.test.ts: rejected spoofed identity headers without a server session and verified that returned identity came from the validated session.
- tests/unit/api/v1/tenant-auth-boundaries.test.ts: rejected forged tenant/user headers across 15 tenant-scoped API handlers and verified 401/403 mapping.
- tests/unit/api/v1/crawl.test.ts: verified forged identity headers could not submit a crawl without a real session.
- tests/unit/api/v1/content/studio.test.ts: verified the tenant/user passed into tenant context were session-derived even when forged headers were sent.
- tests/unit/services/crawler/safe-http-fetch.test.ts: covered public/reserved IPv4 and IPv6, unsafe URL forms, mixed DNS answers, private redirects, redirect loops, free/paid hop policy, response-size limits, DNS/request timeouts, TLS SNI/IP pinning, and rejection of unsupported content encodings.
- tests/unit/services/auth/session.test.ts: verified absent sessions remained unauthenticated while database/system-context failures propagated as server failures.
- tests/unit/api/v1/session-derived-identity.test.ts and tenant-auth-boundaries.test.ts: exercised the real session authorization path and verified forged tenant/user headers could not override session identity.
- tests/unit/api/v1/audit/premium-audit.test.ts, tests/unit/api/v1/analysis/competitive.test.ts, and tests/unit/api/v1/optimization/technical.test.ts: restored the feature functional contracts in the discovered Vitest unit project.
- tests/unit/features/acquisition/fetcher.test.ts: covered per-hop SSRF checks, redirect loops, free/paid hop policy, streamed and declared response-size limits, and DNS/request timeout behavior.

The former standalone feature scripts for premium audit, competitive analysis, and technical optimization were moved into the Vitest unit project. Their authenticated functional scenarios were retained, while authentication boundary cases used the real server-session authorization path. The offline crawler harness injected a fixture implementing the same safe-fetch response contract; it no longer relied on global fetch interception.

## 3. Remaining work recorded for the historical Phase 1 snapshot

- [ ] Run the complete GitHub Actions workflow and record its result before treating that historical workstream as complete.
- [x] Add integration/negative-path coverage for redirect-to-private-IP, redirect loops, response-size limits, and request/DNS timeouts in both crawler HTTP fetch paths.
- [ ] Review service-to-service authentication requirements and implement a dedicated signed API credential flow if required; do not restore header-based identity fallback.
- [ ] Validate behavior against an isolated PostgreSQL test environment and verify effective RLS behavior.
- [ ] Complete authorization/role review and deployed end-to-end testing.

## 4. Verification boundaries

Not verified by this historical branch operation:

- Production or staging database connectivity, migration state, grants, and effective RLS behavior.
- Live DNS, outbound network, or external provider behavior from the deployed runtime.
- Inngest signing-key configuration in deployed environments.
- GitHub Actions status for those historical commits.
- End-to-end security behavior in a deployed environment.

No database migration, production database query, secret change, production operation, or deployment was performed for this historical phase.

## 5. Local verification — 2026-11-04

The verification table below records an earlier isolated pre-review run using the repository-pinned pnpm version (10.30.3) and frozen lockfile. It is historical evidence for that earlier revision only; the current PR head must pass its own CI checks before the work can be marked verified. No production credentials or database connection were configured for that historical run.

| Check | Result |
|---|---|
| TypeScript `tsc --noEmit` | PASS |
| Focused security boundary tests | PASS — 28 tests across 4 files |
| Full unit suite (`vitest run --project unit`) | PASS — 54 files passed, 292 tests passed, 1 file skipped, 1 todo |
| Full repository ESLint (`--max-warnings=218`) | PASS — 0 errors, 215 warnings |
| Focused ESLint on changed runtime/test files | PASS — 0 errors, 2 existing warnings |

The initial full unit run exposed tests that relied on caller-supplied identity headers. Those tests were updated to mock the server-side authorization helper; the crawler test verified session-derived identity reached the orchestrator. The expanded API boundary suite covered 15 protected handlers, and the complete unit suite passed.

Full repository ESLint passed with 215 warnings (the workflow limit was 218), with zero lint errors.

### Remaining verification at that historical point

- [ ] Run the complete GitHub Actions workflow on that branch; no workflow run was claimed there.
- [x] Add redirect/timeout/response-size integration tests for both safe fetchers.
- [ ] Complete service-to-service credential design if integrations require non-cookie authentication.
- [ ] Validate behavior against a real isolated PostgreSQL test environment and verify effective RLS behavior; no live database was accessed during that run.
