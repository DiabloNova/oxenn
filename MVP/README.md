# OXENN MVP Documentation Hub

**Status:** Canonical navigation index for the owner-approved OXENN MVP  
**Specification date:** 2026-11-12  
**Repository:** DiabloNova/oxenn  
**Authority:** Product scope in the approved MVP Product Specification and the decisions referenced below.

This directory is the consolidated entry point for understanding the full OXENN product portfolio, the exact MVP offer, and the engineering delivery sequence. It separates product definition from implementation status and from execution instructions.

## Start here

1. [Project Map](./architecture_map/project_map.md) — the complete OXENN portfolio, product lines, pillars, saleable services, bundles, shared capabilities, future extensions, customer segments, and boundaries.
2. [MVP Map](./architecture_map/MVP_map.md) — the precise products, services, capabilities, user journeys, and exclusions included in the current MVP.
3. [MVP Baseline](./roadmap_plan/MVP/MVP_baseline.md) — the ordered delivery programme, dependencies, phase gates, shared quality rules, and overall acceptance model.
4. [Stage-by-stage roadmap](./roadmap_plan/MVP/roadmap/README.md) — self-contained execution briefs for every MVP development stage.

## Authority and conflict resolution

Use the following precedence:

1. Owner-approved product scope: [OXENN MVP Product Specification](../docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md).
2. Product portfolio and strategy context: [DOC-18 — Product Strategy v2](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-18).
3. Independent service access: [KNOW-25](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-25).
4. Authenticated access to every service: [KNOW-64](https://app.stele.ai/p/oxenn-59hxc/nodes/KNOW-64).
5. Nine-domain product architecture: [KNOW-22](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-22) and [Product Architecture](../docs/architecture/OXENN_PRODUCT_ARCHITECTURE.md).
6. Repository implementation evidence: [MVP Engineering Baseline](../docs/project/MVP_ENGINEERING_BASELINE.md).

If a roadmap detail conflicts with the approved product specification, the product specification wins. If repository evidence conflicts with an assumption in a roadmap, the implementation agent must stop, document the conflict, and request an owner decision rather than silently changing product scope.

## Important distinctions

- A **customer Offer** is the customer's existing physical product, digital product, or service that OXENN assesses.
- An **OXENN service/SKU** is something the customer selects, buys or activates, and uses (for example, standalone SEO).
- A **bundle** is an optional commercial combination of OXENN services; it is never a prerequisite for a standalone service.
- A **product domain** is an architectural capability area, not automatically a separately sold product or a separate MVP project.
- A **planned** capability is not implemented, verified, or live merely because it appears in these documents.

Every service, including a free service, requires registration and a server-authenticated session. Each service's entitlement and quota are checked separately on the server. Standalone SEO, AEO, or GEO must not require purchase of another service or completion of a comprehensive Product Intelligence Profile.

## Execution boundary

These documents define product scope and an implementation plan. They do not by themselves authorize a code change, database/schema migration, deployment, production operation, pull-request merge, or external customer action. Each stage must be separately scoped and authorized before implementation. Agents must work on the explicitly authorized branch and paths, inspect the current repository state before changing code, and report exact evidence and limitations.

## Status vocabulary

Use PLANNED, IN_PROGRESS, IMPLEMENTED, VERIFIED, LIVE, MOCK, HYBRID, PARTIAL, FAILED, DEPRECATED, and UNKNOWN precisely. IMPLEMENTED is not VERIFIED; VERIFIED is not LIVE; UNKNOWN is not ZERO.
