# Stage 01 — Tenant-Safe Product Domain and Onboarding Foundation

## Metadata
- **Stage ID:** RM-01
- **Horizon:** Short-term MVP foundation
- **Status:** proposed
- **Prerequisite:** RM-00; Baseline Plan completion

## Objective

Provide one consistent onboarding and domain model for individuals, social sellers, brands, manufacturers, companies and organizations without weakening tenant isolation or creating unrelated identity systems.

## Customer and business value

A customer can create a workspace, establish who owns the product/business being assessed, register one or more products, provide available sources and return later without losing records. An agency may eventually manage multiple client workspaces without seeing data across unauthorized boundaries.

## Scope

- Tenant/workspace, membership and roles.
- Product/business subject ownership and access.
- Product catalog identity and source attachments.
- Explicit customer consent/authorization for websites, social data, files and field research.
- Provenance, freshness and evidence confidence.

**Non-goals:** full marketplace, autonomous execution, physical product certification or international tenant billing.

## Detailed execution

1. Confirm the canonical subject model: account user, workspace/tenant, organization/business profile, brand and product/SKU. A person can own a sole-proprietor business; do not equate each product with a tenant.
2. Reuse the post-baseline session, membership and RLS implementation. Derive tenant identity server-side; never trust caller-supplied tenant IDs as authorization.
3. Define product identity and version rules: canonical product name, SKU/model, maker, category, attributes, variations, region, language and aliases.
4. Create customer onboarding that branches only where meaningful: individual/social seller, brand/company/manufacturer, agency client management. Keep shared domain entities common.
5. Add source registration: official domain, authorized social/profile links, marketplaces, review pages and customer-uploaded documents/exports. Capture permission scope and source type.
6. Define a normalized evidence record with source URL/file reference, capture time, region/locale, extraction method/version, raw-evidence pointer, confidence, validation state and tenant/product association.
7. Build durable create/read/update/archive workflows and tenant-scoped list/search APIs.
8. Add an onboarding progress state, helpful empty states and data-correction controls.
9. Add audit events for changes to ownership, product identity, sources and permissions.

## Target files and modules

**Existing paths to reuse/review after baseline:**
- `src/core/database/tenant-context/**`
- `src/services/auth/session.ts` and `src/services/auth/authorization.ts`
- `database/schema/**` and `database/drizzle/**`
- Current repository interfaces and PostgreSQL adapters under `src/features/**/repositories/**`
- Locale routing and dashboard shell under `src/app/[locale]/dashboard/**`

**Proposed new domain paths (create only if not already present after baseline):**
- `src/features/product-intelligence/domain/**`
- `src/features/product-intelligence/application/**`
- `src/features/product-intelligence/infrastructure/persistence/**`
- `src/app/[locale]/dashboard/products/**`
- Product onboarding UI components under `src/components/features/products/**`

## Data, security and migrations

Every tenant-owned product/source/evidence record must carry tenant ownership or have a verified tenant-scoped parent relationship. Use composite foreign-key/uniqueness constraints where required to prevent cross-tenant associations. Apply versioned migrations through the single approved runner. Any production migration requires a separate review, backup/restore plan and explicit authorization.

## Testing

Test individual and organization-owned products, multiple products per tenant, agency access to explicitly authorized clients, revoked memberships, forged identifiers, file/source permission boundaries, duplicate product identities and concurrent updates. Test RLS using a non-owner database role.

## Parallelization

Domain contract, UX research and evidence schema proposal may proceed as separate design workstreams. Schema, repository and API implementation should be integrated sequentially against one approved domain contract. UI implementation can proceed in parallel only after request/response contracts and permission states are fixed.

## Acceptance criteria

- A new customer can create a valid workspace and product profile.
- Product and evidence records persist across application instances.
- Cross-tenant reads/writes are denied at the application and database layers.
- Source permissions and data provenance are retained.
- Persian RTL and English LTR onboarding work and are accessible.
- Demo data never appears in customer workspaces unless explicitly marked demo.

## Deliverables and success indicators

A tenant-safe product profile, onboarding flow, evidence/source registry and auditable permission model. Measure onboarding completion, time to first product, source attachment success, persistence reliability and cross-tenant test results.

## Risks and open decisions

Resolve whether an agency receives a parent tenant with delegated client workspaces or separate tenants with explicit membership. Avoid designing a generic CRM before a validated need exists.
