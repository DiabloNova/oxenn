# Firecrawl and Zod dependency remediation

**Status:** Original dependency remediation CI passed; follow-up Cubic fixes are committed and require CI validation before merge.
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
- Added a direct service-level model-comparison test ensuring undeclared variables are rejected before brand lookup or execution persistence. Action validation tests also assert invalid input is rejected before authentication work.
- Replaced the reference-matrix grep heuristic with a TypeScript AST detector for imported Drizzle table bindings, relational `db.query.<table>` access, and SQL table clauses passed to query/execute methods. It ignores payload properties, ordinary prose, comments, and SQL literals; regenerated the matrix and docs index from the detector output (70 tables: 59 wired, 11 legacy candidates).
- No database schema or migration, audit-gate, allowlist, or PR #96 changes were made. The Zod upgrade and Firecrawl-related overrides are intentional dependency changes in this remediation, as described above.

## Verification

- Static lockfile consistency checks performed in this session: the old Zod 3.25.76 package resolution, package snapshot, and Firecrawl dependency references are absent; the new Zod integrity matches the published 4.6.7 artifact.
- The dependency-only CI revision passed frozen installation, dependency audit, audit-gate regression tests, typecheck, lint, migration checks, build, unit tests, UI tests, isolation suite, build reference matrix, and generated-file drift checks.
- The remote checkout could not complete a full frozen pnpm install within the execution window because dependency linking stalled. The focused AST-detector tests were run separately and passed; the full application test suite is validated by GitHub Actions.
- GitHub Actions on follow-up commit `42a2523c534d9c30044b00db88ecbb7a3aa0c079` passed **Unit Tests**, **Build and Test** (including typecheck, lint, build, and generated-file drift verification), and **Isolation Suite**. Additional review follow-ups are included after that commit and must also pass CI before merge.
- Cubic's new review run was still queued at the time of this report update. Hyrax Review was skipped because its connected workspace had exhausted included credits; GitHub marked that check as non-blocking.
- Focused tests on the follow-up revision were not run in this session: the fresh remote sandbox stalled during frozen dependency installation. CI on the latest follow-up commit must verify the updated tests, typecheck, lint, build, and generated-file drift checks before merge; earlier successful CI does not cover these follow-up edits.

## Remaining risks and acceptance criteria

- The lockfile was updated from the existing lock graph rather than regenerated by a local pnpm command. CI must verify that pnpm 10.30.3 accepts the lockfile as frozen and that the nested override resolves as intended.
- The scoped override is safe to keep only while Firecrawl's Zod v4 compatibility and schema-conversion tests remain valid. CI and review must confirm that compatibility.
- Do not merge this branch or PR #96 until the security gate and required checks are green.
