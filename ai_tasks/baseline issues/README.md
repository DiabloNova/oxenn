# Architecture-Aligned Baseline Remediation Index

**Repository baseline:** `main@7bd2b6ba04e18abbcaf772fac63f29c465a45a42`  
**Architecture baseline:** [OXENN Product Architecture](../../../../docs/architecture/OXENN_PRODUCT_ARCHITECTURE.md)  
**Source findings matrix:** [Architecture Findings Matrix](../new_architecture/architecture-findings-matrix.md)  
**Source audit reports:** parent `ai_tasks/` folder  
**Status:** Remediation specifications prepared; implementation has not started.

## Coverage

- Consolidated problem records: **64**
- Original finding identifiers retained: **94**
- Each consolidated record retains all source IDs and related finding references.
- The original audit reports and source matrix are preserved unchanged.
- A status of NEEDS_REVALIDATION, HISTORICAL_ONLY, or POLICY/SCOPE DECISION is intentional; it is not silently treated as a confirmed defect or as a completed fix.

## Disposition rules

- **PROVISIONAL — REVALIDATE:** static evidence from the audited baseline; recheck the current target branch before implementation.
- **NEEDS_REVALIDATION:** evidence is historical, conditional, or requires a source/runtime cross-check.
- **HISTORICAL_ONLY / DO NOT RUN:** unsafe historical scripts are retained as evidence and must not be executed as general-purpose verification tools.
- **TIME-BOUNDED RISK:** recheck the accepted advisory against the exact release commit by the recorded date.
- **POLICY / SCOPE DECISION:** a product or security policy must be decided before implementation.
- **SCOPE RECORDED / IMPLEMENTATION DEFERRED:** target architecture acknowledges the capability, but it is not an immediate implementation defect or MVP commitment.

## Consolidated records

| # | Original IDs | Original priority | Current disposition | Remediation specification |
|---:|---|---:|---|---|
| 001 | DB-001, DOC-001, DOC-002, SCR-001, SRC-003, TST-002, TST-003, VER-002, VER-003 | P1 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [001-DB-001.md](./001-DB-001.md) |
| 002 | SRC-002, DOC-007, TST-004, VER-004 | P1 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [002-SRC-002.md](./002-SRC-002.md) |
| 003 | SRC-001 | P1 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [003-SRC-001.md](./003-SRC-001.md) |
| 004 | SRC-004 | P1 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [004-SRC-004.md](./004-SRC-004.md) |
| 005 | DOC-005, SRC-005, SRC-006, SRC-007, TST-009 | P1 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [005-DOC-005.md](./005-DOC-005.md) |
| 006 | SRC-009 | P1 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [006-SRC-009.md](./006-SRC-009.md) |
| 007 | DB-004, DOC-004, SRC-015 | P1 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [007-DB-004.md](./007-DB-004.md) |
| 008 | SRC-010 | P1 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [008-SRC-010.md](./008-SRC-010.md) |
| 009 | RF-003, VER-008 | P2 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [009-RF-003.md](./009-RF-003.md) |
| 010 | RF-001, SCR-006 | P2 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [010-RF-001.md](./010-RF-001.md) |
| 011 | VER-001, VER-007, VER-010, VER-011, VER-012 | P2 | NEEDS_REVALIDATION | [011-VER-001.md](./011-VER-001.md) |
| 012 | GHA-001, GHA-002 | P2 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [012-GHA-001.md](./012-GHA-001.md) |
| 013 | SRC-023 | P2 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [013-SRC-023.md](./013-SRC-023.md) |
| 014 | SRC-020 | P2 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [014-SRC-020.md](./014-SRC-020.md) |
| 015 | SRC-013 | P2 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [015-SRC-013.md](./015-SRC-013.md) |
| 016 | RF-004 | P2 | PARTIALLY_VALID | [016-RF-004.md](./016-RF-004.md) |
| 017 | DB-002 | P2 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [017-DB-002.md](./017-DB-002.md) |
| 018 | SCR-002 | P2 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [018-SCR-002.md](./018-SCR-002.md) |
| 019 | RF-002 | P2 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [019-RF-002.md](./019-RF-002.md) |
| 020 | DOC-003 | P2 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [020-DOC-003.md](./020-DOC-003.md) |
| 021 | RF-009 | P2 | NEEDS_REVALIDATION | [021-RF-009.md](./021-RF-009.md) |
| 022 | RF-005 | P2 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [022-RF-005.md](./022-RF-005.md) |
| 023 | TST-007 | P2 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [023-TST-007.md](./023-TST-007.md) |
| 024 | VER-009 | P2 | NEEDS_REVALIDATION | [024-VER-009.md](./024-VER-009.md) |
| 025 | VER-005 | P2 | HISTORICAL_ONLY / DO NOT RUN | [025-VER-005.md](./025-VER-005.md) |
| 026 | VER-006 | P2 | HISTORICAL_ONLY / DO NOT RUN | [026-VER-006.md](./026-VER-006.md) |
| 027 | SRC-012 | P2 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [027-SRC-012.md](./027-SRC-012.md) |
| 028 | SRC-008 | P2 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [028-SRC-008.md](./028-SRC-008.md) |
| 029 | SRC-011 | P2 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [029-SRC-011.md](./029-SRC-011.md) |
| 030 | SRC-014 | P2 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [030-SRC-014.md](./030-SRC-014.md) |
| 031 | SCR-003 | P2 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [031-SCR-003.md](./031-SCR-003.md) |
| 032 | TST-001 | P2 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [032-TST-001.md](./032-TST-001.md) |
| 033 | TST-006 | P2 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [033-TST-006.md](./033-TST-006.md) |
| 034 | TST-005 | P2 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [034-TST-005.md](./034-TST-005.md) |
| 035 | SCR-005 | P2 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [035-SCR-005.md](./035-SCR-005.md) |
| 036 | VER-013 | P2 | TIME-BOUNDED RISK / RECHECK 2026-11-19 | [036-VER-013.md](./036-VER-013.md) |
| 037 | SRC-016 | P2 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [037-SRC-016.md](./037-SRC-016.md) |
| 038 | SRC-017 | P2 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [038-SRC-017.md](./038-SRC-017.md) |
| 039 | RF-007, DOC-006, SRC-024 | P3 | SCOPE RECORDED / IMPLEMENTATION DEFERRED | [039-RF-007.md](./039-RF-007.md) |
| 040 | FNT-001, FNT-002, FNT-004 | P3 | NEEDS EXTERNAL EVIDENCE | [040-FNT-001.md](./040-FNT-001.md) |
| 041 | PUB-001, PUB-006 | P3 | NEEDS REVALIDATION | [041-PUB-001.md](./041-PUB-001.md) |
| 042 | SRC-019, TST-008 | P3 | SCOPE DECISION / DEFERRED | [042-SRC-019.md](./042-SRC-019.md) |
| 043 | DOC-009 | P3 | NEEDS REVALIDATION | [043-DOC-009.md](./043-DOC-009.md) |
| 044 | SRC-022 | P3 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [044-SRC-022.md](./044-SRC-022.md) |
| 045 | PUB-003 | P3 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [045-PUB-003.md](./045-PUB-003.md) |
| 046 | PUB-004 | P3 | NEEDS REVALIDATION | [046-PUB-004.md](./046-PUB-004.md) |
| 047 | PUB-005 | P3 | NEEDS REVALIDATION | [047-PUB-005.md](./047-PUB-005.md) |
| 048 | GHA-003 | P3 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [048-GHA-003.md](./048-GHA-003.md) |
| 049 | GHA-005 | P3 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [049-GHA-005.md](./049-GHA-005.md) |
| 050 | SCR-004 | P3 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [050-SCR-004.md](./050-SCR-004.md) |
| 051 | DB-003 | P3 | PRODUCT POLICY DECISION | [051-DB-003.md](./051-DB-003.md) |
| 052 | GHA-006 | P3 | NEEDS REVALIDATION | [052-GHA-006.md](./052-GHA-006.md) |
| 053 | RF-008 | P3 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [053-RF-008.md](./053-RF-008.md) |
| 054 | SCR-007 | P3 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [054-SCR-007.md](./054-SCR-007.md) |
| 055 | SRC-026 | P3 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [055-SRC-026.md](./055-SRC-026.md) |
| 056 | FNT-003 | P3 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [056-FNT-003.md](./056-FNT-003.md) |
| 057 | GHA-004 | P3 | NEEDS REVALIDATION | [057-GHA-004.md](./057-GHA-004.md) |
| 058 | SRC-018 | P3 | PRODUCT SECURITY POLICY DECISION | [058-SRC-018.md](./058-SRC-018.md) |
| 059 | SRC-025 | P3 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [059-SRC-025.md](./059-SRC-025.md) |
| 060 | SRC-021 | P3 | SCOPE DECISION / DEFERRED | [060-SRC-021.md](./060-SRC-021.md) |
| 061 | PUB-002 | P3 | SCOPE DECISION / DEFERRED | [061-PUB-002.md](./061-PUB-002.md) |
| 062 | DB-005 | P3 | NEEDS REVALIDATION | [062-DB-005.md](./062-DB-005.md) |
| 063 | RF-006 | P3 | PROVISIONAL — REVALIDATE BEFORE IMPLEMENTATION | [063-RF-006.md](./063-RF-006.md) |
| 064 | DOC-008 | P3 | NEEDS REVALIDATION | [064-DOC-008.md](./064-DOC-008.md) |

## Implementation gate

These files are architecture-aligned remediation proposals, not implementation authorization. Before coding, revalidate each finding against the current branch and current runtime evidence, resolve required product/security policy decisions, finalize dependency order, and obtain the user's approval for the implementation scope. No source code, database, CI, dependency, deployment, or production changes are included in this documentation set.
