# Oxenn MVP — Phase 1: Security and Tenant Isolation

**Status:** In progress  
**Branch:** `mvp/phase-1-security-tenant-isolation`  
**Base:** `mvp/phase-0-scope-baseline`  
**Started:** 2026-11-04

## 1. Objective

Close the highest-priority security gaps found in the repository audit before the MVP user journeys are exposed beyond trusted development environments. Phase 1 prioritizes server-derived identity for API routes and safe outbound crawler networking.

This document records code changes on this branch. It does not claim that tests have passed, that production is secure, or that a live database was inspected.

## 2. Implemented on this branch

### 2.1 API identity is derived from the server session

`authorizeApiRequest` now accepts identity only from `getSession()`, which validates the HttpOnly session token against the database and requires active workspace membership. The `x-user-id` and `x-tenant-id` headers are no longer accepted as an authentication fallback.

The following API routes now use that helper and return 401/403 for authorization failures:

- `src/app/api/v1/crawler/start/route.ts`
- `src/app/api/v1/analysis/competitive/route.ts`
- `src/app/api/v1/analytics/llm/route.ts`
- `src/app/api/v1/optimization/technical/route.ts`

Request correlation IDs may still be supplied by the caller; they are not used to establish identity.

**Compatibility note:** header-only developer integrations are intentionally rejected. A future non-browser integration must use a separately designed, cryptographically verified API credential, not caller-supplied user and tenant IDs.

### 2.2 Outbound crawler requests are SSRF-restricted

New module: `src/services/crawler/safe-http-fetch.ts`.

The helper:

- Allows HTTP/HTTPS only; rejects embedded credentials, reserved hostnames, non-public literal IPs, and non-standard ports.
- Resolves DNS and rejects the hostname if any returned A/AAAA address is non-public.
- Connects to the selected resolved IP directly, preserving the original Host header and TLS server name, to reduce DNS-rebinding exposure.
- Revalidates every redirect target and rejects redirect loops; maximum 5 redirects.
- Applies a 10-second per-request timeout and a 2 MiB response-body limit.
- Uses GET only and does not forward caller cookies or authorization headers.

The crawler consumers now use this helper instead of native `fetch`:

- `src/services/crawler/link-discovery.ts`
- `src/services/crawler/web-crawler.ts`

### 2.3 Negative-path tests added

- `tests/unit/services/auth/authorize-api-request.test.ts`: rejects spoofed identity headers without a server session and verifies that the returned identity comes from the validated session.
- `tests/unit/services/crawler/safe-http-fetch.test.ts`: covers private/reserved IPv4 and IPv6, unsafe URL forms, and mixed public/private DNS answers.

These tests are **added but not yet executed** in a local checkout or CI run.

## 3. Remaining Phase 1 work

- [ ] Run TypeScript, lint, and the focused unit tests on this branch; resolve any failures.
- [ ] Run the complete required CI workflow and record the run URL/result before marking this phase complete.
- [ ] Inventory every API route for caller-controlled tenant/user headers and confirm that all tenant-sensitive routes use a trusted server identity or an explicit API-credential verifier.
- [ ] Add integration/negative-path coverage for redirect-to-private-IP, redirect loops, response size limits, and request timeouts.
- [ ] Review service-to-service authentication requirements and implement a dedicated API-key/bearer credential flow if required; do not restore header-based identity fallback.
- [ ] Reassess authorization and crawler behavior after the tests, including role permissions and tenant isolation at the database boundary.

## 4. Verification boundaries

Not verified by this branch operation:

- Production or staging database connectivity, migration state, grants, and effective RLS behavior.
- Live DNS, outbound network, or external provider behavior from the deployed runtime.
- CI status for these commits.
- Complete API route inventory beyond the explicitly listed routes.
- End-to-end security behavior in a deployed environment.

No database migration, database query, secret change, production operation, or deployment was performed for this phase.
