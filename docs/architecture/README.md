# Architecture Documentation

This section describes the technical architecture of Seorchable.

## Status Dictionary
- **Implemented**: Documented architecture accurately reflects the codebase.
- **Planned**: Architectural changes that are proposed but not implemented.

## System Overview

Seorchable is a Next.js application built on a PostgreSQL database utilizing Drizzle ORM. The architecture enforces strict multi-tenant isolation, structured service boundaries, and deterministic background processing.

## Core Architectural Domains

### [Database Architecture](./database/README.md)
The relational database schema and migration layer is powered by Drizzle ORM and Drizzle Kit. The canonical Drizzle schema, ownership verifier, and active migration journal define the repository database contract. Consult the generated [Database Reference Matrix](../database/reference-matrix.md) for current per-table ownership, RLS policy, migration, and runtime-verification metadata, and the [Canonical Data Contract](../database/canonical-data-contract.md) for the governing rules. Do not maintain a separate hard-coded table count here.
- Tenant scoping enforces transaction-local `SET LOCAL app.current_tenant_id = $1` inside active transactions.
- Migrations executed programmatically via `src/core/database/migrator.ts`.

### [Feature Architectures](./features/README.md)
Detailed architectural breakdown of individual system components and domains, migrated from their respective source code locations. Includes AI visibility engines, background event pipelines, CQRS design, and domain models.

### [Caching and Cost Control](./CACHING_AND_COST_CONTROL.md)
Defines caching mechanisms and AI provider cost governance logic.

### [Dashboard Shell](./DASHBOARD_SHELL_ARCHITECTURE.md)
Information architecture, layout configurations, and component logic for the unified authenticated dashboard.

### [Observability and Governance](./OBSERVABILITY_AND_GOVERNANCE.md)
Monitoring, logging, and operational governance mechanisms.
