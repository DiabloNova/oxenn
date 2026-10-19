# Phase 1 remediation execution evidence

> **Evidence scope:** This is the historical baseline for commit `75e4234033bae31e23ec56ee91a6b12b21775f7c` and run [39217271292](https://github.com/DiabloNova/oxenn/actions/runs/39217271292). Its gate table and outcomes do **not** certify later commits or the current PR head. The code at `4827cc52c89d3f3484787d319c26fdd81f1c8235` subsequently passed all three CI jobs in [run 39223406998](https://github.com/DiabloNova/oxenn/actions/runs/39223406998); because this report update creates a new commit, use the latest Actions run to verify the final PR head.

- Kit: oxenn-remediation-kit v1.1
- Branch: fix/audit-remediation-p1-v1.1
- Commit initially tested: 75e4234033bae31e23ec56ee91a6b12b21775f7c
- Run: [39217271292](https://github.com/DiabloNova/oxenn/actions/runs/39217271292)
- Node: v22.23.3
- pnpm: 10.30.3
- Shared/production database touched: no. Isolation tests use disposable GitHub Actions PostgreSQL.
- Raw audit command exit (nonzero may simply indicate advisories): 1
- Install exit: 0

| Gate | Exit |
|---|---:|
| audit-gate | 0 |
| build | 0 |
| dependency-tree | 0 |
| dependency-why-brace-expansion | 0 |
| dependency-why-braces | 0 |
| dependency-why-source-map-js | 0 |
| docs-matrix | 0 |
| drizzle-check | 0 |
| image-optimizer-smoke | 0 |
| install-peer-errors | 0 |
| install | 0 |
| isolation-suite | 0 |
| lint-budget | 0 |
| lint | 0 |
| pnpm-audit-command | 1 |
| resolution-floors | 0 |
| rls-migration-coverage | 0 |
| route-manifest | 0 |
| tenant-table-alignment | 0 |
| typecheck | 0 |
| ui-baseline | 0 |
| ui-tests | 0 |
| unit-baseline | 0 |
| unit-tests | 0 |

## Verified outcomes

- Dependency installation: PASS; no fatal pnpm peer-dependency errors. The generated pnpm-lock.yaml is committed on this branch.
- Audit policy gate: PASS. Zero critical advisories and zero high advisories with a published fix. The sole high advisory is braces / GHSA-vfj7-8cjw-p6xm, formally risk-accepted until the review date 2026-11-19. The only other reported advisory is moderate esbuild / GHSA-67mh-4wv8-2f99, non-blocking per kit v1.1. The raw pnpm audit command returns exit 1 because these remaining advisories are reported; the policy gate returns exit 0.
- Resolved transitive dependency floors: brace-expansion 1.1.21, 2.1.7, and 5.0.12; source-map-js 1.2.2. No vulnerable brace-expansion 4.x resolution remains.
- Lint: 0 errors and 218 warnings (at the permitted maximum).
- Unit tests: 41 test files passed, 1 pre-existing file skipped; 164 tests passed and 1 TODO. UI tests: 1 file passed, 3 tests passed.
- Build and smoke checks: build passed; /api/inngest is present in the build manifest; the production image optimizer returned HTTP 200.
- Database-related checks: drizzle-kit check, RLS migration coverage, and tenant-table alignment passed. The isolation suite applied migrations to the disposable PostgreSQL service, then passed 488 assertions across 51 tenant tables. No shared or production database was used.
- Docs reference-matrix generation passed.

The linked GitHub Actions run exposes the workflow summary and step logs retained by GitHub. The downloadable artifact contains the committed lockfile and this report; it does not contain the runner's temporary raw audit JSON or per-gate log files.
