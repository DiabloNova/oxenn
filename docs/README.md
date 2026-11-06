# Seorchable Documentation Architecture

Welcome to the Seorchable documentation. This documentation accurately reflects the implemented state of the repository, separating currently available capabilities from future plans.

## Documentation Domains

To find what you are looking for, navigate to the documentation domains below:

### 1. [Product Documentation](./product/README.md)
Explains what Seorchable is and what capabilities it provides. Useful for understanding current and planned product capabilities.

### 2. [User Guides](./user-guides/README.md)
Documentation intended for end-users. Covers getting started, workspaces, workflows, running analyses, and interpreting results.

### 3. [Service Documentation](./services/README.md)
Documentation for internal/application services and their boundaries. Details background processing, service dependencies, processing flows, caching, and integrations.

### 4. [API Documentation](./api/README.md)
Documents the application's API surface. Details entry points, request/response contracts, authentication requirements, and rate limiting where implemented.

### 5. [Architecture Documentation](./architecture/README.md)
Technical architecture documentation. Covers system overview, domain boundaries, database architecture (migrations, tenant isolation, RLS), and major design patterns.

### 6. [Security Documentation](./security/README.md)
Documents the security model. Covers authentication, authorization (server-side, PostgreSQL RLS), data access boundaries, and API security.

### 7. [Baseline Plan](./Baseline%20plan/README.md)
The evidence-backed, prioritized register of repository defects, inconsistencies, remediation proposals, dependencies, and per-finding parallelization assessments.

### 8. [Roadmap](./Roadmap/README.md)
The staged product and engineering execution plan, written against the intended post-baseline state and gated on verified completion of the Baseline Plan.

---

Project/product context and historical project records remain under [docs/project](./project/). The Baseline Plan and Roadmap are the authoritative sources for the new repository remediation and forward execution workflow.
