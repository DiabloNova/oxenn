# Stage 00 — Post-Baseline Verification and Product Scope Freeze

## Metadata
- **Stage ID:** RM-00
- **Horizon:** Short-term prerequisite
- **Status:** proposed
- **Execution gate:** Must not start until every accepted Baseline Plan finding is verified.

## Objective

Prove that repository remediation is complete, establish a fresh verified technical baseline, and convert the approved product strategy into a bounded MVP scope. This stage prevents the Roadmap from being executed against assumptions that became obsolete during remediation.

## Customer and business value

No customer-facing capability is added in this stage. Its value is risk reduction: subsequent work is based on a tested, persistent, tenant-safe application and a single approved product definition.

## Preconditions and dependencies

- Every accepted `BL-###` item is `verified`.
- Every rejected item has a reason and residual-risk decision.
- All BL dependencies are closed in the stated order.
- Existing PRs/branches and any unmerged contribution have an explicit disposition.
- A clean post-remediation commit exists.

## Scope and non-goals

**In scope:** final re-audit, baseline comparison, product/engineering scope decision, technical and commercial acceptance criteria.

**Out of scope:** feature implementation, production deployment, schema mutation, and expanding the MVP to all long-term capabilities.

## Detailed execution

1. Capture the final source commit, branch and PR state; ensure no unreviewed changes are lost.
2. Run the complete repository verification matrix from the exact commit: install from frozen lockfile, typecheck, lint, unit/UI/service/DB/isolation tests, schema/migration checks, build, docs generation/drift and security checks.
3. Compare every BL item against the final source; verify each acceptance criterion with reproducible output.
4. Conduct a fresh search for newly exposed release blockers and warnings. Create new BL entries rather than silently expanding an old finding.
5. Reconcile architecture and product docs with the actual final implementation.
6. Freeze the short-term scope: Iran-first, one initial vertical, one or two customer journeys, explicit included/excluded features and manual-service boundaries.
7. Approve service-level data sources, live provider/surface availability, expected cost per assessment, target user and paid pilot criteria.
8. Record unresolved decisions, release risks, owner and approval; only then set the next stage to `ready`.

## Target files and systems

- `docs/Baseline plan/INDEX.md` and all BL finding files.
- `docs/Roadmap/INDEX.md` and following stage documents.
- `docs/project/README.md`, `docs/architecture/README.md` and product strategy documents — reconcile after baseline fixes.
- `.github/workflows/**`, `package.json`, test/configuration files — verify only; modify only if newly found drift is recorded and approved.
- GitHub main, open branches and PR metadata — inspect; no merge/close/rebase without explicit authorization.

## Data and security requirements

The final verification must run on disposable test infrastructure. Production DB state, deployment readiness, provider secrets and third-party API access must be separately verified and explicitly approved; CI success alone is not enough.

## Parallelization

The final re-audit and product-scope validation can run as separate read-only workstreams. The final source baseline, release gate and scope document need one integrating owner. Do not perform concurrent release decisions or merge operations.

## Acceptance criteria

- Every accepted BL item is `verified`; no unresolved P0/P1 blocker remains.
- A fresh full verification passes on the exact final commit.
- The resulting report states what was and was not tested in staging/Production.
- One approved MVP scope and its measurable success criteria are recorded.
- Subsequent stages reference the final baseline commit and the relevant closed BL IDs.

## Deliverables

- Post-Baseline Verification Report.
- Final MVP Product Requirements and scope matrix.
- Updated Roadmap index with explicit prerequisites and owners.
- Release gate decision: ready / blocked, with evidence.

## Risks and open decisions

The initial vertical, the exact supported AI answer surfaces, social platform access mechanisms, data contribution model and willingness-to-pay must be validated before they are treated as settled product facts.
