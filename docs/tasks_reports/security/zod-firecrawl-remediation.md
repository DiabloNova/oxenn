# Firecrawl and Zod dependency remediation

**Status:** Original dependency remediation CI passed; Cubic follow-up fixes are committed and require final CI validation before merge.  
**Date:** 2026-10-25  
**Branch:** fix/firecrawl-zod-remediation

## Invariant

Every installed Zod runtime version in the resolved dependency graph must be outside the affected range of GHSA-mrhx-c7xc-m3w5, and Firecrawl crawl behavior must remain compatible. The dependency audit gate must remain unchanged and blocking.

## Findings

- The root application used Zod 4.4.3.
- The resolved Firecrawl SDK version, 4.35.0, independently brought in Zod 3.25.76 and zod-to-json-schema 3.25.2.
- A root-level Zod upgrade alone could not remove that second runtime copy.
- Upstream Firecrawl has Zod v4 schema-conversion support. The current Oxenn integration uses the SDK's crawl API; the dependency was not replaced or its public usage changed.
- The official advisory marks versions below 4.6.6 as affected and 4.6.6 as the patched version: https://github.com/advisories/GHSA-mrhx-c7xc-m3w5.

## Implementation

- Raised the root Zod dependency to ^4.6.7.
- Added narrowly scoped pnpm overrides for the Zod dependencies requested by both @mendable/firecrawl-js and its firecrawl@4.30.1 dependency, pinned to 4.6.7.
- Updated the lockfile dependency snapshots so Firecrawl and zod-to-json-schema resolve against Zod 4.6.7; removed the installed Zod 3.25.76 package resolution and snapshot.
- Kept the Firecrawl SDK version and application provider contract unchanged.
- Bounded externally supplied arrays and member strings in the LLM analytics, content studio, crawl policy, legacy crawler, and prompt-intelligence validation schemas. This activates Zod's early size rejection at these boundaries instead of relying on the dependency patch alone.
- Added a regression test proving an oversized invalid query array is rejected with HTTP 400 before model work.
- Follow-up PR #99 remediation: centralized bounded Prompt Intelligence variable-value validation (maximum 20 keys, 80 characters per key, 2,000 characters per value), reused it in both execute/compare actions, and added a service-level guard against bypassing the action boundary. Unknown variable names are rejected before brand lookup or execution persistence.
- Added Vitest unit coverage for Prompt Intelligence create/update/execute/compare limits and for the Content Studio, Crawl API policy, and legacy Crawler Start caps. Route tests assert HTTP 400 and no downstream provider/orchestrator invocation.
- Follow-up Cubic remediation centralizes prompt-variable definition bounds in `promptVariableDefinitionSchema` and `promptVariableDefinitionsSchema`, reused by create and update actions. Shared constants now govern both definition and execution-value contracts.
- Added exact-at-limit acceptance tests for Prompt Intelligence definitions, Content Studio fields, Crawl API policy arrays/member lengths, and legacy Crawler Start URL/count limits. The Content Studio boundary test uses a valid URL, non-placeholder Firecrawl key, and tenant-context callback so it can reach the provider if validation is bypassed.
- Added service-level and action-path model-comparison tests for undeclared variables, ensuring the service guard rejects before brand lookup or execution persistence and the action surfaces the error. Invalid action payloads are also verified to fail before authentication work.
- Replaced reference-matrix consumer discovery based on grep-by-name with TypeScript AST analysis of imported Drizzle table bindings, relational `db.query.<table>` calls, and SQL table clauses passed to query/execute methods. SQL held in local variables is resolved within its lexical scope; payload property names, comments, and string literals alone are not consumers.
- Removed false consumers from the generated matrix for request-validation tests that only use request/property names. Matrix summary from the generator's CI diff: 70 tables, 59 wired and 11 legacy candidates.
- No database schema or migration, dependency, audit-gate, allowlist, or PR #96 changes were made.

## Verification

- Static lockfile consistency checks performed in this session: the old Zod 3.25.76 package resolution, package snapshot, and Firecrawl dependency references are absent; the new Zod integrity matches the published 4.6.7 artifact.
- The dependency-only CI revision passed frozen installation, dependency audit, audit-gate regression tests, typecheck, lint, migration checks, build, unit tests, UI tests, isolation suite, build reference matrix, and generated-file drift checks.
- A clean remote checkout was created at the exact PR head. `corepack pnpm install --frozen-lockfile` was attempted, but dependency installation did not complete within the remote execution window because npm registry downloads were extremely slow; the focused test commands therefore have not run yet.
- GitHub Actions on follow-up commit `5ad1fb590104e1c78ac6ab98c1f063ace185261a` passed **Unit Tests**, **Build and Test** (including typecheck, lint, build, and generated-file drift verification), and **Isolation Suite**.
- Cubic's new review run was still queued at the time of this report update. Hyrax Review was skipped because its connected workspace had exhausted included credits; GitHub marked that check as non-blocking.
- Focused tests on the follow-up revision were not run in this session: the fresh remote sandbox stalled during frozen dependency installation. CI on the latest follow-up commit must verify the updated tests, typecheck, lint, build, reference-matrix regeneration, and generated-file drift checks before merge; earlier successful CI does not cover these follow-up edits.

## Remaining risks and acceptance criteria

- The lockfile was updated from the existing lock graph rather than regenerated by a local pnpm command. CI must verify that pnpm 10.30.3 accepts the lockfile as frozen and that the nested override resolves as intended.
- The scoped override is safe to keep only while Firecrawl's Zod v4 compatibility and schema-conversion tests remain valid. CI and review must confirm that compatibility.
- Do not merge this branch or PR #96 until the security gate and required checks are green.
