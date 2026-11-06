# Repository Baseline Plan

## Purpose

This directory is the authoritative, evidence-backed register of repository defects, inconsistencies, warnings, errors, security gaps, reliability problems, and implementation/documentation mismatches that must be resolved before the product roadmap is executed.

The audit baseline must identify the exact repository commit and branch state. Findings must describe what was verified at that baseline; historical observations are leads to re-check, not proof of current defects.

## Non-negotiable rules

1. Every validated finding receives a stable ID (BL-001, BL-002, …) and its own Markdown file.
2. A finding must include reproducible evidence: exact file paths and line/symbol references, command or test output, or a directly inspected configuration/state. Do not record guesses as confirmed defects.
3. Group findings into numbered Part sections by problem category. The exact categories and Part boundaries are determined by the audit, not assumed in advance.
4. Maintain one global execution order across all Parts. Ordering must account for severity, blast radius, prerequisites, and downstream dependencies—not severity alone.
5. Record affected files precisely. Distinguish files that require changes from files that only provide evidence or tests.
6. Recommend one primary remediation approach and explain why it best fits the existing architecture, product direction, security model, and operational constraints. Record credible alternatives and why they were rejected.
7. Evaluate parallel execution for every finding. State whether it is safe, unsafe, or conditionally safe; identify shared files/resources, prerequisites, isolation boundaries, and integration order.
8. A finding is not complete merely because code was changed. It becomes verified only after its acceptance criteria and regression checks pass.
9. Do not hide warnings, weaken checks, or suppress diagnostics merely to obtain a green result. Any accepted exception must include its technical justification, owner, and review condition.
10. No production database, production deployment, protected branch, or unrelated pull request is changed as part of documenting or resolving a finding without separate authorization.

## Audit coverage

The repository-wide audit must cover, at minimum:

- Application source, module boundaries, duplicated or dead code, type contracts, and implementation consistency.
- Build, typecheck, lint, formatting, static analysis, and runtime warnings/errors.
- Dependencies, lockfiles, package scripts, framework/toolchain compatibility, and security advisories.
- API routes, server actions, validation, authentication, authorization, and tenant identity propagation.
- Database schema, migrations, generated snapshots, relations, constraints, indexes, RLS policies, role assumptions, and migration ordering.
- Repository/data-access patterns and tenant scoping in every applicable query.
- Mock, live, and hybrid providers; fallbacks; persistence; provenance; and synthetic-data leakage.
- Background jobs, retries, idempotency, queues, caching, concurrency, timeouts, and resource limits.
- External integrations, credentials/configuration contracts, quotas, failure handling, and cost controls.
- Unit, integration, database, security, and end-to-end test coverage; skipped, flaky, undiscovered, or misleading tests.
- CI workflows, deployment configuration, runtime environment assumptions, observability, and operational documentation.
- UI behavior, accessibility, localization/RTL, and alignment between documented and implemented capabilities.

The audit must inspect both source and relevant repository history/PR context where that affects the current baseline. A passing CI run on another commit is not evidence for the audited commit.

## Priority model

- **P0 — Critical:** exploitable security flaw, cross-tenant data exposure, destructive data risk, or severe production integrity failure.
- **P1 — Blocking:** prevents a trustworthy MVP journey, core persistence, authorization, or reliable operation.
- **P2 — Material:** important correctness, compatibility, performance, maintainability, or coverage issue that should be addressed before the relevant release.
- **P3 — Improvement:** non-blocking cleanup or enhancement with limited immediate impact.

The global order must also include explicit dependency links such as depends_on: BL-00x and blocks: BL-00y.

## Index and status tracking

Keep this README or a companion INDEX.md updated with:

| Global order | ID | Part / category | Title | Priority | Dependencies | Status |
|---:|---|---|---|---|---|---|

Allowed statuses:

identified → validated → planned → in_progress → blocked → resolved → verified

Use rejected for a false positive or an item intentionally not addressed; the evidence and reason are mandatory. Do not silently delete duplicates—link them to the canonical finding.

## Required file structure

    docs/Baseline plan/
      README.md
      INDEX.md
      Part-01-<category>/
        BL-001-<short-title>.md
        BL-002-<short-title>.md
      Part-02-<category>/
        BL-003-<short-title>.md

## Required sections in every finding file

1. Title and stable finding ID.
2. Metadata: priority, category, status, audited commit, confidence, global order.
3. Exact problem statement: expected behavior versus observed behavior.
4. Evidence and reproduction: exact paths, line/symbol references, commands, outputs, and relevant PR/commit references.
5. Root cause, separating confirmed cause from remaining hypotheses.
6. Target files and symbols, with the intended reason for changing each.
7. Recommended remediation, implementation constraints, alternatives considered, and why the recommendation is the best fit.
8. Dependencies, blockers, downstream effects, and compatibility/migration implications.
9. Tests and measurable acceptance criteria, including negative/failure/tenant-boundary cases where relevant.
10. Parallelization assessment: safe/unsafe/conditional, work boundary, overlapping paths/resources, prerequisites, coordination, and integration sequence.
11. Rollback or recovery considerations.
12. Verification record: exact commands, environment, commit, results, and outstanding limitations.

## Completion gate

Baseline remediation is complete only when every accepted finding is verified, every rejected item has a documented disposition, all dependencies are reconciled, and a fresh repository-wide verification pass finds no unclassified release-blocking issue. The final audit report must identify the new commit and explicitly compare it with the initial baseline.
