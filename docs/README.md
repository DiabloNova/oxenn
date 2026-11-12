# OXENN Documentation

This documentation describes the OXENN product, its target architecture, user-facing behavior, APIs, services, security boundaries, and the implementation evidence available in the repository.

## Canonical product and MVP authorities

- [MVP Product Specification](./product/OXENN_MVP_PRODUCT_SPECIFICATION.md): current owner-approved product scope and acceptance criteria.
- [MVP Engineering Baseline](./project/MVP_ENGINEERING_BASELINE.md): code-level implementation mapping, known gaps, delivery dependencies, and verification boundaries.
- [Product Architecture](./architecture/OXENN_PRODUCT_ARCHITECTURE.md): the nine-domain product architecture and cross-cutting platform capabilities.
- [Product Documentation Index](./product/README.md): product specifications and related product decisions.

The Product Specification is the authority for what OXENN is expected to deliver. The Engineering Baseline is the authority for the inspected repository implementation state. A planned or documented capability must not be described as implemented or live without corresponding code and verification evidence.

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
