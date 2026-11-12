# OXENN Documentation

This documentation describes the OXENN product, its target architecture, user-facing behavior, APIs, services, security boundaries, and the implementation evidence available in the repository.

## Canonical product and MVP authorities

- [MVP Product Specification](./product/OXENN_MVP_PRODUCT_SPECIFICATION.md): current owner-approved product scope and acceptance criteria.
- [MVP Engineering Baseline](./project/MVP_ENGINEERING_BASELINE.md): code-level implementation mapping, known gaps, delivery dependencies, and verification boundaries.
- [Product Architecture](./architecture/OXENN_PRODUCT_ARCHITECTURE.md): the nine-domain product architecture and cross-cutting platform capabilities.
- [Product Documentation Index](./product/README.md): product specifications and related product decisions.
- [MVP Delivery Documentation Hub](../MVP/README.md): complete product map, MVP map, master delivery baseline, and self-contained stage-by-stage roadmap.

The Product Specification is the authority for what OXENN is expected to deliver. The Engineering Baseline is the authority for the inspected repository implementation state. The MVP directory is the navigation and delivery-plan authority for decomposing approved scope into stages. A planned or documented capability must not be described as implemented or live without corresponding code and verification evidence.

## MVP delivery structure

- [Project Map](../MVP/architecture_map/project_map.md): all product lines, pillars, standalone services, optional packages, shared platform capabilities, future extensions, and product boundaries.
- [MVP Map](../MVP/architecture_map/MVP_map.md): only the approved MVP products, services, scope, journeys, requirements and exclusions.
- [MVP Baseline](../MVP/roadmap_plan/MVP/MVP_baseline.md): dependency-ordered programme and cross-stage acceptance gates.
- [Stage Roadmap](../MVP/roadmap_plan/MVP/roadmap/README.md): fifteen standalone stage execution briefs, MVP-00 through MVP-14.

## Documentation domains

1. [Product](./product/README.md) — product definition, MVP scope, target users, and capabilities.
2. [Architecture](./architecture/README.md) — system boundaries, domain architecture, database and service design.
3. [API](./api/README.md) — API entry points, contracts, authentication, and rate limits where implemented.
4. [Security](./security/README.md) — authentication, authorization, tenant isolation, data access, and API security.
5. User and service documentation — user workflows, internal service boundaries, integrations, and operational behavior.
6. [Project records](./project/README.md) — engineering baseline, historical audits, roadmaps, task instructions, and reports.

## Documentation truth rules

- Distinguish product requirements from implemented behavior.
- Distinguish PLANNED, IN_PROGRESS, IMPLEMENTED, VERIFIED, and LIVE.
- Label MOCK, HYBRID, PARTIAL, FAILED, and UNKNOWN states accurately.
- Do not infer live provider connectivity, durable persistence, or deployed security from a page, schema, migration, or passing unit test alone.
