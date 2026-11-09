# Oxenn Problem Register

**97 individual records completed**

**Status:** 97 findings recorded; DOC-001 is verified complete on main. The remaining findings still require Wave 0 revalidation and explicit approval before remediation.  
**Branch:** `docs/architecture-aligned-remediation-2026-11`  
**Architecture reference:** [OXENN_PRODUCT_ARCHITECTURE.md](../../docs/architecture/OXENN_PRODUCT_ARCHITECTURE.md)

## Register structure

- [Individual findings](./findings/): one file per finding, with problem statement, evidence, affected paths, impact, recommended solution, architecture alignment, verification criteria, and related findings.
- [Subject categories](./categories/README.md): eight primary categories. Each finding has exactly one primary category; cross-references do not merge findings.
- [Dependency-based implementation sequence](./IMPLEMENTATION_SEQUENCE.md): proposed code-remediation order with prerequisites and safety gates. This is not the full product Roadmap and does not authorize code changes.

## Coverage

| Source | Findings | Record range |
|---|---:|---:|
| Root-level audit | 9 | 001–009 |
| Database audit | 5 | 010–014 |
| Documentation audit | 9 | 015–023 |
| Font audit | 4 | 024–027 |
| GitHub Actions audit | 6 | 028–033 |
| Public assets audit | 6 | 034–039 |
| Scripts audit | 7 | 040–046 |
| Source-code audit | 26 | 047–072 |
| Tests audit | 9 | 073–081 |
| Verification audit | 13 | 082–094 |
| Architecture reconciliation | 3 | 095–097 |
| **Total** | **97** | **001–097** |

The 94 original audit identifiers are preserved individually. Three additional architecture gaps (ARCH-001, ARCH-002, ARCH-003) are also recorded separately. No source finding was merged into another record.

## Recording and execution rules

1. Original audit reports remain preserved as evidence.
2. Shared root causes are cross-referenced, not consolidated into a single finding.
3. The recommended solution in each record is aligned with the current Oxenn architecture; unresolved product/security decisions are explicitly identified.
4. The category files describe subject matter, not priority.
5. The implementation sequence expresses dependencies and safe code order; it is not a full Roadmap or implementation authorization.
6. Every finding must be revalidated against the then-current main branch before code changes begin.
7. No source code, database schema, migration, CI workflow, dependency, deployment, PR, or production change is authorized by these documents.
8. Historical verification probes marked do-not-run must remain unused.


## AI execution instructions and live progress

- [AI Remediation Agent Prompt](./AI_REMEDIATION_AGENT_PROMPT.md) — English operating instructions for an AI agent: revalidation, dependency order, architecture invariants, implementation method, verification, parallel-work boundaries, stop conditions, and definition of done.
- [Remediation Progress & Execution Log](./REMEDIATION_PROGRESS.md) — the live 97-finding ledger and dated execution history. Update it throughout the work so the current state, evidence, blockers, and next permitted action remain visible.

The progress tracker began at **not started**. DOC-001 has since been verified on main; the remaining findings still require explicit approval and the mandatory Wave 0 gate before remediation.

## Next gate

The documentation set is ready for review. Implementation may begin only after the user approves the relevant scope and the Wave 0 revalidation/safety gate in the implementation sequence is completed.

## Automated GitHub event recording

The Remediation Event Recorder workflow maintains the execution history and finding lifecycle from GitHub events. It records closed PRs and completed CI runs in monthly append-only JSONL files under the events directory, including finding IDs, changed paths, PR/commit references, and CI outcomes.

For reliable association, include each finding ID in the branch name or PR title; for IDs listed in the PR description, use an explicit line beginning with Finding-IDs:. When a PR addresses multiple findings, include the finding record file(s) in the changed paths so the recorder can map those files precisely. It records other changed paths without inventing a per-finding association.

The recorder distinguishes branch/PR CI from post-merge verification. A merged PR is marked Integrated — verification pending; only successful CI on main for that exact merge commit advances the ledger and finding record to Verified complete. A closed, unmerged PR is marked Closed without merge. Failed post-merge CI is never represented as resolved.

The workflow checks out only trusted main-branch code and never checks out or executes pull-request code. It uses non-force Git ref updates with bounded retry on concurrent updates. If repository permissions or branch rules prevent a safe write, the workflow fails rather than bypassing protections. See the [event-history contract](./events/README.md).
