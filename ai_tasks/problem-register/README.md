# Oxenn Problem Register

**97 individual records completed**

**Status:** Individual findings recorded; subject categorization and dependency-based implementation sequence prepared. No code remediation has been started.  
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

## Next gate

The documentation set is ready for review. Implementation may begin only after the user approves the relevant scope and the Wave 0 revalidation/safety gate in the implementation sequence is completed.
