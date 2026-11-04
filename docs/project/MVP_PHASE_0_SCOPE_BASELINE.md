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
- [ ] Inspect current branch CI workflow and capture its exact required checks.
- [ ] Produce a route → API/action → service → repository → database/provider trace for each MVP journey.
- [ ] Produce an environment-variable inventory with purpose and required/optional classification; never include secret values.
- [ ] Confirm the canonical MVP entities and their existing schema/migration coverage without modifying the database.
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
