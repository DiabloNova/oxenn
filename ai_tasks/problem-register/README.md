# Oxenn Problem Register

**Status:** In progress — source findings are being recorded individually.  
**Source branch:** `docs/architecture-aligned-remediation-2026-11`  
**Architecture reference:** [OXENN_PRODUCT_ARCHITECTURE.md](../../docs/architecture/OXENN_PRODUCT_ARCHITECTURE.md)

## Recording rules

- One file represents exactly one original audit finding. No cross-folder consolidation is performed in this register.
- Each record contains the source finding ID, full problem statement, evidence, affected paths, impact, and a recommended solution aligned with the current Oxenn architecture.
- Where two findings share a root cause, both remain separate records and cross-reference one another; a shared fix does not merge their identities.
- The original audit reports remain the evidence source and are preserved.
- The records are numbered in source-audit sequence: root files, database, docs, fonts, GitHub workflows, public assets, scripts, src, tests, verification, then architecture-reconciliation gaps.
- Categories, priority ranking, dependency order, parallelization plan, and implementation roadmap are deliberately deferred until every individual record is complete.
- This register is documentation only. It does not authorize source-code, database, CI, dependency, deployment, PR, or production changes.

## Individual records

| Sequence | Finding ID | Record |
|---:|---|---|
| 001–009 | RF-001–RF-009 | Root-level findings |
| 010–014 | DB-001–DB-005 | Database findings |
| 015–023 | DOC-001–DOC-009 | Documentation findings |
| 024–027 | FNT-001–FNT-004 | Font findings |
| 028–033 | GHA-001–GHA-006 | GitHub Actions findings |
| 034–039 | PUB-001–PUB-006 | Public asset findings |
| 040–046 | SCR-001–SCR-007 | Scripts findings |
| 047–072 | SRC-001–SRC-026 | Source-code findings |
| 073–081 | TST-001–TST-009 | Test-suite findings |
| 082–094 | VER-001–VER-013 | Verification findings |
| 095–097 | ARCH-001–ARCH-003 | Architecture-reconciliation gaps |

The table above defines record numbering only; it is not a category or execution order.
