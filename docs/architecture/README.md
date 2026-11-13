# OXENN Architecture Documentation

This section describes the technical architecture of OXENN. It documents the intended architecture and the structures present in the repository; it does not by itself certify production readiness.

## Status dictionary

- **Planned:** target architecture or requirement with no complete implementation evidence.
- **In progress:** implementation exists but the required workflow or boundary is incomplete.
- **Implemented:** repository code exists for the described behavior; verification may still be pending.
- **Verified:** the relevant behavior passed its defined repository or controlled-environment checks.
- **Live:** the production-connected behavior was directly verified.
- **Unknown:** the available evidence is insufficient.

## System overview

OXENN is a TypeScript/Next.js application whose product architecture is organized around nine interconnected domains. PostgreSQL/Drizzle schema and migrations are repository artifacts; they do not prove a connected or migrated production database.

## Core architecture areas

### [Product architecture](./OXENN_PRODUCT_ARCHITECTURE.md)
The nine product domains, service catalog, cross-cutting platform capabilities, execution boundaries, and product/technical principles.

### [Database architecture](./database/README.md)
The canonical Drizzle schema, generated ownership inventory, migration journal, reference matrix, and data contract define the repository database design. Consult [Database Reference Matrix](../database/reference-matrix.md) and [Canonical Data Contract](../database/canonical-data-contract.md) for current per-table metadata. Repository declarations do not prove live database state.

### [Feature architecture](./features/README.md)
Detailed component and service architecture, including AI visibility, acquisition, background processing, and domain models.

### [Dashboard shell](./DASHBOARD_SHELL_ARCHITECTURE.md)
Unified authenticated-dashboard information architecture and shell behavior.

### [Caching and cost control](./CACHING_AND_COST_CONTROL.md)
Caching strategy, resource limits and cost-control guidance.

### [Observability and governance](./OBSERVABILITY_AND_GOVERNANCE.md)
Operational observability, reliability and governance guidance.

### [Security and operations](../security/README.md)
Authentication, authorization, tenant isolation, safe outbound acquisition, observability, reliability, and operational verification.

The canonical transaction-local tenant context is `app.current_tenant_id`; it is set by trusted server-side request context and must not be accepted from caller-controlled identity fields.
