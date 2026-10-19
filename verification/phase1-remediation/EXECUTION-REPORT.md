# Phase 1 remediation execution evidence

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

Full logs and raw pnpm audit JSON are attached as the phase1-remediation-evidence Actions artifact.
