# Oxenn Baseline Preparation Workspace

This workspace contains the staged repository-baseline audit and its resulting execution plans.

## Audit reports

- [Root-level files audit](./root-files-audit.md) — review of the 19 repository-root files.
- [GitHub workflows audit](./github-folder-audit.md) — review of the complete .github/ folder and current CI evidence.
- [Database folder audit](./database-folder-audit.md) — inventory and static review of schemas, active and archived migrations, Drizzle snapshots, RLS policies, bootstrap, and seed files.
- [Documentation folder audit](./docs-folder-audit.md) — review of the documentation hierarchy, Baseline Plan, Roadmap, database/security contracts, product/API claims, and historical records.
- [Font folder audit](./font-folder-audit.md) — full inventory of root font assets, current application font-loader references, provenance/licensing evidence, and unused/placeholder asset findings.
- [Public folder audit](./public-folder-audit.md) — complete public asset inventory, font/logo/icon consumers, metadata wiring, placeholder assets, and sample PDF/report-export findings.
- [Scripts folder audit](./scripts-folder-audit.md) — complete inventory and static review of all 20 scripts, including database safety guards, tenant-table generation, privileged CLI tools, crawl worker, and developer utilities.
- [Source folder audit](./src-folder-audit.md) — static review of the complete src/ tree, including auth, tenant context/RLS enforcement, repositories, AI/RAG, crawling, APIs, product actions, billing, scheduling and user-facing flows.

## Work areas

- [baseline issues/](./baseline%20issues/) — evidence-backed findings discovered during the repository audit. Each validated finding will have its own Markdown record with affected files, root cause, recommended remediation, dependencies, and parallelization assessment.
- [roadmap/](./roadmap/) — ordered implementation stages, authored against the verified post-baseline state and gated on completion of all accepted baseline findings.
- [new_architecture/](./new_architecture/) — architecture observations and proposed target-state decisions. No architecture change is authorized by documenting an observation.

## Audit sequence

The audit proceeds in explicit, user-approved phases. The initial phase is limited to the 19 repository-root files. Each nested folder is reviewed separately, and the next folder is not started until the user approves the preceding phase.

Findings must distinguish confirmed defects from risks, assumptions, and items requiring later cross-checks. No application, database, deployment, or pull-request changes are authorized by this audit workspace.
