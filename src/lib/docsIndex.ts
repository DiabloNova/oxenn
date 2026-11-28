// Auto-generated metadata index for navigation and search
export interface DocMeta {
  slug: string;
  titleEn: string;
  titleFa: string;
  category: string;
  categoryFa?: string;
  snippet: string;
}

export const DOCS_INDEX: DocMeta[] = [
  {
    slug: "product",
    titleEn: "OXENN Documentation",
    titleFa: "OXENN Documentation",
    category: "product",
    categoryFa: "Product",
    snippet: `# OXENN Documentation  This documentation describes the OXENN product, its target architecture, user-facing behavior, APIs, services, security boundaries, and the implementation evidence available in the repository.  ## Canonical product and MVP authorities  - [MVP Product Specification](./product/OXENN_MVP_PRODUCT_SPECIFICATION.md): current owner-approved product scope and acceptance criteria. - [MVP Engineering Baseline](./project/MVP_ENGINEERING_BASELINE.md): code-level implementation mapping`
  },
  {
    slug: "api",
    titleEn: "API Documentation",
    titleFa: "API Documentation",
    category: "api",
    categoryFa: "API",
    snippet: `# API Documentation  This section describes the application's API surface.  ## Status Dictionary - **Implemented**: API endpoint is verified and functional. - **Partial**: API endpoint is in development or missing edge case handling. - **Planned**: Endpoint is not currently implemented.  ## Overview  Developer API endpoints under \`src/app/api/v1/\` utilize the \`authorizeApiRequest\` function to securely resolve user and tenant contexts, prioritizing validated server sessions over client-provided r`
  },
  {
    slug: "CACHING_AND_COST_CONTROL",
    titleEn: "Caching & AI Cost Governance Architecture",
    titleFa: "Caching & AI Cost Governance Architecture",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Caching & AI Cost Governance Architecture  This document specifies the technical design, contracts, and security boundaries implemented for application-level caching, request deduplication, and AI cost/budget governance on the **seorchable** platform.  ---  ## 1. Caching Layer Architecture  The platform employs a provider-independent caching hierarchy that isolates business layers from future backend storage adapters (such as Redis or Upstash).  \`\`\` Application / Domain Services           │   `
  },
  {
    slug: "DASHBOARD_SHELL_ARCHITECTURE",
    titleEn: "Seorchable — Dashboard Shell Architecture & Specification",
    titleFa: "Seorchable — Dashboard Shell Architecture & Specification",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Seorchable — Dashboard Shell Architecture & Specification  > **Status — partially superseded (2026-11-16):** The navigation taxonomy, menu hierarchy, account-menu placement, and other owner-controlled dashboard information-architecture decisions in this document are historical. They must not override [the current owner-approved frontend requirements](./FRONTEND_OWNER_REQUIREMENTS_2026-11-16.md). The remaining technical guidance is retained only where it does not conflict with that owner decisi`
  },
  {
    slug: "OBSERVABILITY_AND_GOVERNANCE",
    titleEn: "Observability & Cost Governance Architecture Reference",
    titleFa: "Observability & Cost Governance Architecture Reference",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Observability & Cost Governance Architecture Reference  This document defines the architectural specification, environment configurations, and security/isolation properties established for request-scoped context propagation, trace sampling, decoupled latency metrics, and AI cost warning thresholds on the **seorchable** platform.  ---  ## 1. Request Context & Async Context Propagation  For advanced request-scoped context tracing without manually prop-drilling identifiers through business servic`
  },
  {
    slug: "OXENN_PRODUCT_ARCHITECTURE",
    titleEn: "OXENN Product Architecture — Architecture-Aligned Remediation Baseline",
    titleFa: "OXENN Product Architecture — Architecture-Aligned Remediation Baseline",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# OXENN Product Architecture — Architecture-Aligned Remediation Baseline  **Product:** OXENN   **Product identity:** OXENN   **Status:** Approved working architecture baseline for repository remediation   **Revision date:** 2026-11-07   **Source architecture:** \`DiabloNova/oxenn_documents/product_architecture.md\` (main)   **Repository baseline:** \`DiabloNova/oxenn\` main at \`7bd2b6ba04e18abbcaf772fac63f29c465a45a42\`   **Scope:** Product, commercial, application, intelligence, data, execution, sec`
  },
  {
    slug: "architecture",
    titleEn: "OXENN Architecture Documentation",
    titleFa: "OXENN Architecture Documentation",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# OXENN Architecture Documentation  This section describes the technical architecture of OXENN. It documents the intended architecture and the structures present in the repository; it does not by itself certify production readiness.  ## Status dictionary  - **Planned:** target architecture or requirement with no complete implementation evidence. - **In progress:** implementation exists but the required workflow or boundary is incomplete. - **Implemented:** repository code exists for the describe`
  },
  {
    slug: "SITEMAP_AND_ROUTE_SPECIFICATION",
    titleEn: "Seorchable — Sitemap, Route Architecture & Legacy Redirect Specification",
    titleFa: "Seorchable — Sitemap, Route Architecture & Legacy Redirect Specification",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Seorchable — Sitemap, Route Architecture & Legacy Redirect Specification  **Execution Phase:** Phase 1 — Target Product Architecture **Task ID:** 1.1 **Execution Agent:** Jules **Document Version:** 1.0.0 **Date:** August 2026 **Status:** Authoritative Specification (Read-Only Planning Blueprint)  ---  ## 1. Executive Summary  This document establishes the canonical sitemap, route architecture, and redirect policy for the **Seorchable** SaaS platform. It acts as the single source of truth for `
  },
  {
    slug: "architecture",
    titleEn: "Database Architecture",
    titleFa: "Database Architecture",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Database Architecture  This directory contains technical specifications and decisions regarding the PostgreSQL persistence layer.  ## Available Documents - [Migration Strategy](./migration-strategy.md) - [Reconciliation Report](./reconciliation-report.md) - [Tenant Context Spec](./tenant-context-spec.md) `
  },
  {
    slug: "migration-strategy",
    titleEn: "Relational Database Migration Strategy",
    titleFa: "Relational Database Migration Strategy",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Relational Database Migration Strategy  This specification details the canonical schema modeling, migration execution, and deployment strategy for the AI Visibility Intelligence relational schema.  ---  ## 1. Migration Tech Stack  We utilize **Drizzle ORM** paired with **Drizzle Kit** for schema modeling, SQL generation, schema diffing, and programmatic migration execution.  \`\`\`  [Canonical Drizzle Schema] (database/schema/index.ts)          │          ▼  (pnpm run db:generate / drizzle-kit ge`
  },
  {
    slug: "query-telemetry",
    titleEn: "Privacy-safe database query telemetry",
    titleFa: "Privacy-safe database query telemetry",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Privacy-safe database query telemetry  Oxenn's PostgreSQL client can emit structured query and pool-acquisition telemetry without logging SQL text, bind parameters, connection strings, tenant IDs, or error messages. Telemetry is disabled by default.  ## Enablement  Set \`DATABASE_QUERY_TELEMETRY_ENABLED=true\` only in an environment whose log retention and access controls have been reviewed. The \`.env.example\` default is \`false\`. Disabling the flag stops telemetry emission while leaving query ex`
  },
  {
    slug: "reconciliation-report",
    titleEn: "Database Reconciliation Report & Implementation Plan",
    titleFa: "Database Reconciliation Report & Implementation Plan",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Database Reconciliation Report & Implementation Plan  **Date:** August 2024 **Scope:** Reconstruct Database Source of Truth, Drizzle ORM Canonical Schema, and Migration Pipeline   > **HISTORICAL SNAPSHOT — NOT THE CURRENT RLS CONTRACT** > This report records the repository state and Drizzle snapshot reviewed in August 2024. Its 51/19 policy split and table classifications below are retained as historical evidence only and are superseded by the current [Canonical Data Contract](../../database/canonical-data-contract.md)`
  },
  {
    slug: "tenant-context-spec",
    titleEn: "PostgreSQL Row Level Security (RLS) & Tenant Context Specification",
    titleFa: "PostgreSQL Row Level Security (RLS) & Tenant Context Specification",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# PostgreSQL Row Level Security (RLS) & Tenant Context Specification  This document details the architecture, configuration, and security guarantees achieved by implementing PostgreSQL Row Level Security (RLS) for tenant isolation across the application database schema.  ---  ## 1. Architectural Overview  To ensure zero-trust tenant isolation, the database layer implements real PostgreSQL Row Level Security. Every database table owned by a tenant contains a tenant partition identifier (\`organiza`
  },
  {
    slug: "ADMIN_ARCHITECTURE",
    titleEn: "Admin Module Architectural Blueprint",
    titleFa: "Admin Module Architectural Blueprint",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Admin Module Architectural Blueprint  This document details the software architecture of the **Enterprise Administrative Bounded Context** of the AI Visibility Intelligence Platform SaaS.  ## Bounded Context & Isolation Invariant  The Admin module is designed as a completely independent bounded context under \`src/features/admin/\`. It maintains 100% decoupling from customer-facing tenant workspaces, except through explicitly published domain interfaces and shared schemas.  \`\`\` ┌────────────────`
  },
  {
    slug: "AI_CITATION_INTELLIGENCE_ARCHITECTURE",
    titleEn: "AI Citation Intelligence Architecture",
    titleFa: "AI Citation Intelligence Architecture",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# AI Citation Intelligence Architecture  This document specifies the technical design, entity-relationship structures, classification rules, quality evaluation algorithms, and trend telemetry metrics implemented by the **AI Citation Intelligence Layer** (Task 5.2).  ---  ## 1. Citation Occurrence vs. Citation Source  To prevent historical overwrites and compile precise temporal metrics, the architecture maintains a strict separation between individual occurrences and their unique normalized sour`
  },
  {
    slug: "AI_PIPELINE_ARCHITECTURE",
    titleEn: "AI Processing Pipeline Architecture",
    titleFa: "AI Processing Pipeline Architecture",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# AI Processing Pipeline Architecture  This document describes the processing boundaries for extraction, canonical resolution, and evidence promotion.  ## 1. Pipeline stages  1. **Extraction:** configured model providers extract candidate entities and relationships from source text. 2. **Evidence persistence:** \`kg_entities\` and \`kg_relationships\` retain extracted observations and source-chunk provenance under the active tenant. 3. **Canonical resolution:** trimmed, case-insensitive exact-name p`
  },
  {
    slug: "AI_PROMPT_INTELLIGENCE_ARCHITECTURE",
    titleEn: "AI Prompt Intelligence Architecture",
    titleFa: "AI Prompt Intelligence Architecture",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# AI Prompt Intelligence Architecture  This document specifies the technical design, state transitions, variable rendering, and competitor position analysis implemented by the **AI Prompt Intelligence Layer** (Task 5.1).  ---  ## 1. Core Architecture & Alignment  The Prompt Intelligence Layer extends Task 5.0 (AI Visibility Core) to provide persistent, multi-tenant isolated prompt parameterization, execution, cron-scheduling, and side-by-side model comparison.  The data pipeline operates as foll`
  },
  {
    slug: "AI_VISIBILITY_ENGINE_ARCHITECTURE",
    titleEn: "AI Visibility Engine Architecture",
    titleFa: "AI Visibility Engine Architecture",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# AI Visibility Engine Architecture  This document specifies the technical architecture, domain models, and scoring equations of the production-grade **AI Visibility Audit Engine** (Task 5.0).  ---  ## 1. Core Distinctions  A key architectural design principle is the strict separation of conversational retrieval indicators. We explicitly differentiate between these five concepts:  1. **Mention:** The simple lexical presence of a brand's name, localized spellings, or aliases within the text block`
  },
  {
    slug: "APPLICATION_LAYER",
    titleEn: "Application Layer Design Specification",
    titleFa: "Application Layer Design Specification",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Application Layer Design Specification  This document outlines the design and responsibilities of the Application Layer inside the AI Visibility Intelligence Engine.  ---  ## 1. Architectural Role  The Application Layer is the orchestrator of use-cases. It sits directly between the API entry boundary and the Domain Layer, enforcing: - **No Domain Leakage**: Raw Domain Entities never cross the API threshold. They are mapped into strongly-typed Data Transfer Objects (DTOs) prior to leaving the b`
  },
  {
    slug: "ARCHITECTURE",
    titleEn: "Clean & Multi-Tenant Architecture Specification",
    titleFa: "Clean & Multi-Tenant Architecture Specification",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Clean & Multi-Tenant Architecture Specification  This document details the modular layout and patterns implemented under **Phase 7C.1** to support infinite horizontal scaling and future-proof enterprise security.  ---  ## 1. Enterprise Layered Architecture  The module is structured into distinct, decoupled boundaries following the Clean Architecture pattern:  \`\`\`   ┌────────────────────────────────────────────────────────┐   │                   Application / UI Layer               │   │       `
  },
  {
    slug: "AUDIT_DESIGN",
    titleEn: "Immutable Administrative Audit Trail",
    titleFa: "Immutable Administrative Audit Trail",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Immutable Administrative Audit Trail  This document details the system design of the immutable audit logging module within the administrative context.  ## Audit Record Schema  Each record captured by the audit tracker contains:  - \`id\`: Globally unique UUID trace identifier. - \`timestamp\`: ISO-8601 server timestamp. - \`actorId\` & \`actorEmail\`: Unambiguous identity of the acting administrator. - \`actorRole\`: Role context of the administrator. - \`action\`: Specific state change string (e.g., \`TEN`
  },
  {
    slug: "CQRS_DESIGN",
    titleEn: "Command Query Responsibility Segregation (CQRS) Design",
    titleFa: "Command Query Responsibility Segregation (CQRS) Design",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Command Query Responsibility Segregation (CQRS) Design  This document details the CQRS design pattern used to separate writes (State Mutation) from reads (State Materialization).  ---  ## 1. Segregation Concept  To scale search visibility ingestion separately from rich analytics dashboards, we divide use-cases into:  1. **Commands (Write Store)**:    - Optimized for safety, constraints, and relational consistency.    - Triggers state shifts and emits events.    - Executed via \`ApplicationComma`
  },
  {
    slug: "CRAWL_ACQUISITION",
    titleEn: "Crawl acquisition",
    titleFa: "Crawl acquisition",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Crawl acquisition  The acquisition feature separates request validation, durable scheduling, and provider execution. A request is normalized, policy-checked, and SSRF validated before a job is created or a provider is selected. The internal provider uses the pinned-DNS \`safeFetch\` client and performs bounded, non-browser HTML traversal. The Firecrawl adapter is isolated under \`infrastructure/providers/firecrawl/\`; Firecrawl SDK types do not cross into the domain.  ## Domain and providers  \`Cra`
  },
  {
    slug: "DATA_FLOW",
    titleEn: "Data Flow & Pipelines",
    titleFa: "Data Flow & Pipelines",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Data Flow & Pipelines  This document maps the sequential lifecycles and pipelines of the AI Visibility Intelligence Engine.  ---  ## 1. AI Observation Ingestion Lifecycle  This pipeline details how incoming LLM query captures flow into calculated analytics and triggers autonomous recovery actions.  \`\`\`  [AI Agent Engine]         │ Executes Search Query         ▼  [Raw JSON Payload]         │         ▼  [ObservationService.processObservation()]         │         ├─► 1. Save Raw Observation     `
  },
  {
    slug: "DEPENDENCY_INJECTION",
    titleEn: "Dependency Injection and IoC Container",
    titleFa: "Dependency Injection and IoC Container",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Dependency Injection and IoC Container  This document outlines the design of our lightweight Inversion of Control (IoC) dependency container.  ## Container Design  The \`DependencyContainer\` class acts as the centralized registry for all infrastructure and application services.  \`\`\`typescript import { container } from "@/core/container";  // Resolve Postgres Repository const tenantRepo = container.resolve<ITenantRepository>("TenantRepository");  // Resolve Client gateway const apiClient = conta`
  },
  {
    slug: "DOMAIN_MODEL",
    titleEn: "Domain Model Design Specification",
    titleFa: "Domain Model Design Specification",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Domain Model Design Specification  This document details the Domain-Driven Design (DDD) model established for the **AI Visibility Intelligence Engine (Phase 7C.1)**.  ---  ## 1. Domain Architectural Paradigms  This domain operates on strict **Domain-Driven Design (DDD)** principles to separate technical details (database, controllers, API) from the underlying core business rules of Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO).  \`\`\`    ┌─────────────────────────────`
  },
  {
    slug: "EVENT_ARCHITECTURE",
    titleEn: "Event-Driven Architecture (EDA) Blueprint",
    titleFa: "Event-Driven Architecture (EDA) Blueprint",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Event-Driven Architecture (EDA) Blueprint  This specification details our distributed, asynchronous messaging design built on eventual consistency and correlation trace headers.  ---  ## 1. Tracing & Context Propagation  Every Domain Event published contains a mandatory, structured \`metadata\` block carrying trace properties:  - **eventId**: A unique identifier for auditability and deduplication. - **organizationId**: Strict tenant partition key, ensuring events are routed to proper tenant stre`
  },
  {
    slug: "EVENT_PIPELINE",
    titleEn: "Domain and Audit Event Pipelines",
    titleFa: "Domain and Audit Event Pipelines",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Domain and Audit Event Pipelines  This document details the system design of the asynchronous Event pipeline and immutable Audit trail.  ## Dual Event Dispatch  Every administrative action triggers two distinct pipeline streams:  1. **Domain Events**: Dispatched asynchronously to eventual-consistency consumers (e.g., triggering crawler processes or email schedules).    - \`TenantCreatedEvent\`    - \`TenantSuspendedEvent\`    - \`AdminUserCreatedEvent\`    - \`FeatureFlagChangedEvent\`    - \`AIProvide`
  },
  {
    slug: "FUTURE_EVOLUTION",
    titleEn: "Future Platform Evolution Guidelines",
    titleFa: "Future Platform Evolution Guidelines",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Future Platform Evolution Guidelines  This document outlines the clear technical roadmap for integrating Drizzle ORM, orchestrating background processing agents, and scaling to billions of daily tracked queries.  ---  ## 1. Drizzle ORM Schema Integration  To implement production SQL persistence, follow these steps to link the database schemas:  1. **Schema Translation**: Map the schemas defined in \`database/schema/*.ts\` into Drizzle syntax.    Example \`database/schema/brand.ts\`:    \`\`\`typescri`
  },
  {
    slug: "INFRASTRUCTURE_ARCHITECTURE",
    titleEn: "Infrastructure and Services Architecture",
    titleFa: "Infrastructure and Services Architecture",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Infrastructure and Services Architecture  This document describes the **SaaS Platform Operations Infrastructure Architecture**, connecting domain entities to PostgreSQL repositories, in-memory caching, and event-driven backbones.  ## Architectural Layout  \`\`\`                         ┌──────────────────────────────────┐                         │       CQRS Handlers / API        │                         └────────────────┬─────────────────┘                                          │             `
  },
  {
    slug: "KNOWLEDGE_GRAPH_DESIGN",
    titleEn: "Semantic Knowledge Graph Architecture Design",
    titleFa: "Semantic Knowledge Graph Architecture Design",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Semantic Knowledge Graph Architecture Design  This document defines the authoritative domain graph and the extracted evidence graph. They are related through an explicit, tenant-scoped resolution contract; they are not interchangeable stores.  ## 1. Source of truth and graph boundaries  - **Canonical domain graph — \`entities\` and \`entity_relationships\`:** the authoritative identity and relationship model owned by an Organization. Domain services and user-facing graph queries read this model. -`
  },
  {
    slug: "OPERATION_SCOPE_MAPPING",
    titleEn: "Project Operation and Optimization Scope Mapping",
    titleFa: "Project Operation and Optimization Scope Mapping",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Project Operation and Optimization Scope Mapping  **Status:** Stage 3 inventory and domain mapping — documented; runtime linkage is not implemented or verified.   **Baseline:** \`main\` at \`4105d7af7371fcd7dd70e85a08991af883181332\`; this branch contains the Stage 3 documentation commits and no application-code divergence from that baseline.   **Related contract:** [Optimization Scope and Operation Run Contract](./OPTIMIZATION_SCOPE_CONTRACT.md)   **Authority:** DOC-99 Stage 3 / TASK-106 owner-ap`
  },
  {
    slug: "OPTIMIZATION_SCOPE_CONTRACT",
    titleEn: "Optimization Scope and Operation Run Contract",
    titleFa: "Optimization Scope and Operation Run Contract",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Optimization Scope and Operation Run Contract  **Status:** Stage 3 domain contract — defined; persistence and runtime enforcement are not yet implemented. **Applies to:** Project-scoped operations in the Workspace database. **Canonical Project model:** \`websites\` (one managed website/domain per Project). **Tenant root:** \`organizations\` (Workspace).  This contract defines how an operation identifies the Project it acts on and the exact subset of that Project it is allowed to process. It is a d`
  },
  {
    slug: "PERSISTENCE_MODEL",
    titleEn: "Relational Database Persistence Model",
    titleFa: "Relational Database Persistence Model",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Relational Database Persistence Model  This document details the PostgreSQL table structures, query optimizations, soft deletion strategy, and optimistic concurrency locks.  ## UUID Entity Persistence  Every record persisted across the administrative subsystem uses globally unique UUID primary keys.  ## Optimistic Concurrency Control  Optimistic Locking is enforced on all state updates to prevent concurrency conflicts or racing administrative commands:  - Each table (e.g., \`brands\`, \`feature_flags\`,`
  },
  {
    slug: "PLATFORM_MONITORING",
    titleEn: "Platform Monitoring and Telemetry Design",
    titleFa: "Platform Monitoring and Telemetry Design",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Platform Monitoring and Telemetry Design  This document describes how our system tracks operational health, background worker status, and external AI adapters.  ## Health Probes  The \`SystemOperationsConsole\` runs real-time diagnostic checks across four core infrastructural vectors:  1. **Transactional DB Latency**: Check connection pool response times. 2. **Redis Message Queue**: Evaluate backlog and processing queue sizes. 3. **ElasticSearch Indexes**: Check hybrid and full-text search avail`
  },
  {
    slug: "architecture",
    titleEn: "Feature Architectures",
    titleFa: "Feature Architectures",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Feature Architectures  This directory contains architectural documentation specific to feature domains and services, originally co-located with the source code.  These documents outline domain models, service boundaries, event pipelines, and AI intelligence pipeline structures.  ## Cross-cutting domain contracts  - [Optimization Scope and Operation Run Contract](./OPTIMIZATION_SCOPE_CONTRACT.md) — Stage 3 contract for Project-scoped operation runs, whole-website/single-page/selected-pages targ`
  },
  {
    slug: "SERVICE_BOUNDARIES",
    titleEn: "Service Boundaries & Use Cases",
    titleFa: "Service Boundaries & Use Cases",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Service Boundaries & Use Cases  This document describes the clear responsibilities, inputs, and outputs of the service layer interfaces.  ---  ## 1. Boundary Matrix  Every Service has a singular, unified domain of responsibility. Cross-domain actions are handled through composition or event-driven listeners.  | Service Name | Primary Boundary | Dependencies | Key Use Cases | | :--- | :--- | :--- | :--- | | **ObservationService** | AI response ingestion & prompt tracking | \`IObservationReposito`
  },
  {
    slug: "TENANT_OPERATIONS",
    titleEn: "Tenant Operations Guide",
    titleFa: "Tenant Operations Guide",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Tenant Operations Guide  This document describes the administrative operations supporting multi-tenant lifecycle states, limits, and quotas.  ## Lifecycle States  - **Active**: The tenant runs normal crawl jobs, executes prompts, and accesses standard features. - **Suspended**: The tenant cannot process new crawl jobs or access features, but their database schemas and configurations are kept intact. - **Archived**: The tenant is soft-deleted, removing active schedules and preparing records for`
  },
  {
    slug: "canonical-data-contract",
    titleEn: "Canonical Data Contract",
    titleFa: "Canonical Data Contract",
    category: "database",
    categoryFa: "Database",
    snippet: `# Canonical Data Contract  ## Architecture & Governance  The Oxenn database is defined strictly through **Drizzle ORM**. There is exactly one canonical representation of the application schema: the Drizzle declarations located in \`database/schema/index.ts\`. Physical database behavior is realized by the migration history, including SQL-only operations such as enabling and forcing row-level security (RLS). Schema changes should originate in the declarations; migration files remain the record of ho`
  },
  {
    slug: "reference-matrix",
    titleEn: "Database Reference Matrix",
    titleFa: "Database Reference Matrix",
    category: "database",
    categoryFa: "Database",
    snippet: `# Database Reference Matrix ## Table: \`admin_users\` - **Ownership Scope:** WORKSPACE_GLOBAL - **RLS Policies Declared:** None - **Tenant RLS Policy Coverage:** Not applicable (WORKSPACE_GLOBAL) - **Migration Coverage:** Not applicable (WORKSPACE_GLOBAL) - **Runtime Enforcement Verification:** Not applicable (WORKSPACE_GLOBAL) - **Status:** \`WIRED\` ## Table: \`aeo_analyses\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`ai_engines\` - **Ownership Scope:** GLOBAL_SHARED - **RLS Policies Declared:** None - **Tenant RLS Policy Coverage:** Not applicable (GLOBAL_SHARED) - **Migration Coverage:** Not applicable (GLOBAL_SHARED) - **Runtime Enforcement Verification:** Not applicable (GLOBAL_SHARED) - **Status:** \`ORPHAN-TABLE\` (LEGACY-CANDIDATE) ## Table: \`ai_observations\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`ORPHAN-TABLE\` (LEGACY-CANDIDATE) ## Table: \`ai_provider_configs\` - **Ownership Scope:** PLATFORM_OWNED - **RLS Policies Declared:** None - **Tenant RLS Policy Coverage:** Not applicable (PLATFORM_OWNED) - **Migration Coverage:** Not applicable (PLATFORM_OWNED) - **Runtime Enforcement Verification:** Not applicable (PLATFORM_OWNED) - **Status:** \`WIRED\` ## Table: \`ai_visibility_audits\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`api_keys\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`audit_prompts\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`audit_records\` - **Ownership Scope:** WORKSPACE_GLOBAL - **RLS Policies Declared:** None - **Tenant RLS Policy Coverage:** Not applicable (WORKSPACE_GLOBAL) - **Migration Coverage:** Not applicable (WORKSPACE_GLOBAL) - **Runtime Enforcement Verification:** Not applicable (WORKSPACE_GLOBAL) - **Status:** \`WIRED\` ## Table: \`auth_rate_limits\` - **Ownership Scope:** PLATFORM_OWNED - **RLS Policies Declared:** None - **Tenant RLS Policy Coverage:** Not applicable (PLATFORM_OWNED) - **Migration Coverage:** Not applicable (PLATFORM_OWNED) - **Runtime Enforcement Verification:** Not applicable (PLATFORM_OWNED) - **Status:** \`WIRED\` ## Table: \`brand_associations\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`brand_entity_associations\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`brand_mentions\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`ORPHAN-TABLE\` (LEGACY-CANDIDATE) ## Table: \`brands\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`citation_occurrences\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`citation_sources\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`citations\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`ORPHAN-TABLE\` (LEGACY-CANDIDATE) ## Table: \`competitive_analyses\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`competitive_seo_findings\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`competitor_changes\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`competitors\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`crawl_cache\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`crawl_jobs\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`crawl_results\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`crawl_snapshots\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`credit_transactions\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`diagnostic_finding_relationships\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`diagnostic_findings\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`document_embeddings\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`email_verification_tokens\` - **Ownership Scope:** USER_OWNED - **RLS Policies Declared:** None - **Tenant RLS Policy Coverage:** Not applicable (USER_OWNED) - **Migration Coverage:** Not applicable (USER_OWNED) - **Runtime Enforcement Verification:** Not applicable (USER_OWNED) - **Status:** \`WIRED\` ## Table: \`entities\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`entity_relationships\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`faq_opportunities\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`feature_flags\` - **Ownership Scope:** PLATFORM_OWNED - **RLS Policies Declared:** None - **Tenant RLS Policy Coverage:** Not applicable (PLATFORM_OWNED) - **Migration Coverage:** Not applicable (PLATFORM_OWNED) - **Runtime Enforcement Verification:** Not applicable (PLATFORM_OWNED) - **Status:** \`WIRED\` ## Table: \`historical_metrics\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`keywords\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`keywords_topics\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`kg_alignments\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`kg_entities\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`kg_relationships\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`monitoring_alerts\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`monitoring_configs\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`organization_invitations\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`organization_members\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`organizations\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`pages\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`pages_entities\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`pages_keywords\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`pages_topics\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`password_reset_tokens\` - **Ownership Scope:** USER_OWNED - **RLS Policies Declared:** None - **Tenant RLS Policy Coverage:** Not applicable (USER_OWNED) - **Migration Coverage:** Not applicable (USER_OWNED) - **Runtime Enforcement Verification:** Not applicable (USER_OWNED) - **Status:** \`WIRED\` ## Table: \`permissions\` - **Ownership Scope:** WORKSPACE_GLOBAL - **RLS Policies Declared:** None - **Tenant RLS Policy Coverage:** Not applicable (WORKSPACE_GLOBAL) - **Migration Coverage:** Not applicable (WORKSPACE_GLOBAL) - **Runtime Enforcement Verification:** Not applicable (WORKSPACE_GLOBAL) - **Status:** \`ORPHAN-TABLE\` (LEGACY-CANDIDATE) ## Table: \`position_observations\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`premium_audits\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`prompt_definitions\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`prompt_executions\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`prompt_schedules\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`prompts\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`ORPHAN-TABLE\` (LEGACY-CANDIDATE) ## Table: \`recommendation_observations\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`recommendations\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`ORPHAN-TABLE\` (LEGACY-CANDIDATE) ## Table: \`roles\` - **Ownership Scope:** WORKSPACE_GLOBAL - **RLS Policies Declared:** None - **Tenant RLS Policy Coverage:** Not applicable (WORKSPACE_GLOBAL) - **Migration Coverage:** Not applicable (WORKSPACE_GLOBAL) - **Runtime Enforcement Verification:** Not applicable (WORKSPACE_GLOBAL) - **Status:** \`ORPHAN-TABLE\` (LEGACY-CANDIDATE) ## Table: \`sessions\` - **Ownership Scope:** USER_OWNED - **RLS Policies Declared:** None - **Tenant RLS Policy Coverage:** Not applicable (USER_OWNED) - **Migration Coverage:** Not applicable (USER_OWNED) - **Runtime Enforcement Verification:** Not applicable (USER_OWNED) - **Status:** \`WIRED\` ## Table: \`system_configurations\` - **Ownership Scope:** UNRESOLVED - **RLS Policies Declared:** None - **Tenant RLS Policy Coverage:** Not evaluated (ownership unresolved) - **Migration Coverage:** Not evaluated (ownership unresolved) - **Runtime Enforcement Verification:** Blocked: ownership unresolved; no Global/tenant inference - **Status:** \`ORPHAN-TABLE\` (LEGACY-CANDIDATE) ## Table: \`technical_audits\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`tenant_quotas\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`tenant_subscriptions\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`topics\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`topics_entities\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Table: \`user_credentials\` - **Ownership Scope:** USER_OWNED - **RLS Policies Declared:** None - **Tenant RLS Policy Coverage:** Not applicable (USER_OWNED) - **Migration Coverage:** Not applicable (USER_OWNED) - **Runtime Enforcement Verification:** Not applicable (USER_OWNED) - **Status:** \`WIRED\` ## Table: \`user_profiles\` - **Ownership Scope:** USER_OWNED - **RLS Policies Declared:** None - **Tenant RLS Policy Coverage:** Not applicable (USER_OWNED) - **Migration Coverage:** Not applicable (USER_OWNED) - **Runtime Enforcement Verification:** Not applicable (USER_OWNED) - **Status:** \`WIRED\` ## Table: \`users\` - **Ownership Scope:** USER_OWNED - **RLS Policies Declared:** None - **Tenant RLS Policy Coverage:** Not applicable (USER_OWNED) - **Migration Coverage:** Not applicable (USER_OWNED) - **Runtime Enforcement Verification:** Not applicable (USER_OWNED) - **Status:** \`WIRED\` ## Table: \`visibility_scores\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`ORPHAN-TABLE\` (LEGACY-CANDIDATE) ## Table: \`websites\` - **Ownership Scope:** ORGANIZATION_SCOPED - **RLS Policies Declared:** 4 policy objects - **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE) - **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal) - **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite - **Status:** \`WIRED\` ## Summary - Total Tables: 72 - WIRED Tables: 62 - ORPHAN-TABLE (LEGACY-CANDIDATE) Tables: 10`
  },
  {
    slug: "table-ownership-registry",
    titleEn: "Canonical Table Ownership Registry",
    titleFa: "Canonical Table Ownership Registry",
    category: "database",
    categoryFa: "Database",
    snippet: `# Canonical Table Ownership Registry  **Status:** SCR-001 Stage 2   **Workspace source:** database/schema/index.ts and its canonical modular schema sources, including database/schema/users.ts, database/schema/organization-table.ts, database/schema/api-keys.ts, and database/schema/user-profile.ts. The canonical barrel re-exports every table; Drizzle configuration consumes the barrel only.   **Platform Admin source:** database/platform-admin/schema/index.ts  ## Purpose and authority  scripts/database/table-ownership-registry.ts`
  },
  {
    slug: "OXENN_MVP_PRODUCT_SPECIFICATION",
    titleEn: "OXENN — MVP Product Specification",
    titleFa: "OXENN — MVP Product Specification",
    category: "product",
    categoryFa: "Product",
    snippet: `# OXENN — MVP Product Specification  **Document status:** Owner-approved product scope   **Specification version:** 1.0   **Effective date:** 2026-11-12   **Product:** OXENN — Product & Market Improvement Intelligence Platform   **Repository:** \`DiabloNova/oxenn\`   **Authority:** Owner approval recorded in Stele \`KNOW-66\`, together with the independent-service decision \`KNOW-25\` (version 2), authenticated-access decision \`KNOW-64\`, and the product-to-engineering mapping in \`DOC-67\` (version 4). `
  },
  {
    slug: "product",
    titleEn: "OXENN Product Documentation",
    titleFa: "OXENN Product Documentation",
    category: "product",
    categoryFa: "Product",
    snippet: `# OXENN Product Documentation  This directory contains the canonical product-level requirements and product decision references.  ## Current product authority  - [OXENN MVP Product Specification](./OXENN_MVP_PRODUCT_SPECIFICATION.md) — owner-approved product definition, target customers, Offer model, independent services, user journey, evidence policy, MVP boundaries, and acceptance criteria FR-01–FR-11. - [OXENN Product Architecture](../architecture/OXENN_PRODUCT_ARCHITECTURE.md) — nine product`
  },
  {
    slug: "PHASE-01-PRODUCT-DESIGN-AUDIT",
    titleEn: "Phase 01 — Product and Design Audit",
    titleFa: "Phase 01 — Product and Design Audit",
    category: "redesign",
    categoryFa: "redesign",
    snippet: `# Phase 01 — Product and Design Audit  **Project:** Oxenn / اوژن   **Repository:** https://github.com/DiabloNova/oxenn   **Baseline branch:** \`main\`   **Execution branch:** \`redesign/oxenn-world-class-experience\`   **Audit date:** 2026-10-29   **Status:** Repository/source inspection completed for the first audit pass. Route-by-route reconciliation and executable baseline checks remain open.  ## 1. Scope and method  This audit checks the existing repository entry points, shared styles, locale/theme/navigation`
  },
  {
    slug: "PHASE-01-STYLEGUIDE-AND-CODEBASE-AUDIT",
    titleEn: "Phase 01 — Existing Product & Design-System Audit",
    titleFa: "Phase 01 — Existing Product & Design-System Audit",
    category: "redesign",
    categoryFa: "redesign",
    snippet: `# Phase 01 — Existing Product & Design-System Audit  **Product:** Oxenn / Seorchable   **Repository:** DiabloNova/oxenn   **Branch:** \`redesign/oxenn-world-class-experience\`   **Audit scope:** Existing homepage, shared navigation, theme/locale provider, typography configuration, tokens, marketing components, and the supplied Product UI Styleguide image.   **Status:** Source inspection completed for the files listed below. No production UI code was changed in this phase.  ## 1. Design brief groun`
  },
  {
    slug: "PHASE-02-CREATIVE-DIRECTION",
    titleEn: "Phase 02 — Creative Concept and Design Direction",
    titleFa: "Phase 02 — Creative Concept and Design Direction",
    category: "redesign",
    categoryFa: "redesign",
    snippet: `# Phase 02 — Creative Concept and Design Direction  **Concept name:** Signal Atlas — Oxenn's Living Digital Twin   **Design thesis:** Turn fragmented search and AI visibility signals into a clear model of where a brand stands, what is missing, and what to do next.   **Reference concept:** The generated Oxenn homepage image shared in the project conversation (1536 × 1024). It is an art-direction reference, not a production screenshot or proof of shipped functionality.  ## 1. Brand principles  1. `
  },
  {
    slug: "CSP_REPORTING",
    titleEn: "CSP Report-Only Discovery",
    titleFa: "CSP Report-Only Discovery",
    category: "security",
    categoryFa: "Security",
    snippet: `# CSP Report-Only Discovery  ## Scope  Content Security Policy reporting is enabled only for requests that execute in the Vercel \`preview\` environment. Production and local development receive no CSP reporting headers. No enforcing \`Content-Security-Policy\` header is introduced.  The Preview policy is a deliberately narrow discovery baseline. It permits same-origin resources, plus data/blob URLs for images, data URLs for fonts, and blob workers. It does not grant wildcard hosts or unsafe inline/eval`
  },
  {
    slug: "PLATFORM_ADMIN_AUTHENTICATION",
    titleEn: "Platform Admin Authentication and Persistence Boundary",
    titleFa: "Platform Admin Authentication and Persistence Boundary",
    category: "security",
    categoryFa: "Security",
    snippet: `# Platform Admin Authentication and Persistence Boundary  **Status:** Stage 2 implementation is present in the repository. Production authentication remains disabled until a dedicated database, OIDC provider registration, runtime secrets, and the first explicitly provisioned account are configured.  ## 1. Trust boundary  Platform Admin authentication is independent from Workspace authentication. It does not read \`oxenn_session\`, \`organization_members.role\`, Workspace session snapshots, \`admin_users\`,`
  },
  {
    slug: "RBAC_MODEL",
    titleEn: "Role-Based Access Control (RBAC) Model",
    titleFa: "Role-Based Access Control (RBAC) Model",
    category: "security",
    categoryFa: "Security",
    snippet: `# Role-Based Access Control (RBAC) Model  This document describes Workspace RBAC and the separately defined Platform Admin RBAC. They have different principals, role authorities, scopes, and enforcement status. There is no implicit mapping between them.  ## 1. Workspace RBAC  ### Roles  The Workspace role union in \`src/types/auth.ts\` defines:  | Role | Intended scope | Current authority | |---|---|---| | \`viewer\` | Read-oriented access in a workspace | \`organization_members.role\` | | \`workspace_admin\``
  },
  {
    slug: "security",
    titleEn: "Security Documentation",
    titleFa: "Security Documentation",
    category: "security",
    categoryFa: "Security",
    snippet: `# Security Documentation  This section documents Oxenn's security boundaries, authorization models, and implementation status. It distinguishes repository-level code from capabilities that are only defined or scaffolded. Static source declarations do not prove deployed runtime state.  ## Status dictionary  - **Implemented**: the repository contains an enforcement path for the described boundary. This does not, by itself, prove deployed configuration or database state. - **Defined-only**: types, `
  },
  {
    slug: "SECURITY_MODEL",
    titleEn: "Security Architecture Model",
    titleFa: "Security Architecture Model",
    category: "security",
    categoryFa: "Security",
    snippet: `# Security Architecture Model  This document distinguishes the two authorization contexts in Oxenn and describes what the repository currently implements. A role name in one context does not grant a role or permission in the other context.  ## 1. Authorization boundaries  Oxenn has two distinct authorization models:  1. **Workspace authorization** governs customer/user access within an organization workspace. Its current role authority is \`organization_members.role\`. 2. **Platform Admin authoriz`
  },
  {
    slug: "kg-migration-auditor-and-backfill",
    titleEn: "Workspace Knowledge Graph Migration Auditor and Backfill",
    titleFa: "Workspace Knowledge Graph Migration Auditor and Backfill",
    category: "security",
    categoryFa: "Security",
    snippet: `# Workspace Knowledge Graph Migration Auditor and Backfill  ## Purpose  Workspace Knowledge Graph migrations must not use an unscoped \`UPDATE\` under forced Row Level Security (RLS). The ordinary Workspace migrator remains subject to tenant RLS. A separate, read-only auditor checks global integrity, while the Backfill uses the ordinary migrator one tenant at a time.  The tool is \`pnpm db:kg-integrity\`:  - \`pnpm db:kg-integrity audit\` performs a read-only global audit. - \`pnpm db:kg-integrity back`
  },
  {
    slug: "privileged-paths",
    titleEn: "Privileged Database Paths",
    titleFa: "Privileged Database Paths",
    category: "security",
    categoryFa: "Security",
    snippet: `# Privileged Database Paths  This document inventories the registered \`runWithSystemContext\` purpose tags, their verified direct call sites, and the database tables observed in those call paths. It is a documentation and audit-metadata inventory; the \`allowedTables\` field in the registry is recorded in the privileged-access audit event and is **not** a SQL table allowlist or an enforcement boundary.  The table names below use the canonical Drizzle schema names. Workspace membership and its autho`
  },
  {
    slug: "services",
    titleEn: "Service Documentation",
    titleFa: "Service Documentation",
    category: "services",
    categoryFa: "Services",
    snippet: `# Service Documentation  This section describes the internal application services, their boundaries, and responsibilities.  ## Status Dictionary - **Implemented**: Verified existing service. - **Partial**: Service exists but is missing functionality. - **Planned**: Not currently implemented.  ## Core Services  ### Asynchronous Job Processing (\`src/services/jobs/\`) Defines a canonical, infrastructure-agnostic background processing boundary via \`IJobQueue\`, \`IJobExecutor\`, and \`IJobRepository\` int`
  },
  {
    slug: "PR-137-derived-chunk-overlap",
    titleEn: "PR #137 — Derived Chunk Overlap Remediation",
    titleFa: "PR #137 — Derived Chunk Overlap Remediation",
    category: "tasks_reports",
    categoryFa: "tasks_reports",
    snippet: `# PR #137 — Derived Chunk Overlap Remediation  **Date:** 2026-11-13   **Repository:** \`DiabloNova/oxenn\`   **Branch:** \`review/058-src-012\`   **Pull request:** [#137](https://github.com/DiabloNova/oxenn/pull/137)   **Review finding:** [discussion_r4564611228](https://github.com/DiabloNova/oxenn/pull/137#discussion_r4564611228)  ## Objective and invariant  Ensure an omitted overlap for custom chunk sizes remains proportional to the chunk size, preserves room for new content and the joining separa`
  },
  {
    slug: "api-keys-prefix-index-reconciliation",
    titleEn: "Remove Redundant API-Key Prefix Index",
    titleFa: "Remove Redundant API-Key Prefix Index",
    category: "tasks_reports",
    categoryFa: "tasks_reports",
    snippet: `# Remove Redundant API-Key Prefix Index  ## Finding  The api_keys prefix column already has a uniqueness constraint, which PostgreSQL backs with a unique index. A separate non-unique index on the same prefix column duplicates that index for the same leading-column lookup pattern. This change removes only the redundant non-unique index and preserves the uniqueness guarantee.  ## Implementation  - Removed the standalone prefix index declaration from the current Drizzle schema. - Added migration 0013`
  },
  {
    slug: "pr-146-graph-ingestion-remediation-2026-11-17",
    titleEn: "PR #146 — Graph provenance and ingestion remediation",
    titleFa: "PR #146 — Graph provenance and ingestion remediation",
    category: "tasks_reports",
    categoryFa: "tasks_reports",
    snippet: `# PR #146 — Graph provenance and ingestion remediation  ## Scope  This report records the database/ingestion work performed after refreshing PR #146 from \`main\` at commit \`46d0e80d34fb432457e9d89781acd88d9ad96ac3\`.  ## Changes  - Relationship provenance is now represented as the server-managed JSONB array \`source_chunk_ids\`. New graph upserts append the current source atomically in PostgreSQL, and an edge-scoped transaction advisory lock serializes concurrent upserts. Extraction output cannot su`
  },
  {
    slug: "registration-migration-0016-snapshot-ownership-integrity",
    titleEn: "Registration Migration 0016: Snapshot and Ownership Integrity",
    titleFa: "Registration Migration 0016: Snapshot and Ownership Integrity",
    category: "tasks_reports",
    categoryFa: "tasks_reports",
    snippet: `# Registration Migration 0016: Snapshot and Ownership Integrity  ## Scope  Audited only the Workspace migration journal, Drizzle snapshot lineage, migration 0016, the user_profiles and users schema declarations, the canonical schema barrel, and the table-ownership registry on the registration-verification branch.  ## Findings  - The current database/drizzle/meta/_journal.json parses as valid JSON. Its 17 entries have sequential indexes 0 through 16, and every journal tag has a corresponding SQL `
  },
  {
    slug: "website-page-repository-alignment",
    titleEn: "Website and Page Repository Alignment — Stage 3",
    titleFa: "Website and Page Repository Alignment — Stage 3",
    category: "tasks_reports",
    categoryFa: "tasks_reports",
    snippet: `# Website and Page Repository Alignment — Stage 3  Branch: feat/stage-3-domain-model-foundation-2026-11-23  ## Changes - Website and Page reads use PostgreSQL rows, not process-local Maps after discarding the query result. - Website upsert targets the actual partial unique index on organization_id + domain when deleted_at IS NULL and returns the persisted row. - Page SQL now uses canonical http_status, meta_description, canonical_url, robots_directives and the other declared pages columns. It no`
  },
  {
    slug: "phase-2-code-security",
    titleEn: "Phase 2 — Code Security (H1, M8)",
    titleFa: "Phase 2 — Code Security (H1, M8)",
    category: "tasks_reports",
    categoryFa: "tasks_reports",
    snippet: `# Phase 2 — Code Security (H1, M8)  **Status: INCOMPLETE — VERIFICATION PENDING**   **Date:** 2026-10-19   **Repository:** [DiabloNova/oxenn](https://github.com/DiabloNova/oxenn)   **Remediation source:** [Oxenn Audit Report and Remediation Plan](https://github.com/DiabloNova/oxenn-remediation-kit/blob/main/Audit.md), [PATCH-LlmAnalyticsPanel-XSS.md](https://github.com/DiabloNova/oxenn-remediation-kit/blob/main/PATCH-LlmAnalyticsPanel-XSS.md)   **Branch:** \`fix/audit-remediation-p2\`   **Pull req`
  },
  {
    slug: "pr-146-dashboard-audit-remediation-2026-11-17",
    titleEn: "PR #146 — Dashboard and UI remediation",
    titleFa: "PR #146 — Dashboard and UI remediation",
    category: "tasks_reports",
    categoryFa: "tasks_reports",
    snippet: `# PR #146 — Dashboard and UI remediation  ## Scope  This report records the frontend and dashboard work performed after refreshing PR #146 from \`main\` at commit \`46d0e80d34fb432457e9d89781acd88d9ad96ac3\`.  ## Changes  - Removed optimistic global language state during route changes. The route locale remains authoritative until Next.js commits the destination; a cancelled navigation no longer leaves a stale language preference. - Kept document theme classes synchronized with the active theme throu`
  },
  {
    slug: "pr-98-language-routing-navigation-flash",
    titleEn: "PR #98 — Language routing and workspace navigation flash",
    titleFa: "PR #98 — Language routing and workspace navigation flash",
    category: "tasks_reports",
    categoryFa: "tasks_reports",
    snippet: `# PR #98 — Language routing and workspace navigation flash  **Status:** IMPLEMENTED — automated checks passed on source commit \`ebe2e470a8a2f78c7e85df3da5216826799fd0db\`; manual visual verification of the protected Vercel preview remains unavailable.  **Scope:** \`fix/language-toggle-route-sync\` (PR #98). This task covers the floating-navigation flash during route transitions, all navigation initiators associated with that dock, and the contract for unprefixed application paths.  ## Invariant  A `
  },
  {
    slug: "site-map-information-architecture-audit",
    titleEn: "Site Map and Product Information Architecture Audit — Oxenn / Seorchable",
    titleFa: "ممیزی معماری اطلاعات و نقشه سایت Oxenn / Seorchable",
    category: "tasks_reports",
    categoryFa: "tasks_reports",
    snippet: `# ممیزی معماری اطلاعات و نقشه سایت Oxenn / Seorchable  - تاریخ بررسی: ۲۰۲۶-۱۰-۲۹ - شاخه ممیزی: \`docs/site-map-and-product-information-architecture\` - شاخه مبنا: \`main\` - commit مبنا: \`0a85219c90ccba91d0f796dc6cdd344d84b6e003\` - نوع اقدام: بررسی و مستندسازی فقط؛ هیچ صفحه، مسیر برنامه یا رفتار اجرایی در این شاخه تغییر نکرده است.  ## 1. تصمیم‌های معماری که باید رعایت شوند  1. «راهکارها و خدمات» فقط سطح معرفی، توضیح ارزش، مخاطب هدف، موارد استفاده، وضعیت عرضه و CTA است. کار واقعی با ابزارها در داشبور`
  },
  {
    slug: "phase-3-repository-configuration-hygiene",
    titleEn: "Phase 3 — Repository and Configuration Hygiene",
    titleFa: "Phase 3 — Repository and Configuration Hygiene",
    category: "tasks_reports",
    categoryFa: "tasks_reports",
    snippet: `# Phase 3 — Repository and Configuration Hygiene  **Status:** INCOMPLETE — VERIFICATION PENDING   **Date:** 2026-10-21   **Repository:** [DiabloNova/oxenn](https://github.com/DiabloNova/oxenn)   **Remediation source:** [Audit.md](https://github.com/DiabloNova/oxenn-remediation-kit/blob/main/Audit.md), [README-FIXES.md](https://github.com/DiabloNova/oxenn-remediation-kit/blob/main/README-FIXES.md)   **Branch:** \`fix/audit-remediation-p3\`   **Base commit:** \`641b1fcb18a62e520a463b546240239b952836c2\``
  },
  {
    slug: "pr-113-phase-0-baseline-verification",
    titleEn: "PR #113 — Phase 0 Baseline and Documentation Link Guards",
    titleFa: "PR #113 — Phase 0 Baseline and Documentation Link Guards",
    category: "tasks_reports",
    categoryFa: "tasks_reports",
    snippet: `# PR #113 — Phase 0 Baseline and Documentation Link Guards  **Status:** SUCCESS — verification passed in CI run [#607](https://github.com/DiabloNova/oxenn/actions/runs/42088444363).   **Date:** 2026-11-05   **Branch:** \`mvp/phase-0-scope-baseline\`   **PR:** [#113](https://github.com/DiabloNova/oxenn/pull/113)   **Verified implementation commit:** \`97ba159c2f73536b42e3aad2d7f31c440254a586\`  ## Scope  Implement only the two documentation-quality suggestions raised during PR review:  1. Keep the Ph`
  },
  {
    slug: "audit-gate-stage3-regression-tests",
    titleEn: "Stage 3 — Audit Gate Regression Tests and Verification",
    titleFa: "Stage 3 — Audit Gate Regression Tests and Verification",
    category: "tasks_reports",
    categoryFa: "tasks_reports",
    snippet: `# Stage 3 — Audit Gate Regression Tests and Verification  **Status:** SUCCESS (Stage 3 verification passed)   **Date:** 2026-10-19   **PR:** [#86](https://github.com/DiabloNova/oxenn/pull/86)   **Branch:** \`fix/audit-remediation-p1-v1.1\`   **Verified implementation commit:** \`0e439e087922245f29476acc946374c6fe6aef0a\`  ## Invariant  The dependency audit gate must never interpret missing, empty, malformed, or ambiguous severity/patch metadata as safe evidence. Critical/high findings may be risk-ac`
  },
  {
    slug: "doc-008-platform-admin-boundary-stage-1",
    titleEn: "DOC-008 — Platform Admin Boundary (Stage 1) Report",
    titleFa: "DOC-008 — Platform Admin Boundary (Stage 1) Report",
    category: "tasks_reports",
    categoryFa: "tasks_reports",
    snippet: `# DOC-008 — Platform Admin Boundary (Stage 1) Report  **Status:** COMPLETE — Stage 1 implementation only. The later identity-provider and persistence integration stage has not started and requires separate user approval.  ## Objective and invariant  Establish a server-only Platform Admin authorization boundary that denies by default and cannot derive Platform Admin authority from Workspace sessions, Workspace roles, or caller-supplied actor fields.  ## Implementation  Created src/features/admin/security/platform-admin.server.ts.`
  },
  {
    slug: "doc-008-platform-admin-boundary-stage-2",
    titleEn: "DOC-008 — Platform Admin Boundary (Stage 2) Report",
    titleFa: "DOC-008 — Platform Admin Boundary (Stage 2) Report",
    category: "tasks_reports",
    categoryFa: "tasks_reports",
    snippet: `# DOC-008 — Platform Admin Boundary (Stage 2) Report  **Status:** Implementation committed to the existing Stage 2 branch; runtime activation and PR approval remain pending.  ## Scope and sequencing  Stage 1 was merged through PR #127. The existing \`feat/022-doc-008-platform-admin-identity\` branch was updated from \`main\` before Stage 2 work resumed. No additional branch or pull request was created. All Stage 2 changes are intended for the existing PR #128.  ## Implemented  - Added a provider-agn`
  },
  {
    slug: "zod-firecrawl-remediation",
    titleEn: "Firecrawl and Zod dependency remediation",
    titleFa: "Firecrawl and Zod dependency remediation",
    category: "tasks_reports",
    categoryFa: "tasks_reports",
    snippet: `# Firecrawl and Zod dependency remediation  **Status:** Dependency remediation and Cubic follow-up fixes passed CI on code head \`ae0eaacd3fde95eb6750cd15da91706792fb06af\`; PR #99 remains unmerged pending review. **Date:** 2026-10-25 **Branch:** fix/firecrawl-zod-remediation  ## Invariant  Every installed Zod runtime version in the resolved dependency graph must be outside the affected range of GHSA-mrhx-c7xc-m3w5, and Firecrawl crawl behavior must remain compatible. The dependency audit gate mus`
  },
  {
    slug: "conductor-review-fixes",
    titleEn: "Conductor PR #57 review fixes",
    titleFa: "Conductor PR #57 review fixes",
    category: "tasks_reports",
    categoryFa: "tasks_reports",
    snippet: `# Conductor PR #57 review fixes  - **Status:** SUCCESS (documentation correction; controller review and writeback pending). - **Invariant:** retries require reconciliation; authority and confidentiality stay explicit;   evidence fits the medium; physical safety is context-specific; dependency arithmetic includes   relationship and lag; whole-project startup and applicable commercial gates remain intact. - **Implementation:** issues 1–20 applied separately, in order, to the eight guidance files u`
  },
  {
    slug: "user-guides",
    titleEn: "User Guides",
    titleFa: "User Guides",
    category: "user-guides",
    categoryFa: "User Guides",
    snippet: `# User Guides  This section provides user-facing documentation for navigating and operating Seorchable.  ## Status Dictionary - **Implemented**: Verified user workflows supported by the UI/backend. - **Partial**: Workflow is accessible but missing edge cases or polished UI. - **Planned**: Not currently implemented.  ## Core Concepts & Workflows  ### Dashboard Navigation The platform offers an authenticated unified Dashboard Shell with collapsible responsive sidebars, directional support (RTL/LTR),`
  },
];
