# Product Execution Roadmap — Stage Index

## Planning baseline

This Roadmap is drafted against the intended post-Baseline state. Every source path marked “proposed” or “confirm after baseline” must be checked against the actual code after remediation; no stage assumes that an unimplemented module already exists.

**Execution is blocked** until all accepted findings in `docs/Baseline plan/` are `verified`, a fresh repository-wide audit passes, and Stage RM-00 formally accepts the post-baseline state.

## Short-term — MVP

| Stage | Document | Objective | Prerequisites | Status |
|---|---|---|---|---|
| RM-00 | [Post-Baseline Verification and Product Scope Freeze](./00-post-baseline-release-gate.md) | Re-audit, compare baseline, freeze MVP and open decisions | All Baseline Plan findings verified | proposed / gate |
| RM-01 | [Tenant-Safe Product Domain and Onboarding](./01-tenant-safe-product-foundation.md) | Workspace, product identity, source registry and evidence foundation | RM-00 | proposed |
| RM-02 | [Digital Product Assessment MVP](./02-digital-product-assessment-mvp.md) | Live SEO/digital footprint and explicitly scoped AI visibility assessment | RM-00, RM-01; BL-001/002/004 verified | proposed |
| RM-03 | [Product Value and Competitiveness Assessment MVP](./03-product-value-competitiveness-mvp.md) | Competitor, price, listing, review and customer evidence comparison | RM-00, RM-01; selected pilot vertical | proposed |
| RM-04 | [Shared Improvement Plan and Human-Approved Execution](./04-improvement-planning-and-human-approved-execution.md) | Convert both assessments into an approved, costed plan | RM-02, RM-03 | proposed |
| RM-05 | [Iran Design Partners, Paid Pilot and MVP Release](./05-iran-pilot-and-mvp-release.md) | Validate real customer value, operational cost and willingness to pay | RM-00–RM-04 verified in staging | proposed |

## Long-term — Product and platform expansion

| Stage | Document | Objective | Prerequisites | Status |
|---|---|---|---|---|
| RM-06 | [Geo-Market and Digital Shelf Intelligence](./06-geo-market-and-digital-shelf-intelligence.md) | Geography-aware presence, listings, pricing, stock and distribution signals | RM-05; validated demand | proposed |
| RM-07 | [Product Root-Cause Intelligence and Field Validation](./07-product-root-cause-and-field-validation.md) | Evidence-based diagnosis and physical/operational validation | RM-03, RM-05; expert data access | proposed |
| RM-08 | [Scenario Simulation and ROI Lab](./08-scenario-simulation-and-roi-lab.md) | Compare alternatives, costs, uncertainty, break-even and measured outcomes | RM-04, RM-07 | proposed |
| RM-09 | [Expert Network and Managed Field Execution](./09-expert-network-and-field-execution.md) | Qualified specialists, field services and delivery management | RM-04, RM-07, RM-08 | proposed |
| RM-10 | [Continuous Improvement Loop and Outcome Ledger](./10-continuous-improvement-and-outcome-ledger.md) | Repeat assessment and learn from verified interventions | RM-02–RM-09 | proposed |
| RM-11 | [International Market and Product Expansion](./11-international-expansion.md) | Market-by-market expansion beyond Iran | Proven Iran outcomes and local validation | proposed |

## Product principles shared by every stage

1. Iran is the first market; international expansion is not assumed to be a direct copy of the Iran product.
2. Both digital visibility and physical/operational competitiveness are core product pillars; they must remain separate enough to report honestly and connected enough to create one improvement plan.
3. Every material finding or recommendation must retain evidence, source, time, geography, method, confidence and data class.
4. Distinguish observed, customer-supplied, estimated, hypothesized, simulated and measured-after-intervention information.
5. Mock/demo output never becomes a customer live measurement.
6. AI proposes and explains; deterministic validation controls contracts, scores and state transitions. Qualified humans validate physical product claims.
7. External actions require explicit customer approval, scoped permission, audit history and recovery/compensation where applicable.
8. Start with a modular monolith; add infrastructure only when scale, reliability or team boundaries demonstrate the need.
9. Success is measured by accepted actions and verified customer outcomes—not the number of tools or generated reports.
10. Each stage has its own acceptance criteria, release controls and rollback plan.

## Status lifecycle

`proposed` → `ready` → `in_progress` → `blocked` → `implemented` → `verified` → `released`

A stage may move to `ready` only when its prerequisites are evidenced. A document being written, a build passing or code being merged does not alone establish a stage as implemented or released.

## Change control

Changes to scope, stage order, prerequisites or acceptance criteria must be recorded in this index and the affected stage file. New implementation findings discovered after the Baseline Plan gate must be routed back into Baseline Plan or a release blocker register before continuing.
