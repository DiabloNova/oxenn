# Oxenn Problem Register

**97 individual records completed**

**Status:** 97 findings recorded; DOC-001 and DOC-002 are verified complete on main. The remaining findings still require Wave 0 revalidation and explicit approval before remediation.  
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

The progress tracker began at **not started**. DOC-001 and DOC-002 have since been verified on main; the remaining findings still require explicit approval and the mandatory Wave 0 gate before remediation.

## Next gate

The documentation set is ready for review. Implementation may begin only after the user approves the relevant scope and the Wave 0 revalidation/safety gate in the implementation sequence is completed.

## Automated GitHub event recording

The Remediation Event Recorder workflow maintains execution evidence from GitHub events. It records relevant PR closure events and exact post-merge CI runs in monthly append-only JSONL files under the events directory, including finding IDs, changed paths, PR/commit references, and CI outcomes. Pre-merge and unrelated CI completions are no-ops and do not create commits on main.

For reliable association, include each finding ID in the branch name or PR title; for IDs listed in the PR description, use an explicit line beginning with Finding-IDs:. When a PR addresses multiple findings, include the finding record file(s) in the changed paths so the recorder can map those files precisely. It records other changed paths without inventing a per-finding association.

The recorder distinguishes branch/PR CI from post-merge verification. A finding in a merged PR is marked Integrated — verification pending only when its exact canonical finding file is among the PR changed paths and exactly one ledger row exists; only successful CI on main for that exact merge commit advances it to Verified complete. A closed, unmerged PR is retained as event evidence but cannot change an authoritative finding disposition. Pre-merge CI completions are ignored for main-branch persistence. Failed post-merge CI is never represented as resolved. Every status transition requires an exact canonical finding file and an existing ledger row for every referenced finding ID; partial or unknown mappings fail closed.

The workflow checks out only trusted main-branch code and never checks out or executes pull-request code. Unmerged PR closure events are evidence-only. The recorder preserves existing evidence links, records the exact verified merge SHA, and uses non-force Git ref updates with bounded retry on concurrent updates. If repository permissions or branch rules prevent a safe write, the workflow fails rather than bypassing protections. See the [event-history contract](./events/README.md).
