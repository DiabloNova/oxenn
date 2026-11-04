# Oxenn MVP — Phase 0: Scope and Baseline

**Status:** In progress  
**Branch:** `mvp/phase-0-scope-baseline`  
**Baseline:** `main` at `c748bc5610ebd2c26f4268bd93b68ab9a4541b6b`  
**Baseline commit date:** 2026-11-03  
**Prepared:** 2026-11-04

## 1. Purpose

Establish a verified, narrow MVP scope and a reproducible repository baseline before security remediation or feature implementation begins.

This phase is documentation and discovery only. It does not authorize production access, database migrations, provider calls, deployment, dependency changes, or application-code refactoring.

## 2. MVP scope decision

The MVP will deliver two end-to-end user journeys:

1. **Technical SEO Audit**
   - Register/select a website in an authorized workspace.
   - Start a bounded, secure crawl.
   - Run a defined set of technical SEO checks against fetched pages.
   - Persist crawl and audit results.
   - Display findings, severity, run status, and execution history.

2. **AI Visibility Audit**
   - Select a brand and a versioned prompt set.
   - Execute prompts through an explicitly configured live AI provider.
   - Persist provider metadata, prompts, responses, evidence, and run status.
   - Calculate only documented, reproducible metrics from observed results.
   - Display results and historical comparisons.

Both journeys depend on shared authentication, workspace/tenant authorization, persistent PostgreSQL storage, job lifecycle, provider configuration, provenance, and observable failure handling.

### Explicitly out of MVP

The following dashboard tools are not part of the first MVP release and must not be presented as operational capabilities:

- Schema & Metadata
- Content Studio
- Content Ingestion
- Competitor Radar
- Knowledge Graph
- LLM Response Share & Bias
- AI Playground
- Citation Explorer

Their pages may remain as disabled/Coming Soon shells. Existing backend code outside the two selected journeys is not, by itself, a reason to expand MVP scope.

## 3. Non-negotiable product invariants

- Production results must not silently substitute mock, seeded, synthetic, or hash-derived data when a live provider or crawl fails.
- Every user-visible result must expose whether it is live, demo, partial, or failed.
- PostgreSQL is the source of truth for user-created websites, audit runs, findings, prompts, and results.
- User and tenant identity must be derived from trusted server-side authentication context; caller-supplied headers are not proof of identity or authorization.
- Crawl destinations must be validated against SSRF, redirect, DNS-rebinding, private-network, and resource-exhaustion risks.
- Failed or incomplete work must remain distinguishable from successful completed work.
- A page, API, service, or passing unit test alone does not establish that a user journey is complete.

## 4. Repository baseline — verified observations

The following facts were checked against the repository's current public `main` branch and checked-in files on 2026-11-04:

| Area | Verified baseline |
|---|---|
| Latest main commit observed | `c748bc5610ebd2c26f4268bd93b68ab9a4541b6b` |
| Latest commit subject | `docs: add verified repository context guide (#110)` |
| Package manager | `pnpm@10.30.3` |
| Node engine | `>=22` |
| Framework | Next.js `16.4.2`, React `19.2.4` |
| Persistence stack | PostgreSQL and Drizzle ORM are declared in the project |
| Build script | Generates docs data, then runs Next.js build |
| Test scripts | Unit, DB-labelled Vitest project, UI, acquisition, and PostgreSQL isolation scripts are defined |
| Migration scripts | Drizzle generation and the guarded migration runner are defined |
| Documentation index | `docs/README.md` points to product, user, service, API, architecture, and security documentation |
| Project documentation | `docs/project/README.md` identifies project audits, roadmaps, and task records as historical/point-in-time material |

Relevant checked-in files inspected for this phase:

- `AGENTS.md`
- `docs/REPOSITORY_CONTEXT.md`
- `docs/README.md`
- `docs/project/README.md`
- `docs/product/README.md`
- `docs/architecture/README.md`
- `package.json`

## 5. Baseline caveats and conflicts to resolve

### 5.1 Product documentation overstates readiness relative to the audit

`docs/product/README.md` labels numerous broad capabilities as **Implemented**. The preceding repository audit found that the ten dashboard catalog routes do not represent ten complete, production-ready user journeys: four pages have incomplete action/service wiring, six are shell-only at the page level, and none was established as production-ready.

**Required Phase 0 action:** treat the product status labels as claims requiring implementation-level evidence. Do not use them as the MVP completion baseline. Update product status documentation only after the corresponding current runtime path has been verified.

### 5.2 Production connectivity remains unverified

`docs/REPOSITORY_CONTEXT.md` explicitly distinguishes ephemeral PostgreSQL used by CI isolation tests from a persistent production database. Repository declarations, migrations, and CI PostgreSQL do not prove that a production database is connected.

**Required Phase 0 action:** record production DB connectivity as **NOT VERIFIED** until a separately authorized staging/production verification is performed.

### 5.3 Test-tier distinction

The package defines `test:db`, but the repository context snapshot says the reviewed CI workflow did not invoke it. The CI PostgreSQL isolation suite and the DB-labelled Vitest project are separate test tiers.

**Required Phase 0 action:** inspect the current workflow on the implementation branch before claiming DB test coverage. Do not infer that a script is run merely because it exists.

### 5.4 Repository/worktree limitations

The branch was created through GitHub from `main`. A local checkout, local working-tree status, installed dependencies, and locally executed test results were not available as part of this hosted repository operation.

Therefore:
- Local working-tree cleanliness: **NOT VERIFIED**
- Local test execution: **NOT RUN**
- Production DB connectivity: **NOT VERIFIED**
- Live provider credentials/reachability: **NOT VERIFIED**

## 6. Decisions recorded for downstream phases

| Decision | Consequence |
|---|---|
| Two primary journeys only: Technical SEO and AI Visibility | No expansion to the other dashboard tools during MVP |
| Security remediation precedes public beta | Phase 1 is a release blocker |
| Persistent PostgreSQL is authoritative | In-memory maps cannot be the production source of truth |
| Explicit provenance for live/demo/partial/failed | No silent mock fallback in production |
| E2E coverage required for both journeys | Build/unit-test success alone is insufficient |
| No production mutation during Phase 0 | Production access, migrations, and deployment require separate authorization |

## 7. Phase 0 work checklist

- [x] Confirm repository identity and current `main` baseline commit.
- [x] Read root agent contract and relevant project/product/architecture documentation.
- [x] Confirm package manager, runtime engine, and available test/build/migration scripts.
- [x] Define the two MVP journeys and explicitly defer the remaining dashboard tools.
- [x] Record documentation/runtime readiness conflicts and operational unknowns.
- [x] Inspect current `.github/workflows/ci.yml` and capture its exact required checks.
- [x] Produce an initial UI → Server Action → Service/Repository → provider/data trace for both MVP journeys.
- [x] Produce an environment-variable inventory with purpose and required/optional classification; no secret values included.
- [x] Confirm schema/snapshot/migration coverage and canonical schema ownership for the MVP entities without modifying the database (see section 13).
- [ ] Review the Phase 0 findings and acceptance criteria before opening Phase 1 implementation work.

## 8. Phase 0 exit criteria

Phase 0 is complete only when:

1. Both MVP journeys have an implementation trace grounded in current source files.
2. CI checks and test tiers are documented from the current workflow, not a historical summary.
3. Required environment variables and provider dependencies are inventoried without exposing credentials.
4. Existing schema and migration coverage for the MVP entities is mapped.
5. Conflicts between product claims, architecture documentation, and runtime implementation are recorded with evidence.
6. No production connectivity, migration, or provider operation is represented as verified without direct authorized evidence.

**Next phase:** Phase 1 — Security and Tenant Isolation. It must not begin as public-beta work until the SSRF and API authentication/authorization findings from the audit are addressed and verified with negative-path tests.


## 9. Fresh implementation trace — main baseline

These are source-level observations from files fetched from `main` at the baseline commit. They describe the current wiring, not a claim that production services or credentials were exercised.

### 9.1 Technical SEO

**Observed path**

`src/app/[locale]/dashboard/seo/technical/page.tsx`  
→ imports and calls `getTechnicalSeoDashboardAction`  
→ `src/app/actions/technical-seo.ts`  
→ requires a Session and Workspace membership, then opens a TenantContext  
→ constructs `WebsiteRepository`, `PageRepository`, `PostgresDiagnosticFindingRepository`, `TechnicalSeoAnalyzerService`, and `DiagnosticEngine`.

**Blocking implementation gap**

The action currently looks up the hard-coded domain `secure-site.com`, provisions it when missing, and seeds two default pages when no pages are found. It then constructs `SeoSignals` using `createMockPageSeoSignals` instead of consuming a real crawl result. The analyzer logic itself is deterministic and can be reused, but its current page input is synthetic. The current UI is therefore connected to an action, but the action is not an end-to-end live crawl-to-audit journey.

**Relevant files**
- `src/app/[locale]/dashboard/seo/technical/page.tsx`
- `src/app/actions/technical-seo.ts`
- `src/services/technical-seo-analyzer.ts`
- `src/features/ai-intelligence/repositories/index.ts`
- `src/services/crawler/web-crawler.ts`

### 9.2 AI Visibility Audit

**Observed path**

`src/app/[locale]/dashboard/aeo/audits/page.tsx`  
→ calls `getBrandsAction`, `createAndRunAuditAction`, and `getAuditDetailsAction`  
→ `src/app/actions/ai-visibility-audit.ts`  
→ requires a Session and Workspace membership, then opens a TenantContext  
→ `AIVisibilityAuditEngine.executeAudit`  
→ creates seven prompt records and asks `AIVisibilityProviderRegistry.getProvider(providerType)` to execute them.

**Blocking implementation gaps**

- The action calls `executeAudit` without a provider type. The engine therefore reaches the registry's default branch.
- `AIVisibilityProviderRegistry` returns `MockAIVisibilityProvider` unless `providerType === "gemini"` and `GOOGLE_AI_API_KEY` is configured. The UI action does not explicitly select Gemini.
- `getBrandsAction` creates a default `Rasha Gostar` brand at `https://secure-site.com` when the tenant has no brands.
- `BrandRepository` reads and writes the in-memory `db.brands` Map.
- The AI audit repository attempts PostgreSQL reads but has a memory fallback when the query fails or returns no row. This must be reviewed before it can be treated as durable production persistence.

**Relevant files**
- `src/app/[locale]/dashboard/aeo/audits/page.tsx`
- `src/app/actions/ai-visibility-audit.ts`
- `src/features/ai-intelligence/services/ai-visibility-audit-engine.ts`
- `src/services/ai/ai-visibility-provider.ts`
- `src/services/ai/llm-client.ts`
- `src/features/ai-intelligence/repositories/index.ts`

### 9.3 Repository persistence observation

In the current repository implementation:
- `BrandRepository` is backed by the in-memory `db.brands` Map.
- `WebsiteRepository` and `PageRepository` issue SQL queries, but their read methods shown in the inspected source discard query rows and return data from in-memory Maps.
- `PostgresDiagnosticFindingRepository` similarly issues SELECT queries but returns from the in-memory Map on reads.
- `AIVisibilityAuditRepository` maps PostgreSQL rows when present, but its read path includes a memory fallback.

This is a material persistence boundary issue for both MVP journeys. Do not treat the presence of SQL statements or successful query execution as proof that reads are sourced from PostgreSQL.

## 10. Current CI and test baseline

The current `.github/workflows/ci.yml` on `main` defines three jobs:

1. **Build and Test**
   - Dependency audit gate and its regression tests
   - TypeScript typecheck
   - ESLint with `--max-warnings=218`
   - Tenant-table schema alignment
   - RLS migration coverage
   - Drizzle migration-chain check
   - Next.js build
   - Documentation/reference-matrix generation and generated-file drift check

2. **Unit Tests**
   - `pnpm test:unit`
   - `pnpm test:ui`

3. **Isolation Suite**
   - PostgreSQL/pgvector 16 service
   - `pnpm run test:isolation`
   - Ephemeral CI database credentials scoped to that job

The workflow does **not** invoke `pnpm test:db`, and no E2E job or E2E script is declared in the inspected `package.json`. The previous audit's observed 257 unit tests, 32 UI tests, and 51-table/488-assertion isolation result belong to the previously inspected CI run; this newly created branch has no workflow run reported for its documentation-only commits.

## 11. Environment-variable inventory

Variable names and purposes below are taken from `.env.example` and `scripts/env-check.ts`. No secret values are recorded.

| Variable | Declared purpose | Required by current env-check |
|---|---|---|
| `DATABASE_URL` | Application PostgreSQL connection | Yes: dev, build, migrate, test |
| `MIGRATION_DATABASE_URL` | Optional migration connection override | No; migrate only if supplied |
| `SESSION_SECRET` | Session/authentication secret | Yes: dev, build |
| `GOOGLE_AI_API_KEY` | Gemini provider credential | No |
| `FIRECRAWL_API_KEY` | Firecrawl credential | No |
| `USE_MOCK_CRAWLER` | Enables crawler mock behavior | No |
| `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` | Background job integration | No |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Redis rate-limiting integration | No |
| `AUTHENTICATOR_DATABASE_URL`, `AUTHENTICATOR_POOL_MAX` | Privileged/system database pool | No |
| `VERIFICATION_PROBE_ACTIVE` | Test/verification-only probe gate | No |
| `ALLOW_DB_PUSH`, `DISPOSABLE_DB` | Database push safety controls | Optional validation in dev/migrate/test |
| `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL` | Public frontend/API URLs | Optional format validation in dev/build |
| `APP_MODE` | Environment mode hint | Used to resolve mode |
| `EMAIL_PROVIDER` | Email delivery provider selection | Not required; example explicitly says unset until implementation is ready |

**MVP implication:** current environment validation does not require Gemini or Firecrawl credentials. A successful environment check therefore does not prove that either live provider is configured or reachable.

## 12. Schema inventory observations

A direct scan of the exported `pgTable` declarations in `database/schema/index.ts` found 68 declarations. That file also imports `organizations` from `database/schema/organization-table.ts` and re-exports `api_keys` from `database/schema/api-keys.ts`. The effective Drizzle schema therefore contains **70 tables** in total. Among the MVP-relevant declarations are:

- `brands`
- `websites`
- `pages`
- `diagnostic_findings`
- `prompts`
- `prompt_definitions`
- `prompt_executions`
- `ai_visibility_audits`
- `audit_prompts`
- `crawl_jobs`
- `crawl_results`
- `crawl_cache`
- `crawl_snapshots`

This is a declaration inventory only; it does not establish that migrations have been applied to staging or production.

**Count reconciliation:** the 68 declarations in `database/schema/index.ts`, plus the separately declared `organizations` and `api_keys` tables, produce 70 schema tables. The latest checked-in Drizzle snapshot also contains 70 tables. The architecture README previously stated 57; that stale count is corrected on this branch. The 51 RLS-protected tables are a subset of the 70 and are not a conflicting total.

The source-of-truth schema is composed from `database/schema/index.ts` and its two table modules above. The ordered migration history is `database/drizzle/meta/_journal.json` plus the SQL files named by that journal.


## 13. Static migration coverage reconciliation — 2026-11-04

This check was performed against the checked-in files on `mvp/phase-0-scope-baseline`. It is a repository-level static reconciliation; it did not connect to or modify any database.

### 13.1 Canonical schema and migration ownership

- Drizzle Kit is configured by `drizzle.config.ts` with schema `database/schema/index.ts` and migration output `database/drizzle`.
- The effective schema is composed of 70 table declarations: 68 in `database/schema/index.ts`, plus `organizations` in `database/schema/organization-table.ts` and `api_keys` in `database/schema/api-keys.ts`.
- The latest journal entry is `0013_remove_api_keys_prefix_index`; its corresponding snapshot is `database/drizzle/meta/0013_snapshot.json`.
- The ordered journal contains 14 entries, and all 14 referenced SQL migration files exist.
- The effective schema names and latest snapshot names match exactly: **70 / 70**, with no schema-only or snapshot-only table.
- Across the journal, the migration SQL creates 70 unique tables. That set matches the latest snapshot exactly: no snapshot table lacks a CREATE TABLE in the migration history, and no migration-created table is absent from the snapshot.

### 13.2 MVP entity-to-migration map

| MVP journey | Tables | Creation migration |
|---|---|---|
| Technical SEO | `websites`, `pages`, `diagnostic_findings`, `diagnostic_finding_relationships`, `technical_audits`, `crawl_jobs`, `crawl_results`, `crawl_cache` | `0000_reflective_loa` |
| Technical SEO | `crawl_snapshots` | `0003_warm_shadow_king` |
| AI Visibility | `brands`, `prompts`, `prompt_definitions`, `prompt_executions`, `ai_visibility_audits`, `audit_prompts`, `ai_observations` | `0000_reflective_loa` |

Every table in this MVP map exists in the latest Drizzle snapshot and has tenant-isolation policies recorded there. This establishes schema/migration coverage; it does **not** mean the current application actions use every listed table as their live persistence path. Repository ownership and end-to-end data flow remain implementation work for later phases.

### 13.3 RLS coverage reconciliation

The latest snapshot contains **51 policy-bearing tables**. The generated runtime list in `src/core/database/tenant-tables.generated.ts` also contains 51 entries and matches the snapshot policy-table set exactly (no missing or extra entries).

Migration `0005_force_rls.sql` contains both `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` for all 51 of those tables. The two statement sets match the snapshot policy-table set exactly. All 16 tables in the MVP entity map above are among those policy-bearing tables.

The current CI workflow includes three related checks:
- `pnpm tsx scripts/database/verify-tenant-tables.ts`
- `pnpm db:verify-rls-migrations`
- `pnpm exec drizzle-kit check --config=drizzle.config.ts`

These checks are defined in the workflow, but they were **not executed locally during this hosted repository review**, and no CI result for these documentation commits is claimed here.

### 13.4 Result and remaining boundary

**Repository-level migration coverage: PASS.** No missing MVP table creation, missing snapshot entry, or RLS-list mismatch was found in the checked-in schema, snapshot, generated runtime list, or migration SQL.

The 57-table statement previously in `docs/architecture/README.md` was stale and is updated to 70 on this branch; the text now distinguishes the 51 policy-bearing subset.

Still **NOT VERIFIED**:
- Whether these migrations have been applied to any particular staging or production database.
- Whether the live database's `__drizzle_migrations` state matches the checked-in journal.
- Whether production roles, grants, connection settings, and effective RLS behavior are correct.
- Whether the CI workflow has passed on a PR containing these changes.

No migration was run, no database was queried, and no application runtime behavior was changed by this reconciliation.
