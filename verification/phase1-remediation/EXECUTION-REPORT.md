# Phase 1 remediation execution evidence

- Kit: oxenn-remediation-kit v1.1
- Branch: fix/audit-remediation-p1-v1.1
- Commit initially tested: 5b685cb53542f0bdc51114bb1dba82c12868f5bc
- Run: [39216560581](https://github.com/DiabloNova/oxenn/actions/runs/39216560581)
- Node: v22.23.3
- pnpm: 10.30.3
- Production database: none used; isolation suite uses the disposable GitHub Actions PostgreSQL service.
- Raw pnpm audit command exit (may be non-zero when advisories exist): 1
- Install exit: 0

| Gate / evidence command | Exit |
|---|---:|
| audit-gate | 1 |
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
| lint-budget | 1 |
| lint | 0 |
| pnpm-audit-command | 1 |
| resolution-floors | 1 |
| rls-migration-coverage | 0 |
| route-manifest | 0 |
| tenant-table-alignment | 0 |
| typecheck | 0 |
| ui-baseline | 0 |
| ui-tests | 0 |
| unit-baseline | 0 |
| unit-tests | 0 |

Full command output and unmodified pnpm audit JSON are attached as the workflow artifact phase1-remediation-evidence.
A gate passes only when its exit code is 0. Skipped gates are recorded as 125 and are not accepted.
