# Optimization Scope and Operation Run Contract

**Status:** Stage 3 domain contract — defined; persistence and runtime enforcement are not yet implemented.
**Applies to:** Project-scoped operations in the Workspace database.
**Canonical Project model:** `websites` (one managed website/domain per Project).
**Tenant root:** `organizations` (Workspace).

This contract defines how an operation identifies the Project it acts on and the exact subset of that Project it is allowed to process. It is a domain contract, not evidence that the current database already implements it.

## 1. Decisions

1. A Project is one managed website/domain and is represented by the existing `websites` model. Do not add a parallel `projects` table.
2. One Workspace may own multiple Projects. A Project belongs to exactly one Workspace.
3. An Operation is the logical capability/action (for example, website discovery or technical analysis). An **OperationRun** is one concrete invocation of that capability.
4. Every Project-scoped OperationRun belongs to exactly one Workspace and exactly one Project.
5. Every Project-scoped OperationRun has exactly one Optimization Scope. The scope belongs to that run, not to the Project.
6. A scope is immutable after the run is accepted/queued. A changed scope creates a new run; it must not rewrite the meaning of an existing run or its results.
7. A Project can be used by many runs with different scopes. A run cannot span multiple Projects in Stage 3.
8. Product, Service and Offer context is optional and is not required to create a Project, discover a website, or run a website-level operation.
9. Existing capability-specific records (for example `crawl_jobs`, `prompt_executions`, monitoring configurations and their results) remain in place. The shared run contract connects them; it does not replace them.

## 2. Domain vocabulary and cardinality

```
Workspace (organizations)
  1 ───── 0..N Project (websites)
                 1 ───── 0..N Page (pages)

Project
  1 ───── 0..N OperationRun
                 1 ───── 1 OptimizationScope (immutable value object)
                                0..N explicit Page targets
```

- **Project:** the website boundary. Its identity is `websiteId`; `organizationId` is the owner/tenant boundary.
- **Operation:** a capability/action type. It is not itself a run and does not own results.
- **OperationRun:** the durable record of one invocation, its lifecycle and attribution.
- **OptimizationScope:** an immutable value object inside one OperationRun. It states which part of that run's Project is in scope.
- **Page target:** an existing `pages.id` that must belong to the same Workspace and Project as the run.

The scope is conceptually separate from Project because the Project does not have one permanent optimization scope. The same Project can be operated on at whole-site, single-page or selected-pages scope on different runs.

## 3. OptimizationScope contract

Version 1 supports exactly three modes:

### 3.1 Whole website

```ts
type WholeWebsiteScope = {
  kind: "whole_website";
  websiteId: string;
  version: 1;
};
```

- Targets the Project as a whole.
- Carries no caller-supplied page IDs.
- Used for initial website discovery/crawl and any operation whose contract explicitly covers the entire website.
- Pages actually discovered or processed are recorded as run outputs/target manifest, not retroactively added to the scope definition.
- For analyses that operate on an existing page inventory, the run records the page-inventory snapshot or resolved target manifest used at execution time.

### 3.2 Single page

```ts
type SinglePageScope = {
  kind: "single_page";
  websiteId: string;
  pageId: string;
  version: 1;
};
```

- Targets exactly one existing Page.
- The Page must be active and belong to the same `websiteId` and `organizationId` as the OperationRun.
- A raw URL is not a substitute for `pageId`. If a URL has not yet been discovered/registered as a Page, it must first pass through the appropriate discovery/registration flow.

### 3.3 Selected pages

```ts
type SelectedPagesScope = {
  kind: "selected_pages";
  websiteId: string;
  pageIds: readonly string[];
  version: 1;
};
```

- Targets an explicit set of at least two distinct existing Pages.
- Every Page must belong to the same Project and Workspace as the OperationRun.
- Duplicate IDs are rejected. IDs are canonicalized (sorted) for equality and fingerprinting; selection order is not semantically significant.
- If the caller selects exactly one page for a single-page operation, normalize to `single_page`. Do not persist an ambiguous one-element `selected_pages` set.

The discriminated union is:

```ts
type OptimizationScope =
  | WholeWebsiteScope
  | SinglePageScope
  | SelectedPagesScope;
```

The server derives `organizationId` from the authenticated tenant context. It must not accept caller-provided tenant identity as authoritative.

## 4. Operation and OperationRun contract

An Operation is a registered capability type, not a separate persistence entity in Stage 3. A registry in application/domain code defines supported operation types and their scope requirements. Avoid a database enum that makes adding a capability require a schema migration.

Each Project-scoped invocation creates one OperationRun with, at minimum, these logical fields:

| Field | Meaning / invariant |
|---|---|
| `id` | Stable UUID for this invocation |
| `organizationId` | Derived from trusted server tenant context |
| `websiteId` | Required Project reference |
| `operationType` | Stable registered capability key, e.g. `website_discovery`, `technical_audit`, `seo_analysis`, `aeo_analysis`, `geo_analysis`, `monitoring_check`, `content_analysis`, `report_generation` |
| `scope` | Exactly one OptimizationScope, validated against the run's Project |
| `status` | `queued`, `running`, `succeeded`, `partial`, `failed`, or `cancelled` |
| `triggerType` | `user`, `schedule`, or `system` |
| `requestedBy` | Authenticated user ID for user-triggered work; nullable for trusted system work |
| `idempotencyKey` | Stable key for safely deduplicating the same invocation |
| `correlationId`, `requestId`, `traceId` | Optional cross-service observability identifiers |
| `createdAt`, `startedAt`, `completedAt` | Lifecycle timestamps |
| `attemptCount`, `version` | Retry and optimistic-concurrency tracking |

The exact status vocabulary must be reconciled with each existing child state machine before implementation; this table is the shared run lifecycle, not a replacement for worker-specific statuses.

### Run and retry semantics

- A retry of the same accepted invocation remains the same OperationRun; worker/job attempts are tracked beneath it.
- An explicit user-requested re-run is a new OperationRun, even if the operation type and scope are identical.
- An idempotent duplicate submission must resolve to the existing run rather than create a second run with duplicate results.
- A scheduled MonitoringConfig is a recurring definition, not an OperationRun. Each scheduled check creates a distinct run.
- A multi-capability workflow is not represented by one run silently changing scope. It may later use a parent workflow with child runs; that orchestration abstraction is not required to define this Stage 3 contract.

## 5. Persistence shape recommended for Stage 3

The minimal relational design is:

### `operation_runs`

A tenant-owned run table with `id`, `organization_id`, `website_id`, `operation_type`, `scope_kind`, scope version/fingerprint, lifecycle fields and observability fields.

The run stores the scope discriminator and immutable scope metadata. It does not store a permanent scope on `websites`.

### `operation_run_scope_pages`

A tenant-owned junction table for explicit page targets, with:

- `operation_run_id`
- `organization_id`
- `website_id`
- `page_id`

It contains rows only for `single_page` and `selected_pages`; a whole-website scope has no explicit page rows. A single-page scope has exactly one row; selected-pages has at least two. These cardinalities must be validated transactionally and, if direct SQL writes can bypass the application service, enforced with a deferred database constraint trigger.

This design deliberately does **not** introduce a separate `optimization_scopes` table in v1. Scope has no independent lifecycle or reuse outside its OperationRun, so it is best modeled as an immutable value object owned by the run. The junction table provides relational Page references without putting arrays of UUIDs in JSONB.

### Referential integrity requirements

The canonical schema must expose matching unique keys so composite foreign keys can prove same-tenant, same-Project ownership:

- `websites(id, organization_id)`
- `pages(id, organization_id, website_id)`
- `operation_runs(id, organization_id, website_id)`

Then:

- `operation_runs(website_id, organization_id)` references the owning Website.
- `operation_run_scope_pages(operation_run_id, organization_id, website_id)` references its OperationRun.
- `operation_run_scope_pages(page_id, organization_id, website_id)` references its Page.

The current schema already has a unique key on `pages(id, organization_id)`, but not the required three-column key; `websites` also needs a matching composite unique key before the proposed composite references can be created. These are schema gaps to verify against the full migration/snapshot history before any migration is authored.

Do not weaken or remove existing single-column foreign keys until the replacement composite constraints have been successfully installed and verified.

## 6. Relationship to existing capability records and outputs

The shared OperationRun is the attribution root. Existing specialized records remain responsible for their own domain-specific details and state machines.

| Existing record | Contractual relationship |
|---|---|
| `crawl_jobs` | Child execution/worker record of a website-discovery or crawl OperationRun |
| `crawl_results` | Remains attached to its CrawlJob; the run is resolved through that parent |
| `monitoring_configs` | Recurring configuration attached to a Project; not a run |
| `crawl_snapshots` / `monitoring_alerts` | Outputs of a particular monitoring run; must be attributable to that run and Project |
| `prompt_executions` | Child execution of an AI visibility/AEO/GEO OperationRun |
| Audit/analysis results | Must reference the run that produced them, directly or through a strictly enforced parent |
| Reports | Must reference the run(s) and evidence from which they were produced; they must not infer scope from the current Project state |

A result should not independently accept a caller-supplied `websiteId` or `scope` that can disagree with its OperationRun. Prefer deriving attribution through the run. If denormalized attribution columns are necessary for query performance, enforce them with composite foreign keys and test that they cannot disagree.

An operation-specific child record may not silently broaden the parent scope. If a downstream task needs a different target set, create a separate OperationRun with its own scope.

## 7. Resolution, snapshots and reproducibility

The scope definition and the resolved work set are distinct:

- **Definition:** what the caller authorized — whole website, one Page, or a selected set of Pages.
- **Resolved target manifest:** which concrete Page versions/records the execution actually processed.

For selected-page scope, the requested Page IDs are frozen when the run is accepted. For whole-website scope, the run resolves the eligible Page inventory at the operation's defined resolution point. Website discovery may discover new Pages during execution; those discovered targets belong in the run's result manifest, not in a mutable rewrite of the original scope.

Persist enough information to reproduce the meaning of a run: scope version, canonical fingerprint, resolution timestamp, and the actual target manifest or a durable reference to it. Page content versions/hashes and crawl timestamps belong to the evidence/result provenance, not to the scope identity itself.

A scope fingerprint is deterministic over `organizationId`, `websiteId`, scope kind, scope contract version, and sorted explicit Page IDs. Operation policy/options have a separate input/configuration fingerprint; do not mix them into the scope fingerprint.

## 8. Validation and security invariants

Before a run is accepted:

1. Resolve the active Workspace from trusted session/tenant context.
2. Load the Project using both `websiteId` and the active `organizationId`; reject absent, deleted or foreign Projects.
3. Validate each selected Page under the same `organizationId` and `websiteId`; reject foreign, deleted, duplicate or nonexistent IDs.
4. Validate scope cardinality and operation-type compatibility.
5. Persist the OperationRun, explicit Page targets, and initial child execution records in one transaction where applicable.
6. Enforce RLS on every tenant-owned table and composite foreign keys for tenant/Project consistency. RLS alone is not a substitute for referential integrity.
7. Never derive authorization from a caller-supplied `organizationId`, `tenantId`, URL host or page ID alone.

Failure behavior is fail-closed: no run is queued if Project or Page validation fails; no partial scope is persisted; a cross-tenant or cross-Project Page ID is rejected without revealing whether the foreign record exists.

## 9. Lifecycle and deletion

- The OperationRun and its scope are immutable after acceptance. Correcting a selection means creating a new run.
- Soft-deleting a Website or Page must not rewrite historical runs or their target manifests.
- Historical OperationRuns and their results must not be cascade-deleted merely because a Project is soft-deleted.
- Hard deletion, if ever required by retention/privacy policy, needs a separately designed archival/redaction policy. Do not add broad `ON DELETE CASCADE` from Website/Page to historical execution records by default.
- A failed or partial run retains its original scope and its failure/coverage metadata.

## 10. Explicit non-goals

This contract does not:

- Create a `projects` table or duplicate `websites`.
- Make Product/Service/Offer mandatory.
- Turn a Project into a single permanent scope.
- Replace `crawl_jobs`, `prompt_executions`, MonitoringConfig or capability-specific state machines.
- Define a generic workflow engine, approval engine, billing model or cross-Project portfolio run.
- Author or apply a database migration, alter snapshots/journals, or connect to a live database.
- Claim runtime enforcement before the schema, repositories, authorization boundary and negative integration tests are implemented.

## 11. Implementation and acceptance sequence

1. Inventory every Project-scoped operation and its current execution/result tables; distinguish actual run records from schedules/configuration and transient worker attempts.
2. Confirm the operation-type registry and map each type to allowed scope kinds.
3. Add the shared OperationRun and scope domain contracts and validation functions.
4. Add the canonical Drizzle schema and ownership-registry entries only after confirming the final table set and composite-key design.
5. Generate and review a migration; preflight existing data before adding composite constraints. Update journal/snapshot/generated tenant table inventory consistently.
6. Link existing Crawl, Monitoring, Prompt/AI observation, Audit and Report records to OperationRun without replacing their current state machines.
7. Add unit tests for the scope union, normalization, cardinality, immutability and operation compatibility.
8. Add PostgreSQL isolation tests for foreign Workspace, foreign Project, foreign Page, deleted Page, mismatched website/page pairs, and scope cardinality. Use only the disposable isolated database; never a live database.
9. Verify positive cases for whole-site discovery, one-page analysis, multi-page analysis, repeated runs with different scopes, retries preserving scope, and explicit reruns creating new run identities.

**Completion state:** The domain contract is defined in this document. The runtime contract is **not yet implemented or verified**. No database schema, migration, snapshot, journal, generated ownership inventory, application code or live database was changed as part of defining this contract.
