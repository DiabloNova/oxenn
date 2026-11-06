# Product Execution Roadmap

## Purpose

This directory contains the executable product and engineering roadmap for Oxenn. Each roadmap stage must have its own Markdown document with implementation-level detail.

The roadmap is written against the intended post-baseline state: assume all accepted findings in docs/Baseline plan/ have been remediated and verified. This is a planning assumption, not permission to begin roadmap implementation early.

## Execution gate

Roadmap implementation must not start until:

1. Every accepted Baseline Plan finding is marked verified.
2. Rejected findings have documented reasons and accepted residual risks.
3. A new repository-wide audit and required checks pass on the post-baseline commit.
4. The roadmap is reconciled against the actual post-remediation code, schema, integrations, and architecture.
5. The stage's prerequisites, scope, acceptance criteria, and data/security implications are understood.

## Roadmap principles

- Build on the existing architecture where it is sound; do not introduce technology or microservices without a demonstrated need.
- Keep product value and the Iran-first market strategy explicit.
- Separate the MVP from later capabilities. Do not make future or partially implemented features appear operational.
- Design shared platform capabilities once, with tenant-safe contracts and clear domain ownership.
- Preserve evidence provenance and distinguish observed facts, customer-supplied data, estimates, hypotheses, simulations, and measured outcomes.
- Keep mock/demo behavior visibly and technically separate from live customer workflows.
- Require explicit authorization for external side effects and human approval where physical-world execution or material commitments are involved.
- Every stage must be independently reviewable, testable, and releasable where practical.
- Do not claim revenue, quality, or causal improvement from proxy metrics alone.

## Required file structure

    docs/Roadmap/
      README.md
      INDEX.md
      01-<stage-name>.md
      02-<stage-name>.md
      03-<stage-name>.md

## Required sections in every roadmap stage file

1. Stage title, ID, status, and intended release horizon.
2. Objective and customer/business value.
3. Context and post-baseline assumptions.
4. Scope, explicit non-goals, and user journeys.
5. Prerequisites and dependencies, including relevant Baseline Plan IDs.
6. Detailed ordered implementation procedure with checkpoints.
7. Target repository files, modules, database objects, APIs, and integrations; mark any path that must be reconfirmed after baseline remediation.
8. Data contracts, ownership, tenant boundaries, provenance, retention, and migration strategy.
9. Security, privacy, permissions, cost, performance, and failure-mode considerations.
10. Test strategy: unit, integration, database/RLS, security, E2E, accessibility/localization, and operational verification as applicable.
11. Acceptance criteria and definition of done.
12. Deployment/release sequence, monitoring, rollback, and recovery.
13. Parallelization plan: independent workstreams, shared-file conflicts, sequencing, and integration ownership.
14. Deliverables, documentation updates, and measurable success indicators.
15. Risks, open decisions, and evidence required to close them.

## Planning and execution lifecycle

proposed → ready → in_progress → blocked → implemented → verified → released

A stage may be ready only after its prerequisites are satisfied. Implementation and release status must never be inferred from a document being written or a build passing alone.
